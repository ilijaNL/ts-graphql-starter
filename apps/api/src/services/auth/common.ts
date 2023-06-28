import { createVerifier, createSigner } from 'fast-jwt';
// import createHttpError from 'http-errors';
import AUTH_ENVS from './env';
import createHttpError from 'http-errors';
import { domainIsAllowed } from '@/domains';
import { AccessToken, ISS } from '@/jwt';
import { CompiledQuery, QueryCreator } from 'kysely';
import { DB } from './__generated__/auth-db';

export type Provider = 'email' | 'github' | 'twitter' | 'google' | 'linkedin' | 'microsoft';

export type QueryBuilder = QueryCreator<DB>;

/**
 * Function that should check if this is a known domain and we can safely redirect to it
 * @param url
 * @returns
 */
export async function assertRedirect(url: string) {
  if (await domainIsAllowed(url)) {
    return true;
  }

  throw new createHttpError.Unauthorized('domain not allowed');
}

const JWT_REFRESH_TOKEN_EXPIRATION_TIME = parseInt(AUTH_ENVS.JWT_REFRESH_TOKEN_EXPIRATION_TIME ?? '-1');

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

export type IdToken = {
  sub: string;
  // provider: {
  //   n: Provider;
  //   p_id: string;
  // };
} & Account;

const REFRESH_TOKEN_SECRET = AUTH_ENVS.REFRESH_TOKEN_SECRET;
const JWT_ACCESS_TOKEN_EXPIRATION_TIME = parseInt(AUTH_ENVS.JWT_ACCESS_TOKEN_EXPIRATION_TIME);
const JWT_TOKEN_SECRET = AUTH_ENVS.ACCESS_TOKEN_SECRET;

const _verifyIDToken = createVerifier({
  key: REFRESH_TOKEN_SECRET,
  cache: true,
  allowedIss: [ISS],
});

const _signIDToken = createSigner({
  key: REFRESH_TOKEN_SECRET,
  expiresIn: JWT_REFRESH_TOKEN_EXPIRATION_TIME * 1000,
  iss: ISS,
});

const _signAccessToken = createSigner({
  key: JWT_TOKEN_SECRET,
  expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_TIME * 1000,
  iss: ISS,
});

export function signAccessToken(token: AccessToken) {
  return _signAccessToken(token);
}

/**
 * Used as refresh token
 */
export function signIDToken(token: IdToken) {
  return _signIDToken(token);
}

export const createIDToken = (payload: IdToken): IdToken => payload;

export function getIdToken(id_token: string): IdToken | null {
  try {
    return _verifyIDToken(id_token);
  } catch (e) {
    return null;
  }
}

export function createRequesTokenQuery(builder: QueryBuilder, input: { account_id: string; id?: string }) {
  return builder.insertInto('requests').values(input).compile();
}
