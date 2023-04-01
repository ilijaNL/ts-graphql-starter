import { isError, toResult } from '@/utils/utils';
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox';
import _merge from 'lodash/merge';
import { AccessToken, getIdToken, signAccessToken } from './common';

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
  if (!(claim.type === 'hasura' && claim.role === 'user')) {
    return token;
  }

  // todo check if users has role
  return _merge(token, {
    [hasuraNamespace]: {
      'X-Hasura-Default-Role': defaultHasuraRole,
      'X-Hasura-Allowed-Roles': [defaultHasuraRole],
      'X-Hasura-User-Id': token.acc_id,
    },
  });
};

// add more extensions to add more claims
const EXTENSIONS: Array<AccessTokenExtension> = [hasuraUserExtensions];

export const access_token: FastifyPluginAsyncTypebox = async (fastify) => {
  /**
   * Get access token for a user
   */
  fastify.post(
    '/access-token',
    {
      schema: {
        body: Type.Object({
          rt: Type.String({
            minLength: 10,
          }),
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

      if (!account_id) {
        throw fastify.httpErrors.unauthorized();
      }

      const userOrError = await toResult(
        fastify.db_auth
          .selectFrom('accounts')
          .select('id')
          .where('id', '=', account_id)
          // check if token version is changed
          .where('token_version', '=', token_version)
          .executeTakeFirst()
      );

      if (isError(userOrError)) {
        fastify.log.error(userOrError);
        throw fastify.httpErrors.unauthorized();
      }

      if (!userOrError) {
        throw fastify.httpErrors.unauthorized();
      }

      const accessToken: AccessToken = {
        acc_id: userOrError.id,
        sub: userOrError.id,
      };

      const finalToken = await claims.reduce(
        (agg, claim) =>
          agg.then((d) =>
            EXTENSIONS.reduce((agg, extension) => agg.then((r) => extension(r, claim)), Promise.resolve(d))
          ),
        Promise.resolve(accessToken)
      );

      return {
        access_token: signAccessToken(finalToken),
      };
    }
  );
};
