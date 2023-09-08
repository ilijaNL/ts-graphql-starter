import {
  QueryKey,
  UseMutationOptions,
  useQuery as _useQuery,
  useMutation as _useMutation,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { AuthContext, getAuthHeaders } from './auth';
import { proxyFetch } from './graphql-fetch';
import { TypedDocumentString } from '@/__generated__/user';

export type ReqVariables = Record<string, unknown>;

export const authFetch = async <TData, TVariables extends ReqVariables | undefined>(
  doc: TypedDocumentString<TData, TVariables>,
  variables: TVariables,
  context: AuthContext
) => {
  const authHeaders = await getAuthHeaders(context);
  return proxyFetch(doc, variables, authHeaders);
};

export function useQuery<
  TQueryFnData = unknown,
  TVars extends ReqVariables | undefined = ReqVariables,
  TError = unknown,
  TData = TQueryFnData
>(
  documentNode: TypedDocumentString<TQueryFnData, TVars>,
  variables: TVars,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  // construct key
  const key = [documentNode.toString(), variables] as const;

  return _useQuery(key as QueryKey, () => proxyFetch(documentNode, variables), options);
}

/**
 * Create a request which is authenticated from user session
 * The request will be disabled if varsOrVarsFn returns falsy or throws. It is also disabled if no user session exists
 * @param documentNode document node which is used to make a request
 * @param varsOrVarsFn
 * @param options react query options
 * @param headers additional headers which will be sent with the request
 * @returns
 */
export function useAuthQuery<
  TQueryFnData = unknown,
  TVars extends ReqVariables | undefined = ReqVariables,
  TError = unknown,
  TData = TQueryFnData
>(
  documentNode: TypedDocumentString<TQueryFnData, TVars>,
  variables: TVars,
  options?: UseQueryOptions<TQueryFnData, TError, TData> & Partial<{ reqContext: AuthContext }>
): UseQueryResult<TData, TError> {
  const disabled = options?.enabled === false || !variables;
  const authContext = options?.reqContext ?? { role: 'user' };
  // construct key
  const key = [documentNode.toString(), variables, authContext] as const;

  return _useQuery(key as QueryKey, () => authFetch(documentNode, variables as TVars, authContext), {
    ...options,
    enabled: !disabled,
  });
}

export const useUserQuery = <
  TQueryFnData = unknown,
  TVars extends ReqVariables | undefined = ReqVariables,
  TError = unknown,
  TData = TQueryFnData
>(
  documentNode: TypedDocumentString<TQueryFnData, TVars>,
  variables: TVars,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
) => useAuthQuery(documentNode, variables, { ...options, reqContext: { role: 'user' } });

export const useMutation = <TData, TVars extends ReqVariables | undefined = ReqVariables, TError = unknown>(
  documentNode: TypedDocumentString<TData, TVars>,
  options?: UseMutationOptions<TData, TError, TVars>
) => {
  return _useMutation((payload: TVars) => proxyFetch(documentNode, payload), options);
};

/**
 * Create a request which is authenticated from user session
 * @param documentNode document node which is used to make a request
 * @param options react query options
 * @param headers additional headers which will be sent with the request
 * @returns
 */
export const useAuthMutation = <TData, TVars extends ReqVariables | undefined = ReqVariables, TError = unknown>(
  documentNode: TypedDocumentString<TData, TVars>,
  options?: UseMutationOptions<TData, TError, TVars> & Partial<{ reqContext: AuthContext }>
) => {
  return _useMutation(
    (payload: TVars) => authFetch(documentNode, payload as TVars, options?.reqContext ?? { role: 'user' }),
    options
  );
};
