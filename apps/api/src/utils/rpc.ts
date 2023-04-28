import { Static, TSchema } from '@sinclair/typebox';
import { createValidateFn } from './schema';
import createHttpError from 'http-errors';

export type RPCDef = {
  input: TSchema;
  output: TSchema;
};

type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type InferInput<T extends RPCDef> = Simplify<Static<T['input']>>;
export type InferOutput<T extends RPCDef> = Simplify<Static<T['output']>>;

export type RPCContract = {
  [name: string]: RPCDef;
};

// simple factory function to satisfy RPCContract
export const createRPC = <T extends RPCContract>(c: T) => c;

export type Handler<Input, Output, Context> = (input: Input, context: Context) => Output;

export const wrapHandle = <T extends RPCDef, Context, TName>(
  name: TName,
  def: T,
  handler: Handler<InferInput<T>, Promise<InferOutput<T>>, Context>
): ExecutableProcedure<Context, T, TName> => {
  const check = createValidateFn(def.input);
  const res: ExecutableProcedure<Context, T, TName> = {
    def: def,
    name: name,
    execute(input, ctx) {
      if (check(input)) {
        return handler(input, ctx);
      }

      throw createHttpError.BadRequest(`${check.errors?.[0]?.message} for ${check.errors?.[0]?.instancePath}`);
    },
  };

  return res;
};

export type ProcedureImpl<Op extends RPCContract, Context = unknown> = {
  [P in keyof Op]: Handler<InferInput<Op[P]>, Promise<InferOutput<Op[P]>>, Context>;
};

export type ExecutableProcedure<Context, TRPCDef extends RPCDef, TName> = {
  execute: (input: InferInput<TRPCDef>, context: Context) => Promise<InferOutput<TRPCDef>>;
  name: TName;
  def: TRPCDef;
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
