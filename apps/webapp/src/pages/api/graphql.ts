import { createEdgeHandler } from 'graphql-ops-proxy/lib/edge';
import { GeneratedOperation } from 'graphql-ops-proxy/lib/proxy';
import OPERATIONS from '@/__generated__/operations.json';
import { GATEWAY_HEADERS, GRAPHQL_ENDPOINT } from '@/config';

const handler = createEdgeHandler(new URL(GRAPHQL_ENDPOINT), OPERATIONS as Array<GeneratedOperation>, {
  proxyHeaders(headers) {
    // add gateway headers
    Object.entries(GATEWAY_HEADERS).forEach((tuple) => {
      headers.set(tuple[0], tuple[1]);
    });
    return headers;
  },
  onResponse(resp, { op }) {
    // add cache headers
    if (op.mBehaviour.ttl) {
      resp.headers.set(
        'cache-control',
        `public, s-maxage=${op.mBehaviour.ttl}, stale-while-revalidate=${Math.floor(op.mBehaviour.ttl * 0.5)}`
      );
    }

    return resp;
  },
});

export const config = {
  runtime: 'edge',
};

export default handler;
