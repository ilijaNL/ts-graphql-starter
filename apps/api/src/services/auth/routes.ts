import _merge from 'lodash/merge';
import createHttpError from 'http-errors';
import { ShortToken } from './actions/common';
import { createExecute } from '@/utils/actions';
import { AccessToken } from '.';
import { Static } from 'typed-client';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { registerRoutes } from '@/utils/typed-client';
import { getPoolFromFastify } from '@/utils/plugins/pg-pool';
import { auth } from '@ts-hasura-starter/api';

const hasuraNamespace = 'hg';
const defaultHasuraRole = 'user';

type AccessTokenExtension = (
  baseToken: AccessToken,
  claim: Static<(typeof auth.contract)['access-token']['body']>['token']
) => AccessToken | Promise<AccessToken>;

const hasuraUserRoleExtensions: AccessTokenExtension = (token) => {
  return _merge(token, {
    [hasuraNamespace]: {
      'X-Hasura-Default-Role': defaultHasuraRole,
      'X-Hasura-Allowed-Roles': [defaultHasuraRole],
      'x-hasura-user-id': token.acc_id,
    },
  });
};

// add more extensions to add more claims
const EXTENSIONS: Array<AccessTokenExtension> = [hasuraUserRoleExtensions];

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  const execute = createExecute(getPoolFromFastify(app));

  void registerRoutes(auth.contract, {
    sendOTP: (config) => {
      app.route({
        ...config,
        async handler() {
          await execute(app.authService.sendOTP)(null, {});

          return {
            ok: true,
          };
        },
      });
    },
    signInWithOTP: (config) => {
      app.route({
        ...config,
        async handler(req) {
          const { body: input } = req;
          const result = await execute(app.authService.signInWithOTP)({ token: input.token, value: input.value }, null);

          return {
            refreshToken: result.jwt_refresh_token,
          };
        },
      });
    },
    redeem: (config) => {
      app.route({
        ...config,
        async handler(req) {
          const { body } = req;
          const { jwt_refresh_token } = await execute(app.authService.oauth.redeem)(body, null);

          return {
            refreshToken: jwt_refresh_token,
          };
        },
      });
    },

    refresh: (config) => {
      app.route({
        ...config,
        async handler(req) {
          const { jwt_refresh_token } = await app.authService.refresh(req.body.rt);
          return {
            refreshToken: jwt_refresh_token,
          };
        },
      });
    },
    ['access-token']: (config) => {
      app.route({
        ...config,
        async handler(req) {
          const { rt: refresh_token, token } = req.body;

          const user = await app.authService.getUserFromToken(refresh_token);

          if (!user) {
            throw new createHttpError.NotFound('user not found');
          }

          const shortToken: ShortToken = {
            acc_id: user.id,
            sub: user.id,
          };

          const finalToken = await EXTENSIONS.reduce(
            (agg, extension) => agg.then((r) => extension(r, token)),
            Promise.resolve(shortToken)
          );

          return {
            access_token: app.authService.signShortToken(finalToken),
          };
        },
      });
    },
  });
};
