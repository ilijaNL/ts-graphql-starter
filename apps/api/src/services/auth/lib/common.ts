import type { QueryCreator } from 'kysely';
import type { DB } from '../__generated__/auth-db';
import { createSigner, createVerifier } from 'fast-jwt';

export type Provider =
  | 'email'
  | 'phone'
  // oauths
  | 'github'
  | 'twitter'
  | 'google'
  | 'linkedin'
  | 'microsoft';

export type OAuthProviders = Exclude<Provider, 'email' | 'phone'>;
export type QueryBuilder = QueryCreator<DB>;

export type RequestToken = {
  account_id: string;
  provider: Provider;
  p_account_id: string;
};

export type Account = {
  account_id: string;
  /**
   * Can be used to invalidate user
   */
  token_version: number;
};

export type RefreshToken = {
  sub: string;
  // provider: {
  //   n: Provider;
  //   p_id: string;
  // };
} & Account;

export type ShortToken = {
  acc_id: string;
  sub: string;
  [claim: string]: any;
};

export type JWTFactory = ReturnType<typeof createJWTFactory>;

export type JWTOptions = {
  iss: string;
  secret: string;
  refreshTokenInSec: number;
  shortTokenInSec: number;
};

export const createJWTFactory = (props: JWTOptions) => {
  const { refreshTokenInSec: expireInSec, iss, secret, shortTokenInSec } = props;

  const _verifyRefreshToken = createVerifier({
    key: secret,
    cache: true,
    allowedIss: [iss],
  });

  const _signRefreshToken = createSigner({
    key: secret,
    expiresIn: expireInSec * 1000,
    iss: iss,
  });

  const _signShortToken = createSigner({
    key: secret,
    expiresIn: shortTokenInSec * 1000,
    iss: iss,
  });

  /**
   * Used as refresh token
   */
  function signRefreshToken(token: RefreshToken) {
    return _signRefreshToken(token);
  }

  const createRefreshToken = (payload: RefreshToken): RefreshToken => payload;

  function getRefreshToken(jwt: string): RefreshToken | null {
    try {
      return _verifyRefreshToken(jwt);
    } catch (e) {
      return null;
    }
  }

  function signShortToken(token: ShortToken) {
    return _signShortToken(token);
  }

  function getShortToken(jwt: string): ShortToken | null {
    try {
      return _verifyRefreshToken(jwt);
    } catch (e) {
      return null;
    }
  }

  return {
    signRefreshToken,
    createRefreshToken,
    getRefreshToken,
    signShortToken,
    getShortToken,
  };
};

export type ProviderInput = { provider: Provider; provider_acc_id: string };

export const addProviderQuery = (builder: QueryBuilder, account_id: string, input: ProviderInput) =>
  builder
    .insertInto('account_providers')
    .values({
      account_id: account_id,
      provider: input.provider,
      provider_account_id: input.provider_acc_id,
    })
    .onConflict((cb) =>
      cb.columns(['account_id', 'provider']).doUpdateSet({
        provider: input.provider,
        provider_account_id: input.provider_acc_id,
      })
    )
    .compile();

export const createAccountQuery = (builder: QueryBuilder, input: { id: string }) =>
  builder
    .insertInto('accounts')
    .values({
      disabled: false,
      version: 1,
      token_version: 1,
      id: input.id,
    })
    .compile();

export const setAccountInfoQuery = (
  builder: QueryBuilder,
  input: { account_id: string; displayName?: string; avatar_url?: string; locale?: string }
) =>
  builder
    .insertInto('account_info')
    .values({
      account_id: input.account_id,
      locale: input.locale,
      avatar_url: input.avatar_url,
      display_name: input.displayName,
    })
    .onConflict((oc) =>
      oc.column('account_id').doUpdateSet({
        locale: input.locale,
        avatar_url: input.avatar_url,
        display_name: input.displayName,
      })
    )
    .compile();
