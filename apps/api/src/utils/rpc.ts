import createHttpError from 'http-errors';
import { InferInput, InferOutput, RPCContract, RPCDef, Static, TSchema } from '@ts-hasura-starter/rpc';
import { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify';
import { ajv } from './schema';

const createValidateFn = <T extends TSchema>(schema: T) => {
  const validate = ajv.compile<Static<T>>(schema);
  return validate;
};

export type Handler<Input, Output, Context> =
  | ((input: Input, context: Context) => Output)
  | { handler: (input: Input, context: Context) => Output; extensions?: RouteShorthandOptions };

export const wrapHandle = <T extends RPCDef, Context, TName>(
  name: TName,
  def: T,
  handler: Handler<InferInput<T>, Promise<InferOutput<T>>, Context>
): ExecutableProcedure<Context, T, TName> => {
  const check = createValidateFn(def.input);
  const executeFn = typeof handler === 'function' ? handler : handler.handler;
  const res: ExecutableProcedure<Context, T, TName> = {
    def: def,
    name: name,
    extensions: typeof handler === 'function' ? undefined : handler.extensions,
    execute(input, ctx) {
      if (check(input)) {
        return executeFn(input, ctx);
      }

      throw createHttpError.BadRequest(`${check.errors?.[0]?.message} for ${check.errors?.[0]?.instancePath}`);
    },
  };

  return res;
};

export type ProcedureImpl<Op extends RPCContract, Context = unknown> = {
  [P in keyof Op]: Handler<InferInput<Op[P]>, Promise<InferOutput<Op[P]>>, Context>;
};

export type ExecutableProcedure<Context, TDef extends RPCDef, TName> = {
  extensions?: RouteShorthandOptions;
  execute: (input: InferInput<TDef>, context: Context) => Promise<InferOutput<TDef>>;
  name: TName;
  def: TDef;
};

export type ProcedureHandlers<Op extends RPCContract, Context = unknown> = {
  [P in keyof Op]: ExecutableProcedure<Context, Op[P], P>;
};

export const createProcedures = <T extends RPCContract>(operations: T) => {
  return function handlers<Ctx>(handlers: ProcedureImpl<T, Ctx>) {
    return (Object.keys(operations) as Array<keyof T>).reduce((agg, key) => {
      const res = wrapHandle(key, operations[key], handlers[key]);
      agg[key] = res;
      return agg;
    }, {} as ProcedureHandlers<T, Ctx>);
  };
};

type Options<Context> = {
  contextFactory: (req: FastifyRequest, reply: FastifyReply) => Context | Promise<Context>;
};

function normalizeRoute(route: string) {
  if (route.startsWith('/')) {
    return route;
  }

  return `/${route}`;
}

/**
 * Implements contract as a fastify plugin
 * @param contract
 * @returns
 */
export const toPlugin = <T extends RPCContract, TContext = unknown>(
  procedures: ProcedureHandlers<T, TContext>
  // impl: ContractImpl<TContext, Omit<RouteShorthandOptions, 'schema'>, T>
): FastifyPluginCallback<Options<TContext>> => {
  return function register(fastify, options, done) {
    const ctxSymbol = Symbol('context');

    fastify.decorateRequest(ctxSymbol, null);

    fastify.addHook('onRequest', async (request, reply) => {
      // get app_id from headers
      (request as any)[ctxSymbol] = await options.contextFactory(request, reply);
    });

    // registery mutations
    (Object.entries(procedures) as [string, typeof procedures[keyof T]][])
      .filter(([, spec]) => spec.def.type === 'mutation')
      .forEach(([method, spec]) => {
        fastify.post(
          normalizeRoute(method),
          { ...spec.extensions, schema: { body: spec.def.input, response: { '2xx': spec.def.output } } },
          async (req) => {
            const ctx = (req as any)[ctxSymbol];
            return spec.execute(req.body as any, ctx);
          }
        );
      });

    // registery queries
    (Object.entries(procedures) as [string, typeof procedures[keyof T]][])
      .filter(([, spec]) => spec.def.type === 'query')
      .forEach(([method, spec]) => {
        fastify.get(
          normalizeRoute(method),
          { ...spec.extensions, schema: { querystring: spec.def.input, response: { '2xx': spec.def.output } } },
          async (req) => {
            const ctx = (req as any)[ctxSymbol];
            return spec.execute(req.query as any, ctx);
          }
        );
      });

    done();
  };
};

export function registerProcedures<T extends RPCContract, TContext = unknown>(
  instance: FastifyInstance,
  procedures: ProcedureHandlers<T, TContext>,
  options: Options<TContext>
) {
  return instance.register(toPlugin(procedures), options);
}
