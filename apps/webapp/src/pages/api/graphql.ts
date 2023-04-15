import { createEdgeHandler, fromNodeHeaders } from 'graphql-ops-proxy/lib/edge';
import { GeneratedOperation } from 'graphql-ops-proxy/lib/proxy';
import OPERATIONS from '@/__generated__/operations.json';
import { GRAPHQL_ENDPOINT } from '@/config';

const handler = createEdgeHandler(new URL(GRAPHQL_ENDPOINT), OPERATIONS as Array<GeneratedOperation>, {
  proxyHeaders(headers) {
    // todo add x-origin-secret header

    return headers;
  },
  onResponse(resp, headers, op) {
    const responseHeaders = fromNodeHeaders(headers);

    // add cache headers
    if (op.mBehaviour.ttl) {
      responseHeaders.set(
        'cache-control',
        `public, s-maxage=${op.mBehaviour.ttl}, stale-while-revalidate=${Math.floor(op.mBehaviour.ttl * 0.5)}`
      );
    }

    return new Response(resp, {
      status: 200,
      headers: responseHeaders,
    });
  },
});

export const config = {
  runtime: 'edge',
};

export default handler;
