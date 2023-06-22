import { createErrorResponse, createGraphQLProxy, createParseErrorResponse, isParsedError } from '@graphql-edge/proxy';
import { GeneratedOperation, createOperationParseFn, createOperationStore } from '@graphql-edge/proxy/lib/operations';
import OperationList from '../../__generated__/operations.json';
import OperationHiveMap from '../../__generated__/hive-ops.json';
import { NextFetchEvent, NextRequest } from 'next/server';
import { OperationDefinition, createHiveSendFn, createUsageCollector } from 'graphql-hive-edge-client';

const store = createOperationStore(OperationList as Array<GeneratedOperation>);

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: [
    // use a glob to allow anything in the function-bind 3rd party module
    '**/.pnpm/**/node_modules/lodash*/*.js',
  ],
};

const proxy = createGraphQLProxy(process.env.GRAPHQL_ENDPOINT!, createOperationParseFn(store));

const usageCollector = createUsageCollector({
  maxSize: 25,
  send: createHiveSendFn(process.env.GRAPHQL_HIVE_TOKEN!),
  sendInterval: 5_000,
  sampleRate: 1.0,
});

const handle = async (request: Request, event: NextFetchEvent) => {
  const parsed = await proxy.parseRequest(request);

  if (isParsedError(parsed)) {
    return createParseErrorResponse(parsed);
  }
  const hiveOp = parsed.operationName
    ? (OperationHiveMap as Record<string, OperationDefinition>)[parsed.operationName]
    : undefined;

  const finish =
    hiveOp &&
    usageCollector.collect(hiveOp, {
      name: 'ts-starter-template',
      version: '0.0.1',
    });

  const proxyResponse = await proxy.proxy(parsed);
  if (!proxyResponse.ok) {
    finish &&
      event.waitUntil(
        finish({
          ok: false,
          errors: [{ message: 'cannot fetch' }],
        })
      );
    return proxyResponse;
  }

  const parsedResult = await proxy.parseResponse(proxyResponse);

  if (!parsedResult) {
    finish &&
      event.waitUntil(
        finish({
          ok: false,
          errors: [{ message: 'cannot parse' }],
        })
      );
    return createErrorResponse('cannot parse response', 406);
  }

  finish &&
    event.waitUntil(
      finish({
        ok: true,
        errors: parsedResult.errors,
      })
    );

  const response = await proxy.formatResponse(parsedResult, proxyResponse);

  const cacheTTL = parsed.def?.behaviour.ttl;

  if (cacheTTL) {
    response.headers.set('Cache-Control', `public, s-maxage=${cacheTTL}, stale-while-revalidate=${cacheTTL}`);
  }

  return response;
};

export default async function MyEdgeFunction(request: NextRequest, event: NextFetchEvent) {
  event.passThroughOnException();
  return handle(request, event);
}
