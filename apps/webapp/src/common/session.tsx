import { useUserQuery } from './use-query';
import { createContext, useMemo, useContext, PropsWithChildren, useEffect } from 'react';
import { keyCache, refresh, signOut as signOutRemote } from './auth';
import type { ResultOf } from '@graphql-typed-document-node/core';
import Router from 'next/router';
import { GetMeDocument } from '../__generated__/user';

type User = ResultOf<typeof GetMeDocument>['me'][number];

type AuthUser = {
  isAuthenticated: boolean;
  refetchMe: () => void;
  isLoading: boolean;
  user: User | null;
};

const AuthContext = createContext<AuthUser | null>(null);

const _AuthProvider: React.FC<PropsWithChildren> = (props) => {
  const {
    data,
    remove: removeUserData,
    isLoading: isLoadingMe,
    refetch,
  } = useUserQuery(
    GetMeDocument,
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      refetchOnReconnect: false,
      retry: 1,
      select: (data) => data.me[0],
      onSuccess(data) {
        if (data) {
          refresh();
        }
      },
      onError: () => {
        _signout();
      },
    }
  );

  const userData = data ?? null;

  const _signout = () => {
    if (!userData) {
      return;
    }

    keyCache.clear();
    signOutRemote().catch(() => {});
    removeUserData();
  };

  const isLoading = isLoadingMe;

  const value = useMemo<AuthUser>(
    () => ({
      isLoading,
      user: userData,
      isAuthenticated: !!userData,
      refetchMe: refetch,
    }),
    [isLoading, refetch, userData]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
};

export const AuthProvider = (props: PropsWithChildren<{}>) => {
  return <_AuthProvider>{props.children}</_AuthProvider>;
};

export const useSessionRedirect = (redirectWhen: (session: AuthUser) => boolean, path: string) => {
  const session = useSession();

  useEffect(() => {
    if (redirectWhen(session)) {
      Router.replace(path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
};

export const useSession = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('not inside AuthProvider');
  }

  return ctx;
};

/**
 * Can be safely used inside Authguard
 * @returns logged in user
 */
export const useUser = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('not inside AuthProvider');
  }

  if (!ctx.user) {
    throw new Error('not authenticated');
  }

  return {
    user: ctx.user,
    refresh: ctx.refetchMe,
    authContext: { role: 'user' } as const,
  };
};
