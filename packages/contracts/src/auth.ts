import { createRPC, Type } from '@ts-hasura-starter/rpc';
import { Success } from './utils';

export const contract = createRPC({
  sendOTP: {
    type: 'mutation',
    input: Type.Union([
      Type.Object({
        email: Type.String({ format: 'email', maxLength: 64 }),
      }),
      Type.Object({
        phone: Type.String({ minLength: 6, maxLength: 16 }),
      }),
    ]),
    output: Success,
  },
  signInWithOTP: {
    type: 'mutation',
    input: Type.Object({
      value: Type.String({ minLength: 3, maxLength: 64 }),
      token: Type.String({ format: 'uuid' }),
    }),
    output: Type.Object({
      refreshToken: Type.String(),
    }),
  },
  redeem: {
    type: 'mutation',
    input: Type.Object({
      code_verifier: Type.String({ minLength: 12 }),
      token: Type.String({ format: 'uuid' }),
    }),
    output: Type.Object({
      refreshToken: Type.String(),
    }),
  },
  refresh: {
    type: 'mutation',
    input: Type.Object({
      rt: Type.String({
        minLength: 10,
      }),
    }),
    output: Type.Object({
      refreshToken: Type.String(),
    }),
  },
  'access-token': {
    type: 'mutation',
    input: Type.Object({
      rt: Type.String({
        minLength: 10,
      }),
      claims: Type.Array(
        Type.Union([
          Type.Object({
            type: Type.String(),
            role: Type.String({ maxLength: 64 }),
          }),
        ])
      ),
    }),
    output: Type.Object({
      access_token: Type.String(),
    }),
  },
});
