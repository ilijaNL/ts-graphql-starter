import TinyCache from './tiny-cache';
// @ts-ignore
import stableStringify from 'safe-stable-stringify';
import getClientConfig from '@/config';
import { generatePKCEChallenge, generatePKCEVerifier } from './hash';
import { InferBody } from 'typed-client';
import { apiClient } from '@/api-client';
import { auth } from '@ts-hasura-starter/api';

export const keyCache = new TinyCache<string, Promise<string>>();

export type AuthContext = InferBody<(typeof auth)['contract']['access-token']>['token'];

/**
 * To improve this, sort the keys first and then stringify
 * @param context
 * @returns
 */
function getKey(context: AuthContext): string {
  return stableStringify(context);
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
  return fetch(`${getClientConfig('API')}/auth/signin/email`, {
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
  const resp = await apiClient.tokens.access({
    query: {
      intent: 'access',
    },
    body: {
      token: context,
    },
  });

  if (!resp.ok) {
    throw new Error('unauthorized');
  }

  return resp.data;
}

export const supported_providers = {
  google: 'google',
  github: 'github',
} as const;

type Providers = (typeof supported_providers)[keyof typeof supported_providers];

export const redirectOAuth = async (provider: Providers) => {
  const redirectUrl = new URL(`${getClientConfig('API')}/auth/signin/${provider}`);

  const authorizePath = '/__authorized';

  const verifier = generatePKCEVerifier();
  const maxAge = 2 * 60 * 60; // 2 hours;
  document.cookie = `pkce=${verifier}; path=${authorizePath}; max-age=${maxAge}; SameSite=Lax; secure`;

  redirectUrl.searchParams.set('redirectUrl', `${window.location.origin}${authorizePath}`);
  redirectUrl.searchParams.set('code_challenge', await generatePKCEChallenge(verifier));

  return (window.location.href = redirectUrl.href);
};

export const refresh = async () => {
  return apiClient.tokens.refresh({
    query: {
      intent: 'refresh',
    },
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
