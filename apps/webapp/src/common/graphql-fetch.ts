import { TypedDocumentString } from '@/__generated__/user';
import { getDocumentInfoFromNode } from './graphql';

export const proxyFetch = <TData, TVars>(
  documentNode: TypedDocumentString<TData, TVars>,
  variables?: TVars,
  headers?: HeadersInit,
  url = '/api/g'
) => {
  const { operationName, operationType } = getDocumentInfoFromNode(documentNode);

  if (operationType === 'query') {
    const params = new URLSearchParams({
      op: operationName,
    });

    if (variables) {
      params.set('v', JSON.stringify(variables));
    }

    return graphFetch<TData>('GET', undefined, headers, url + '?' + params.toString());
  }

  if (operationType === 'mutation') {
    return graphFetch<TData>(
      'POST',
      JSON.stringify({
        op: operationName,
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
