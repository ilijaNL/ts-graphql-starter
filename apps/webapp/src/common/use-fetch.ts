import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  QueryKey,
  UseMutationOptions,
  useQuery as _useQuery,
  useMutation as _useMutation,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { authFetch, graphqlDocFetch } from './remote-client';
import { RequestContext } from './auth';

export const isFunction = (v: any): v is () => any => typeof v == 'function';

type Falsy = false | 0 | '' | null | undefined;

export const getKeyFromDocument = (documentNode: TypedDocumentNode<any, any>): string => {
  if ((documentNode as any).__meta__?.hash) {
    return (documentNode as any).__meta__.hash;
  }

  throw new Error('documentNode does not have a hash, is this generated?');
};

type Variables<TVars> = TVars | (() => TVars);

export function useQuery<TQueryFnData = unknown, TVars = unknown, TError = unknown, TData = TQueryFnData>(
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  varsOrVarsFn: Variables<TVars | Falsy>,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  let variables: TVars | Falsy;

  // if it throws, disable the query
  // this is a dependent query thens
  try {
    variables = isFunction(varsOrVarsFn) ? varsOrVarsFn() : varsOrVarsFn;
  } catch (e) {
    variables = false;
  }

  const disabled = options?.enabled === false || !variables;
  // construct key
  const key = [getKeyFromDocument(documentNode), variables] as const;

  return _useQuery(key as QueryKey, () => graphqlDocFetch(documentNode, variables as TVars), {
    ...options,
    enabled: !disabled,
  });
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
export function useAuthQuery<TQueryFnData = unknown, TVars = unknown, TError = unknown, TData = TQueryFnData>(
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  varsOrVarsFn: Variables<TVars | Falsy>,
  context: RequestContext,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  let variables: TVars | Falsy;

  // if it throws, disable the query
  // this is a dependent query thens
  try {
    variables = isFunction(varsOrVarsFn) ? varsOrVarsFn() : varsOrVarsFn;
  } catch (e) {
    variables = false;
  }

  const disabled = options?.enabled === false || !variables;
  // construct key
  const key = [getKeyFromDocument(documentNode), variables, context] as const;

  return _useQuery(key as QueryKey, () => authFetch(documentNode, variables as TVars, context), {
    ...options,
    enabled: !disabled,
  });
}

export const useUserQuery = <TQueryFnData = unknown, TVars = unknown, TError = unknown, TData = TQueryFnData>(
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  varsOrVarsFn: Variables<TVars | Falsy>,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
) => useAuthQuery(documentNode, varsOrVarsFn, { role: 'user' }, options);

export const useAdminQuery = <TQueryFnData = unknown, TVars = unknown, TError = unknown, TData = TQueryFnData>(
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  varsOrVarsFn: Variables<TVars | Falsy>,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
) => useAuthQuery(documentNode, varsOrVarsFn, { role: 'admin' }, options);

export const useMutation = <TData, TVars, TError = unknown>(
  documentNode: TypedDocumentNode<TData, TVars>,
  options?: UseMutationOptions<TData, TError, TVars>
) => {
  return _useMutation((payload: TVars) => graphqlDocFetch(documentNode, payload as TVars), options);
};

/**
 * Create a request which is authenticated from user session
 * @param documentNode document node which is used to make a request
 * @param options react query options
 * @param headers additional headers which will be sent with the request
 * @returns
 */
export const useAuthMutation = <TData, TVars, TError = unknown>(
  documentNode: TypedDocumentNode<TData, TVars>,
  context: RequestContext,
  options?: UseMutationOptions<TData, TError, TVars>
) => {
  return _useMutation((payload: TVars) => authFetch(documentNode, payload as TVars, context), options);
};
