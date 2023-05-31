import { Static, TSchema } from '@sinclair/typebox';

export type RPCDef = {
  type: 'query' | 'mutation';
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

export * from '@sinclair/typebox';
