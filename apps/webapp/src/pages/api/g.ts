import { createReportHooks, createReport, ReportContext } from '@graphql-edge/proxy/lib/reporting';
import {
  GeneratedOperation,
  OpsDef,
  createOperationParseFn,
  createOperationStore,
} from '@graphql-edge/proxy/lib/operations';
import OperationList from '../../__generated__/operations.json';
import { NextFetchEvent, NextRequest } from 'next/server';
import { createHandler, isParsedError } from '@graphql-edge/proxy';

const store = createOperationStore(OperationList as Array<GeneratedOperation>);

export const config = {
  runtime: 'edge',
};

const reportHooks = createReportHooks();

type Context = ReportContext & { def: OpsDef | null };

const handler = createHandler(process.env.GRAPHQL_ENDPOINT!, createOperationParseFn(store), {
  hooks: {
    // use hook to assign data from parsed request to the context, which will be used for caching
    onRequestParsed(parsed, ctx: Context) {
      if (!isParsedError(parsed)) {
        ctx.def = parsed.def;
      }
      reportHooks.onRequestParsed(parsed, ctx);
    },
    onProxied: reportHooks.onProxied,
    onResponseParsed: reportHooks.onResponseParsed,
  },
});

export default async function MyEdgeFunction(request: NextRequest, event: NextFetchEvent) {
  event.passThroughOnException();
  const report = createReport();

  // this is mutable object
  const context: Context = Object.assign(report.context, {
    def: null,
  });
  const response = await handler(request, context);

  const cacheTTL = context.def?.behaviour.ttl;

  if (cacheTTL) {
    response.headers.set('Cache-Control', `public, s-maxage=${cacheTTL}, stale-while-revalidate=${cacheTTL}`);
  }

  event.waitUntil(
    report.collect(response, context).then((report) => {
      // eslint-disable-next-line no-console
      report && console.log({ report: JSON.stringify(report, null, 2) });
    })
  );

  return response;
}
