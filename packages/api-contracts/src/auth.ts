import { defineRoute, Type } from 'typed-client';
import { Success } from './utils';

export const authPrefix = '/auth';

export const contract = {
  sendOTP: defineRoute({
    method: 'POST',
    path: '/send-otp',
    body: Type.Union([
      Type.Object({
        email: Type.String({ format: 'email', maxLength: 64 }),
      }),
      Type.Object({
        phone: Type.String({ minLength: 6, maxLength: 16 }),
      }),
    ]),
    responses: {
      success: Success,
    },
  }),
  signInWithOTP: defineRoute({
    method: 'POST',
    path: '/sign-in',
    body: Type.Object({
      value: Type.String({ minLength: 3, maxLength: 64 }),
      token: Type.String({ format: 'uuid' }),
    }),
    responses: {
      success: Type.Object({
        refreshToken: Type.String(),
      }),
    },
  }),
  redeem: defineRoute({
    method: 'POST',
    path: '/redeem',
    body: Type.Object({
      code_verifier: Type.String({ minLength: 12 }),
      token: Type.String({ format: 'uuid' }),
    }),
    responses: {
      success: Type.Object({
        refreshToken: Type.String(),
      }),
    },
  }),
  refresh: defineRoute({
    method: 'POST',
    path: '/refresh',
    body: Type.Object({
      rt: Type.String({
        minLength: 10,
      }),
    }),
    responses: {
      success: Type.Object({
        refreshToken: Type.String(),
      }),
    },
  }),
  'access-token': defineRoute({
    method: 'POST',
    path: '/access-token',
    body: Type.Object({
      rt: Type.String({
        minLength: 10,
      }),
      token: Type.Union([
        Type.Object({
          type: Type.Literal('user'),
        }),
        Type.Object({
          type: Type.Literal('club_member'),
          clubId: Type.String({ format: 'uuid' }),
        }),
      ]),
    }),
    responses: {
      success: Type.Object({
        access_token: Type.String(),
      }),
    },
  }),
};
