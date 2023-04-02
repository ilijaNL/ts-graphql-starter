import { getGraphURL } from '../config';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { getAuthHeaders, RequestContext } from './auth';

export const authFetch = async <TData, TVariables>(
  doc: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context: RequestContext
) => {
  const authHeaders = await getAuthHeaders(context);
  return graphqlDocFetch(doc, variables, { ...authHeaders });
};

export const graphqlDocFetch = <TData, TVars>(
  documentNode: TypedDocumentNode<TData, TVars>,
  variables?: TVars,
  headers?: HeadersInit
) => {
  if ((documentNode as any).__meta__?.hash) {
    return hashFetch<TData, TVars>((documentNode as any).__meta__.hash, variables, headers);
  }

  throw new Error('documentNode has no hash');
};

export const hashFetch = async <TData, TVariables>(hash: string, variables?: TVariables, headers?: HeadersInit) => {
  const res = await fetch(getGraphURL(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      hash,
      variables,
    }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error({ hash, variables, errors: json.errors });
    const { message } = json.errors[0] || 'Error..';
    throw new Error(message);
  }

  return json.data as TData;
};
