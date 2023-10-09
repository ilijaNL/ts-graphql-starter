import { Static, TSchema } from '@sinclair/typebox';
import { createValidateFn } from './schema';
import { PGClient, QueryCommand } from './sql';
import createHttpError from 'http-errors';
import { combineAndExecute } from './kysely';
import { FastifyInstance } from 'fastify';
import { getPoolFromFastify } from './plugins/pg-pool';

export type HandlerResult<TResult> = {
  result: TResult;
  commands: ReadonlyArray<QueryCommand>;
};

export type SaveCommandFn = (...cmds: QueryCommand[]) => void;

export type Handler<TState, Input, TResult> = (state: TState, props: { input: Input }) => HandlerResult<TResult>;

export function createAction<T extends TSchema, TResult, TState = unknown>(mProps: {
  schema: T;
  // need to define inline for inference to work
  handler: (
    state: TState,
    props: { input: Static<T> },
    ctx: { addCommand: (...cmds: QueryCommand[]) => void }
  ) => TResult;
}): Handler<TState, Static<T>, TResult> {
  const validate = createValidateFn(mProps.schema);

  function handler(state: TState, props: { input: Static<T> }): ReturnType<Handler<TState, Static<T>, TResult>> {
    const valid = validate(props.input);
    // correcly format it to { Array<{ path: string, code: number; message: string }> }
    if (!valid) {
      const errors = validate.errors?.map((e) => ({ path: e.instancePath, message: e.message })) ?? [];
      throw new createHttpError.BadRequest(JSON.stringify(errors));
    }

    const cmds: QueryCommand[] = [];

    const result = mProps.handler(state, props, {
      addCommand(...newCmds) {
        cmds.push(...newCmds);
      },
    });

    return {
      commands: cmds,
      result: result,
    };
  }

  handler.schema = mProps.schema;

  return handler;
}

export type ActionResult<TResult> = TResult;

export type AsyncHandler<Input, TResult, TState> = (
  input: Input,
  ctx: TState,
  save: SaveCommandFn
) => Promise<ActionResult<TResult>>;

export function createAsyncAction<T extends TSchema, TResult, TState = unknown>(mProps: {
  schema: T;
  // need to define inline for inference to work
  handler: (input: Static<T>, ctx: TState, props: { save: SaveCommandFn }) => Promise<TResult>;
}): AsyncHandler<Static<T>, TResult, TState> {
  const validate = createValidateFn(mProps.schema);

  async function handler(input: Static<T>, state: TState, addCommand: SaveCommandFn): Promise<ActionResult<TResult>> {
    const valid = validate(input);
    if (!valid) {
      const errors = validate.errors?.map((e) => ({ path: e.instancePath, message: e.message })) ?? [];
      throw new createHttpError.BadRequest(JSON.stringify(errors));
    }

    const result = await mProps.handler(input, state, {
      save: addCommand,
    });
    return result;
  }

  handler.schema = mProps.schema;

  return handler;
}

export function execute<Input, TResult, TState>(client: PGClient, handler: AsyncHandler<Input, TResult, TState>) {
  const resultCommands: QueryCommand[] = [];
  const addCommand: SaveCommandFn = (...cmds) => {
    resultCommands.push(...cmds);
  };

  const wrappedHandler = async (input: Input, ctx: TState): Promise<ActionResult<TResult>> => {
    const result = await handler(input, ctx, addCommand);
    await combineAndExecute(client, ...resultCommands);
    return result;
  };

  return wrappedHandler;
}

export function createExecute(client: PGClient) {
  return function exec<Input, TResult, TState>(handler: AsyncHandler<Input, TResult, TState>) {
    return execute(client, handler);
  };
}

export function createFastifyExecute(fastify: FastifyInstance) {
  return function exec<Input, TResult, TState>(handler: AsyncHandler<Input, TResult, TState>) {
    const client = getPoolFromFastify(fastify);
    return execute(client, handler);
  };
}

export async function transaction<TResult>(client: PGClient, fn: (addCommandFn: SaveCommandFn) => Promise<TResult>) {
  const resultCommands: QueryCommand[] = [];
  const addCommand: SaveCommandFn = (...cmds) => {
    resultCommands.push(...cmds);
  };

  const result = await fn(addCommand);

  await combineAndExecute(client, ...resultCommands);

  return result;
}
