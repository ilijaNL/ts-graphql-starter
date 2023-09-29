import { Static, TSchema } from '@sinclair/typebox';
import { createValidateFn } from './schema';
import { PGClient, QueryCommand } from './sql';
import createHttpError from 'http-errors';
import { combineAndExecute } from './kysely';

export type HandlerResult<TResult> = TResult;

export type Handler<TState, Input, TResult> = (state: TState, props: { input: Input }) => HandlerResult<TResult>;

export type SaveCommandFn = (...cmds: QueryCommand[]) => void;

export type AsyncHandler<Input, TResult, TState> = (
  input: Input,
  ctx: TState,
  save: SaveCommandFn
) => Promise<HandlerResult<TResult>>;

export function createAsyncAction<T extends TSchema, TResult, TState = unknown>(mProps: {
  schema: T;
  // need to define inline for inference to work
  handler: (input: Static<T>, ctx: TState, props: { save: SaveCommandFn }) => Promise<TResult>;
}): AsyncHandler<Static<T>, TResult, TState> {
  const validate = createValidateFn(mProps.schema);

  async function handler(input: Static<T>, state: TState, addCommand: SaveCommandFn): Promise<HandlerResult<TResult>> {
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

  const wrappedHandler = async (input: Input, ctx: TState): Promise<HandlerResult<TResult>> => {
    const result = await handler(input, ctx, addCommand);
    await combineAndExecute(client, ...resultCommands);
    return result;
  };

  return wrappedHandler;
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
