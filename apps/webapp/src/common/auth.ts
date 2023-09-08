import TinyCache from './tiny-cache';
// @ts-ignore
import stableStringify from 'safe-stable-stringify';
import { match } from 'ts-pattern';
import { ExecuteFn } from './rpc/execute';
import { MutationKeys, QueryKeys } from './rpc/hooks';
import {
  useMutation as _useMutation,
  UseMutationOptions,
  useQuery as _useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import getClientConfig from '@/config';
import { InferInput, InferOutput, RPCContract } from '@ts-hasura-starter/rpc';
import { generatePKCEChallenge, generatePKCEVerifier } from './hash';

export const keyCache = new TinyCache<string, Promise<string>>();

interface UserContext {
  role: 'user';
}

export type AuthContext = UserContext;

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
  return fetch(`${getClientConfig('AUTH_ENDPOINT')}/signin/email`, {
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
  const roleClaim = match(context)
    .with({ role: 'user' }, (r) => ({ type: 'hasura', role: r.role }))
    .exhaustive();

  const resp = await fetch('/api/id-token?intent=access', {
    method: 'POST',
    body: JSON.stringify({
      claims: [roleClaim],
    }),
  });

  if (!resp.ok) {
    throw new Error('unauthorized');
  }

  const access_token = await resp.text();

  if (!access_token) {
    throw new Error('unauthorized');
  }

  return access_token;
}

export const supported_providers = {
  google: 'google',
  github: 'github',
} as const;

type Providers = (typeof supported_providers)[keyof typeof supported_providers];

export const redirectOAuth = async (provider: Providers) => {
  const redirectUrl = new URL(`${getClientConfig('AUTH_ENDPOINT')}/signin/${provider}`);

  const authorizePath = '/__authorized';

  const verifier = generatePKCEVerifier();
  const maxAge = 2 * 60 * 60; // 2 hours;
  document.cookie = `pkce=${verifier}; path=${authorizePath}; max-age=${maxAge}; SameSite=Lax; secure`;

  redirectUrl.searchParams.set('redirectUrl', `${window.location.origin}${authorizePath}`);
  redirectUrl.searchParams.set('code_challenge', await generatePKCEChallenge(verifier));

  return (window.location.href = redirectUrl.href);
};

export const refresh = async () => {
  return fetch(`/api/id-token?intent=refresh`, {
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

export function createAuthHooks<TContract extends RPCContract>(executeFn: ExecuteFn<TContract>) {
  function useMutation<T extends keyof TContract>(
    method: T extends MutationKeys<TContract> ? T : never,
    options?: Omit<UseMutationOptions<InferOutput<TContract[T]>, any, InferOutput<TContract[T]>>, 'mutationFn'> &
      Partial<{ reqContext: AuthContext }>
  ) {
    return _useMutation(async (input: InferInput<TContract[T]>) => {
      const headers = await getAuthHeaders(options?.reqContext ?? { role: 'user' });
      return executeFn(method, input, headers);
    }, options);
  }

  function useQuery<T extends keyof TContract>(
    method: T extends QueryKeys<TContract> ? T : never,
    input: InferInput<TContract[T]>,
    options?: Omit<
      UseQueryOptions<InferOutput<TContract[T]>> & Partial<{ reqContext: AuthContext }>,
      'queryKey' | 'queryFn'
    >
  ) {
    const context = options?.reqContext ?? { role: 'user' };
    const key = [executeFn.url, context, method, input] as const;
    return _useQuery(key, async () => executeFn(method, input, await getAuthHeaders(context)), options);
  }

  return {
    useMutation,
    useQuery,
  };
}
