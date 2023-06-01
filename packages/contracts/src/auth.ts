import { createRPC } from '@ts-hasura-starter/rpc';
import { Type } from '@sinclair/typebox';

export const contract = createRPC({
  redeem: {
    type: 'mutation',
    input: Type.Object({
      t: Type.String({}),
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
