import { createProcedures } from '@/utils/rpc';
import { FastifyInstance } from 'fastify';
import _merge from 'lodash/merge';
import { auth, Static } from '@ts-hasura-starter/api';
import { AccessToken } from '@/jwt';
import { AuthService } from './lib';
import createHttpError from 'http-errors';
import { ShortToken } from './lib/common';

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

export type ProcedureContext = {
  fastify: FastifyInstance;
  authService: AuthService;
};

export const authProcedures = createProcedures(auth.contract)<ProcedureContext>({
  async sendOTP(input, { authService }) {
    await authService.otp.sendOpt(input);

    return {
      ok: true,
    };
  },
  async signInWithOTP(input, { authService }) {
    const { jwt_refresh_token } = await authService.otp.signInWithOTP({ token: input.token, value: input.value });
    return {
      refreshToken: jwt_refresh_token,
    };
  },
  /**
   * Redeem request token, which is generating from oauth flow
   */
  async redeem({ token, code_verifier }, { authService }) {
    const { jwt_refresh_token } = await authService.oauth.redeem({ code_verifier, token });

    return {
      refreshToken: jwt_refresh_token,
    };
  },
  async refresh({ rt }, { authService }) {
    const { jwt_refresh_token } = await authService.refresh(rt);
    return {
      refreshToken: jwt_refresh_token,
    };
  },
  async 'access-token'(input, { authService }) {
    const { rt: refresh_token, claims } = input;

    const user_id = await authService.getUserId(refresh_token);

    if (!user_id) {
      throw new createHttpError.NotFound('user not found');
    }

    const shortToken: ShortToken = {
      acc_id: user_id,
      sub: user_id,
    };

    const finalToken = await claims.reduce(
      (agg, claim) =>
        agg.then((d) =>
          EXTENSIONS.reduce((agg, extension) => agg.then((r) => extension(r, claim)), Promise.resolve(d))
        ),
      Promise.resolve(shortToken)
    );

    return {
      access_token: authService.jwtFactory.signShortToken(finalToken),
    };
  },
});
