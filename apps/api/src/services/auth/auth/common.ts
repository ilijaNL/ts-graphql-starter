import { createSigner, createVerifier } from 'fast-jwt';
import { AuthDBClient } from '../db';

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

export const createAddProviderQuery = (builder: AuthDBClient, account_id: string, input: ProviderInput) =>
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
