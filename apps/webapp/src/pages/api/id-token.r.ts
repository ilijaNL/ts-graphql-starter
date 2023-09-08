import {
  createClearCookie,
  createCookie,
  createRefreshCookieOps,
  getCookies,
  refreshCookieKey,
  refreshCookiePath,
} from '@/common/edge';
import { createRPCExecute } from '@/common/rpc/execute';
import { auth } from '@ts-hasura-starter/api';

export const config = {
  runtime: 'edge',
};

function getRefreshToken(req: Request): string | null {
  const cookies = getCookies(req.headers);
  const refreshToken = cookies.get(refreshCookieKey) ?? null;
  return refreshToken;
}

// nneed to define this since not embedded during build time
const AUTH_URL = process.env.NEXT_APP_AUTH_ENDPOINT!;
const executeFn = createRPCExecute(auth.contract, AUTH_URL);

async function getNewToken(currentToken: string): Promise<string> {
  return executeFn('refresh', { rt: currentToken }, {})
    .then((d) => d.refreshToken ?? '')
    .catch(() => '');
}

export default async function handler(req: Request) {
  const method = req.method.toLowerCase();
  const url = new URL(req.url);

  // refresh
  if (method === 'post' && url.searchParams.get('intent') === 'refresh') {
    const token = getRefreshToken(req);
    if (!token) {
      return new Response('ok');
    }

    const newToken = await getNewToken(token);

    if (!newToken) {
      return new Response('ok');
    }

    const cookie = createCookie(refreshCookieKey, token, createRefreshCookieOps(req));
    const responseHeaders = new Headers();
    responseHeaders.append('Set-Cookie', cookie);

    return new Response('ok', {
      headers: responseHeaders,
    });
  }

  if (method === 'post' && url.searchParams.get('intent') === 'access') {
    const token = getRefreshToken(req);
    if (!token) {
      return new Response('forbidden', {
        status: 403,
      });
    }

    // get access token
    const body = await req.json();
    const claims = body.claims;

    const { access_token } = await executeFn(
      'access-token',
      {
        claims: claims,
        rt: token,
      },
      {}
    );

    return new Response(access_token);
  }

  if (method === 'delete') {
    const cookieHeader = createClearCookie(refreshCookieKey, refreshCookiePath, req);
    return new Response('ok', {
      headers: new Headers({
        'Set-Cookie': cookieHeader,
      }),
    });
  }

  return new Response('not-found', {
    status: 404,
  });
}
