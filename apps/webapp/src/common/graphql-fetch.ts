import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { DocumentNode, Kind, OperationDefinitionNode, print } from 'graphql';
import { TypedOperation } from 'graphql-ops-proxy';

export const extractOperationName = (document: DocumentNode): string => {
  let operationName = undefined;

  const operationDefinitions = document.definitions.filter(
    (definition) => definition.kind === `OperationDefinition`
  ) as OperationDefinitionNode[];

  if (operationDefinitions.length === 1) {
    operationName = operationDefinitions[0]?.name?.value;
  }

  return operationName ?? '';
};

export function toTypedOperation<R, V>(documentNode: TypedDocumentNode<R, V>): TypedOperation<R, V> {
  const op = documentNode.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === Kind.OPERATION_DEFINITION && !!definition.name
  )!;

  return {
    operation: op.name?.value ?? '',
    operationType: op.operation,
  };
}

export const graphqlDocFetch = <TData, TVars>(
  url: string,
  documentNode: TypedDocumentNode<TData, TVars>,
  variables?: TVars,
  headers?: HeadersInit
) => {
  return graphFetch<TData>(
    url,
    'POST',
    JSON.stringify({
      query: print(documentNode),
      variables,
    }),
    headers
  );
};

export const proxyFetch = <TData, TVars>(
  documentNode: TypedDocumentNode<TData, TVars>,
  variables?: TVars,
  headers?: HeadersInit
) => {
  const op = extractOperationName(documentNode);
  const params = new URLSearchParams({
    op: op,
  });
  return graphFetch<TData>(
    '/api/graphql?' + params.toString(),
    'POST',
    JSON.stringify({
      op: extractOperationName(documentNode),
      v: variables,
    }),
    headers
  );
};

export const proxyGetFetch = <TData, TVars>(
  documentNode: TypedDocumentNode<TData, TVars>,
  variables?: TVars,
  headers?: HeadersInit
) => {
  const op = extractOperationName(documentNode);
  const params = new URLSearchParams({
    op: op,
    v: JSON.stringify(variables),
  });
  return graphFetch<TData>('/api/graphql?' + params.toString(), 'GET', undefined, headers);
};

export const graphFetch = async <TData>(url: string, method: 'POST' | 'GET', body: any, headers?: HeadersInit) => {
  const res = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body,
  });

  const json = await res.json();
  if (json.errors) {
    console.error({ errors: json.errors });
    const { message } = json.errors[0] || 'Error..';
    throw new Error(message);
  }

  return json.data as TData;
};
