import path from 'path';
import ENVS from '@/env';
import { migrate } from '@/utils/migration';
import { registerPool } from '@/utils/plugins/pg-pool';
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox';
import type { DB } from './__generated__/auth-db';
import { QueryCreator } from 'kysely';
import { registerKysely } from '@/utils/plugins/kysely';
import { oauth } from './oauth';
import { AccessToken, createIDToken, getIdToken, signAccessToken, signIDToken, verifyRequestToken } from './common';
import _merge from 'lodash/merge';

export type AuthQueryBuilder = QueryCreator<DB>;

declare module 'fastify' {
  export interface FastifyInstance {
    db_auth: AuthQueryBuilder;
  }
}
const HasuraClaimSchema = Type.Object({
  type: Type.Literal('hasura'),
  role: Type.Union([Type.Literal('user')]),
});
const ClaimSchema = Type.Union([HasuraClaimSchema]);

// Same as defined in HASURA_GRAPHQL_JWT_SECRET environment for hasura
const hasuraNamespace = 'graphql';
const defaultHasuraRole = 'user';

type AccessTokenExtension = (
  baseToken: AccessToken,
  claim: Static<typeof ClaimSchema>
) => AccessToken | Promise<AccessToken>;

const hasuraUserExtensions: AccessTokenExtension = (token, claim) => {
  if (claim.type !== 'hasura') {
    return token;
  }

  return _merge(token, {
    [hasuraNamespace]: {
      'X-Hasura-Default-Role': defaultHasuraRole,
      'X-Hasura-Allowed-Roles': [defaultHasuraRole],
      'X-Hasura-User-Id': token.acc_id,
    },
  });
};

const accessTokenExtensions: Array<AccessTokenExtension> = [hasuraUserExtensions];

/**
 * Setup the service and expose as authService
 */
export const authService: FastifyPluginAsyncTypebox<{ schema?: string }> = async (fastify, opts) => {
  // SETUP
  const dbSchema = opts.schema ?? 'auth';
  await registerPool(fastify, { connectionString: ENVS.PG_CONNECTION, max: 5 });
  await migrate(fastify.pgPool, {
    // we need to have migrations in the root directory because typescript wont copy the sql files when build
    directory: path.join(process.cwd(), 'migrations', 'auth'),
    schema: dbSchema,
  });

  await registerKysely(fastify, { namespace: 'db_auth', schema: dbSchema });
  // register routes

  /**
   * oAuth providers
   */
  fastify.register(oauth);

  /**
   * Request the id token by providing a request token which include the provider information
   */
  fastify.post(
    '/request',
    {
      schema: {
        body: Type.Object({
          r: Type.String({}),
        }),
        response: {
          '2xx': Type.Object({
            refreshToken: Type.String(),
          }),
        },
      },
    },
    async (req, reply) => {
      const verifiedToken = verifyRequestToken(req.body.r);

      if (!verifiedToken) {
        throw fastify.httpErrors.unauthorized('invalid-token');
      }

      // get account
      const account = await fastify.db_auth
        .selectFrom('account_providers as ap')
        .innerJoin('accounts as aa', 'aa.id', 'ap.account_id')
        .select(['aa.id', 'aa.token_version'])
        .where('ap.provider', '=', verifiedToken.provider)
        .where('ap.provider_account_id', '=', verifiedToken.p_account_id)
        .executeTakeFirst();

      if (!account) {
        return reply.notFound();
      }

      const refreshToken = createIDToken({
        provider: {
          n: verifiedToken.provider,
          p_id: verifiedToken.p_account_id,
        },
        sub: account.id,
        account_id: account.id,
        token_version: account.token_version,
      });

      return {
        refreshToken: signIDToken(refreshToken),
      };
    }
  );

  /**
   * Refresh refresh token
   */
  fastify.post(
    '/refresh',
    {
      schema: {
        body: Type.Object({
          refresh_token: Type.String({}),
        }),
        response: {
          '2xx': Type.Object({
            refreshToken: Type.String(),
          }),
        },
      },
    },
    async (request) => {
      const { refresh_token } = request.body;
      const idToken = getIdToken(refresh_token);

      if (!idToken) {
        throw fastify.httpErrors.unauthorized('invalid-token');
      }

      // check if allowed to refresh
      // get account
      const account = await fastify.db_auth
        .selectFrom('account_providers as ap')
        .innerJoin('accounts as aa', 'aa.id', 'ap.account_id')
        .select(['aa.id', 'aa.token_version'])
        .where('aa.id', '=', idToken.account_id)
        .where('aa.token_version', '=', idToken.token_version)
        // optional to check if provider still exists
        .where('ap.provider', '=', idToken.provider.n)
        .where('ap.provider_account_id', '=', idToken.provider.p_id)
        .executeTakeFirst();

      // check if refresh token is same as in token
      if (!account) {
        throw fastify.httpErrors.forbidden('invalid-token');
      }

      const refreshToken = createIDToken({
        provider: idToken.provider,
        sub: account.id,
        account_id: account.id,
        token_version: account.token_version,
      });

      return {
        refreshToken: signIDToken(refreshToken),
      };
    }
  );

  /**
   * Get access token for a user
   */
  fastify.post(
    '/access-token',
    {
      schema: {
        body: Type.Object({
          rt: Type.String({}),
          claims: Type.Array(
            Type.Union([
              Type.Object({
                type: Type.Literal('hasura'),
                role: Type.Union([Type.Literal('user')]),
              }),
            ])
          ),
        }),
        response: {
          '2xx': Type.Object({
            access_token: Type.String(),
          }),
        },
      },
    },
    async (req) => {
      const { rt: refresh_token, claims } = req.body;
      const idToken = getIdToken(refresh_token);

      if (!idToken) {
        throw fastify.httpErrors.unauthorized();
      }

      const { account_id, token_version } = idToken;

      // for optimalization remove the account validation and assume id token is source of truth
      if (!account_id) {
        throw fastify.httpErrors.unauthorized();
      }

      const account = await fastify.db_auth
        .selectFrom('accounts')
        .select('id')
        .where('id', '=', account_id)
        // check if token version is changed
        .where('token_version', '=', token_version)
        .executeTakeFirst();

      if (!account) {
        throw fastify.httpErrors.unauthorized();
      }

      const accessToken: AccessToken = {
        acc_id: account.id,
        sub: account.id,
      };

      const finalToken = await claims.reduce(
        (agg, claim) =>
          agg.then((d) =>
            accessTokenExtensions.reduce((agg, extension) => agg.then((r) => extension(r, claim)), Promise.resolve(d))
          ),
        Promise.resolve(accessToken)
      );

      return {
        access_token: signAccessToken(finalToken),
      };
    }
  );
};
