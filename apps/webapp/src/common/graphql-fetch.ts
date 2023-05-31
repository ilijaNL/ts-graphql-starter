import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { DocumentNode, OperationDefinitionNode, OperationTypeNode, print as _print, getOperationAST } from 'graphql';

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

const queries = new WeakMap<DocumentNode, string>();

export function print(doc: DocumentNode) {
  if (queries.has(doc)) {
    return queries.get(doc)!;
  }

  const value = _print(doc);
  queries.set(doc, value);
  return value;
}

export const proxyFetch = <TData, TVars>(
  documentNode: TypedDocumentNode<TData, TVars>,
  variables?: TVars,
  headers?: HeadersInit,
  url = '/api/g'
) => {
  const operationName = extractOperationName(documentNode);
  if (!operationName) {
    throw new Error('operationName not specified');
  }

  const operationType = getOperationAST(documentNode, operationName);

  if (!operationType) {
    throw new Error('unknown operationType');
  }

  if (operationType.operation === OperationTypeNode.QUERY) {
    const params = new URLSearchParams({
      op: operationName,
    });

    if (variables) {
      params.set('v', JSON.stringify(variables));
    }

    return graphFetch<TData>('GET', undefined, headers, url + '?' + params.toString());
  }

  if (operationType.operation === OperationTypeNode.MUTATION) {
    return graphFetch<TData>(
      'POST',
      JSON.stringify({
        op: print(documentNode),
        v: variables,
      }),
      headers,
      url
    );
  }

  throw new Error(operationType + ' not supported');
};

const graphFetch = async <TData>(method: 'POST' | 'GET', body: any, headers: HeadersInit | undefined, url: string) => {
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
    console.error('graphqlError', { errors: json.errors });
    const { message } = json.errors[0] || 'Error..';
    throw new Error(message);
  }

  return json.data as TData;
};
