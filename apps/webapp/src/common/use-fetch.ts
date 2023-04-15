import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  QueryKey,
  UseMutationOptions,
  useQuery as _useQuery,
  useMutation as _useMutation,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { AuthContext, getAuthHeaders } from './auth';
import { getGraphURL } from '@/config';
import { Variables as ReqVariables, GraphQLClient } from 'graphql-request';
import { Kind, type OperationDefinitionNode } from 'graphql';

const graphqlClient = new GraphQLClient(getGraphURL());

export function extractOperationName(documentNode: TypedDocumentNode<any, any>): string {
  return documentNode.definitions
    .filter(
      (definition): definition is OperationDefinitionNode =>
        definition.kind === Kind.OPERATION_DEFINITION && !!definition.name
    )
    .map((d) => d.name)
    .join('_');
}

export const authFetch = async <TData, TVariables extends ReqVariables | undefined>(
  doc: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context: AuthContext
) => {
  const authHeaders = await getAuthHeaders(context);
  return graphqlClient.request(doc, variables, authHeaders);
};

export function useQuery<
  TQueryFnData = unknown,
  TVars extends ReqVariables | undefined = ReqVariables,
  TError = unknown,
  TData = TQueryFnData
>(
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  variables: TVars,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  const disabled = options?.enabled === false || !variables;
  // construct key
  const key = [extractOperationName(documentNode), variables] as const;

  return _useQuery(key as QueryKey, () => graphqlClient.request(documentNode, variables), {
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
export function useAuthQuery<
  TQueryFnData = unknown,
  TVars extends ReqVariables | undefined = ReqVariables,
  TError = unknown,
  TData = TQueryFnData
>(
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  variables: TVars,
  authContext: AuthContext,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  const disabled = options?.enabled === false || !variables;
  // construct key
  const key = [extractOperationName(documentNode), variables, authContext] as const;

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
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  variables: TVars,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
) => useAuthQuery(documentNode, variables, { role: 'user' }, options);

export const useAdminQuery = <
  TQueryFnData = unknown,
  TVars extends ReqVariables | undefined = ReqVariables,
  TError = unknown,
  TData = TQueryFnData
>(
  documentNode: TypedDocumentNode<TQueryFnData, TVars>,
  variables: TVars,
  options?: UseQueryOptions<TQueryFnData, TError, TData>
) => useAuthQuery(documentNode, variables, { role: 'admin' }, options);

export const useMutation = <TData, TVars extends ReqVariables | undefined = ReqVariables, TError = unknown>(
  documentNode: TypedDocumentNode<TData, TVars>,
  options?: UseMutationOptions<TData, TError, TVars>
) => {
  return _useMutation((payload: TVars) => graphqlClient.request(documentNode, payload), options);
};

/**
 * Create a request which is authenticated from user session
 * @param documentNode document node which is used to make a request
 * @param options react query options
 * @param headers additional headers which will be sent with the request
 * @returns
 */
export const useAuthMutation = <TData, TVars extends ReqVariables | undefined = ReqVariables, TError = unknown>(
  documentNode: TypedDocumentNode<TData, TVars>,
  context: AuthContext,
  options?: UseMutationOptions<TData, TError, TVars>
) => {
  return _useMutation((payload: TVars) => authFetch(documentNode, payload as TVars, context), options);
};
