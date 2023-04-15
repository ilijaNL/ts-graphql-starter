import { getAuthURL } from '@/config';
import TinyCache from './tiny-cache';
// @ts-ignore
import stringify from 'safe-stable-stringify';

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

export async function fetchAccessToken(context: AuthContext): Promise<string> {
  const res = await fetch(`/api/auth/access-token`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(context),
  });

  if (res.status === 401) {
    throw new Error('unauthorized');
  }

  const response = await res.json();
  return response.access_token;
}

export const supported_providers = {
  google: 'google',
  twitter: 'twitter',
} as const;

type Providers = typeof supported_providers[keyof typeof supported_providers];

export const redirectOAuth = (provider: Providers) => {
  return (window.location.href = `${getAuthURL()}/signin/${provider}?redirectUrl=${
    window.location.origin
  }/api/auth/acquire`);
};

export const refresh = async () => {
  return fetch(`/api/auth/refresh`, {
    method: 'POST',
    credentials: 'same-origin',
  }).then((d) => d.json());
};

// we need here to redirect
export const signOut = () =>
  fetch(`/api/auth/logout`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  }).then(() => {
    window.location.href = `${window.location.origin}/`;
  });
