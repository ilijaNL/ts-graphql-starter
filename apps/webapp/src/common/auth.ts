import { getAuthURL } from '@/config';
import TinyCache from './tiny-cache';
// @ts-ignore
import stringify from 'safe-stable-stringify';
import { AccessTokenDocument } from '@/__generated__/graphql';
import { match } from 'ts-pattern';
import { proxyFetch } from './graphql-fetch';

export const keyCache = new TinyCache<string, Promise<string>>();

interface AdminContext {
  role: 'admin';
}

interface UserContext {
  role: 'user';
}

export type AuthContext = UserContext | AdminContext;

/**
 * To improve this, sort the keys first and then stringify
 * @param context
 * @returns
 */
function getKey(context: AuthContext): string {
  return stringify(context);
}

function setAccessToken(key: string, tokenPromise: Promise<string>) {
  // 5 minutes
  keyCache.put(key, tokenPromise, 60_000 * 5);
}

export const getAuthHeaders = async (context: AuthContext) => {
  const key = getKey(context);
  let tokenPromise = keyCache.get(key);

  if (!tokenPromise) {
    tokenPromise = fetchAccessToken(context);
    setAccessToken(key, tokenPromise);
  }

  const token = await tokenPromise;

  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const requestSignInEmail = async (email: string) => {
  return fetch(`${getAuthURL()}/signin/email`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      redirectUrl: `${window.location.origin}/api/auth/acquire`,
    }),
  }).then((d) => {
    window.localStorage.setItem('emailForSignIn', email);
    return d;
  });
};

async function fetchAccessToken(context: AuthContext): Promise<string> {
  const claim = match(context)
    .with({ role: 'user' }, (r) => ({ type: 'hasura', role: r.role }))
    .with({ role: 'admin' }, () => {
      throw new Error('admin access token not implemented in ' + __dirname);
    })
    .exhaustive();

  const refreshToken = await fetch('/api/id-token', {
    method: 'GET',
    credentials: 'same-origin',
  }).then((d) => d.text());

  if (!refreshToken) {
    throw new Error('un-authorized');
  }

  // use /api/auth so we get cookie
  const result = await proxyFetch(AccessTokenDocument, {
    claims: [claim],
    token: refreshToken,
  });

  if (!result.auth?.accessToken) {
    throw new Error('unauthorized');
  }

  return result.auth?.accessToken;
}

export const supported_providers = {
  google: 'google',
  twitter: 'twitter',
} as const;

type Providers = typeof supported_providers[keyof typeof supported_providers];

export const redirectOAuth = (provider: Providers) => {
  return (window.location.href = `${getAuthURL()}/signin/${provider}?redirectUrl=${
    window.location.origin
  }/__authorized`);
};

export const refresh = async () => {
  return fetch(`/api/id-token`, {
    method: 'POST',
    credentials: 'same-origin',
  });
};

// we need here to redirect
export const signOut = () =>
  fetch('/api/id-token', {
    method: 'DELETE',
    credentials: 'same-origin',
  }).then(() => {
    window.location.href = `${window.location.origin}/`;
  });
