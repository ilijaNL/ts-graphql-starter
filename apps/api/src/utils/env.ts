import { Static, TSchema } from '@sinclair/typebox';
import { createValidateFn } from './schema';

export function parseEnvs<T extends TSchema>(schema: T) {
  const fn = createValidateFn(schema);
  const environment = process.env;

  if (!fn(environment)) {
    console.log({ errors: fn.errors });
    throw new Error('missing envs: ' + fn.errors?.map((e) => e.message).join(', '));
  }

  return environment as Static<T>;
}
