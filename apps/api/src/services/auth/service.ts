import { createProcedures } from '@/utils/rpc';
import { FastifyInstance } from 'fastify';
import { createIDToken, getIdToken, signAccessToken, signIDToken, verifyRequestToken } from './common';
import { isError, toResult } from '@/utils/utils';
import _merge from 'lodash/merge';
import { auth, Static } from '@ts-hasura-starter/api';
import { Pool } from 'pg';
import { QueryCreator } from 'kysely';
import { DB } from './__generated__/auth-db';
import { AccessToken } from '@/jwt';

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
  pool: Pool;
  builder: QueryCreator<DB>;
};

export const authProcedures = createProcedures(auth.contract)<ProcedureContext>({
  async redeem({ t }, { fastify, builder }) {
    const verifiedToken = verifyRequestToken(t);

    if (!verifiedToken) {
      throw fastify.httpErrors.unauthorized('invalid-token');
    }

    // get account
    const account = await builder
      .selectFrom('account_providers as ap')
      .innerJoin('accounts as aa', 'aa.id', 'ap.account_id')
      .select(['aa.id', 'aa.token_version'])
      .where('ap.provider', '=', verifiedToken.provider)
      .where('ap.provider_account_id', '=', verifiedToken.p_account_id)
      .executeTakeFirst();

    if (!account) {
      throw fastify.httpErrors.notFound();
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
  },
  async refresh({ rt }, { fastify, builder }) {
    const refresh_token = rt;
    const idToken = getIdToken(refresh_token);

    if (!idToken) {
      throw fastify.httpErrors.unauthorized('invalid-token');
    }

    // check if allowed to refresh
    // AND get account
    const account = await builder
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
  },
  async 'access-token'(input, { fastify, builder }) {
    const { rt: refresh_token, claims } = input;
    const idToken = getIdToken(refresh_token);

    if (!idToken) {
      throw fastify.httpErrors.unauthorized();
    }

    const { account_id, token_version } = idToken;

    if (!account_id) {
      throw fastify.httpErrors.unauthorized();
    }

    const userOrError = await toResult(
      builder
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
  },
});
