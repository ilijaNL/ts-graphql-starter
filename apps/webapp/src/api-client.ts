import { Type, createClient, defineRoute, processReponse } from 'typed-client';
import getEnv from './config';
import { getAuthHeaders } from './common/auth';
import { account, auth } from '@ts-hasura-starter/api';

// this ensure we can access this env in frontend, nodejs api and edge functions
const origin = getEnv('API') ?? (process.env.NEXT_APP_API as string);

export const refreshTokenRoute = defineRoute({
  method: 'POST',
  path: '/id-token',
  query: Type.Object({
    intent: Type.Literal('refresh'),
  }),
  responses: {
    success: Type.Any(),
  },
});

export const accessTokenRoute = defineRoute({
  method: 'POST',
  path: '/id-token',
  body: Type.Object({
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
  query: Type.Object({
    intent: Type.Literal('access'),
  }),
  responses: {
    success: Type.String(),
  },
});

export const apiClient = createClient({
  origin: origin,
  basePath: '/',
})
  // Tokens
  .register('tokens', '/', {
    async fetchFn({ appRoute: route, headers, parsedBody, query }) {
      const params = new URLSearchParams((query as any) ?? {});
      const result = await fetch('/api/id-token?' + params.toString(), {
        method: route.method,
        headers: headers,
        body: parsedBody,
      });

      return processReponse(result);
    },
    build: (builder) =>
      builder
        //
        .addRoute('refresh', refreshTokenRoute)
        .addRoute('access', accessTokenRoute),
  })
  .register('me', '/account/me', {
    async fetchFn(props, parentFetch) {
      const authHeaders = await getAuthHeaders({ type: 'user' });
      return parentFetch({ ...props, headers: { ...props.headers, ...authHeaders } });
    },
    build: (builder) => builder.addRoutes(account.contract),
  })
  .register('auth', auth.authPrefix, {
    build: (builder) => builder.addRoutes(auth.contract),
  })
  .build();
