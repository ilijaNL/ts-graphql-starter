import path from 'path';
import ENVS from '@/env';
import { migrate } from '@/utils/migration';
import { registerPool } from '@/utils/plugins/pg-pool';
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import type { DB } from './__generated__/auth-db';
import { QueryCreator } from 'kysely';
import { registerKysely } from '@/utils/plugins/kysely';
import { oauth } from './oauth';
import { createIDToken, getIdToken, signIDToken, verifyRequestToken } from './common';
import { access_token } from './access-token';

export type AuthQueryBuilder = QueryCreator<DB>;

declare module 'fastify' {
  export interface FastifyInstance {
    db_auth: AuthQueryBuilder;
  }
}

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

  // ROUTES REGISTRATION

  /**
   * oAuth providers
   */
  fastify.register(oauth);

  /**
   * Redeem the request token whichs results in a refresh token
   */
  fastify.post(
    '/redeem',
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
      // AND get account
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

  fastify.register(access_token);
};
