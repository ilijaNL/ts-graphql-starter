import { createProcedures } from '@/utils/rpc';
import _merge from 'lodash/merge';
import { auth, Static } from '@ts-hasura-starter/api';
import { AccessToken } from '@/jwt';
import createHttpError from 'http-errors';
import { ShortToken } from './auth/common';
import { AuthService } from './auth';
import { execute } from '@/utils/actions';
import { Pool } from 'pg';

const hasuraNamespace = 'hg';
const defaultHasuraRole = 'user';

type AccessTokenExtension = (
  baseToken: AccessToken,
  claim: Static<(typeof auth.contract)['access-token']['input']>['claims'][number]
) => AccessToken | Promise<AccessToken>;

const hasuraUserRoleExtensions: AccessTokenExtension = (token, claim) => {
  if (!(claim.type === 'hasura' && claim.role === 'user')) {
    return token;
  }

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

export type ProcedureContext = {};

export const createAuthProcedures = (deps: { authService: AuthService; pg: Pool }) =>
  createProcedures(auth.contract)<ProcedureContext>({
    async sendOTP() {
      deps.authService.sendOTP();

      return {
        ok: true,
      };
    },
    async signInWithOTP(input) {
      // const { jwt_refresh_token } = await authService.signInWithOTP({ token: input.token, value: input.value });

      const result = await execute(deps.pg, deps.authService.signInWithOTP)(
        { token: input.token, value: input.value },
        null
      );

      return {
        refreshToken: result.jwt_refresh_token,
      };
    },
    /**
     * Redeem request token, which is generating from oauth flow
     */
    async redeem({ token, code_verifier }) {
      const { jwt_refresh_token } = await execute(deps.pg, deps.authService.oauth.redeem)(
        { code_verifier, token },
        null
      );

      return {
        refreshToken: jwt_refresh_token,
      };
    },
    async refresh({ rt }) {
      const { jwt_refresh_token } = await deps.authService.refresh(rt);
      return {
        refreshToken: jwt_refresh_token,
      };
    },
    async 'access-token'(input) {
      const { rt: refresh_token, claims } = input;

      const user = await deps.authService.getUserFromToken(refresh_token);

      if (!user) {
        throw new createHttpError.NotFound('user not found');
      }

      const shortToken: ShortToken = {
        acc_id: user.id,
        sub: user.id,
      };

      const finalToken = await claims.reduce(
        (agg, claim) =>
          agg.then((d) =>
            EXTENSIONS.reduce((agg, extension) => agg.then((r) => extension(r, claim)), Promise.resolve(d))
          ),
        Promise.resolve(shortToken)
      );

      return {
        access_token: deps.authService.signShortToken(finalToken),
      };
    },
  });
