import {
  createClearCookie,
  createCookie,
  createRefreshCookieOps,
  getCookies,
  refreshCookieKey,
  refreshCookiePath,
} from '@/common/edge';
import { createRPCExecute } from '@/common/rpc/execute';
import getConfig from '@/config';
import { auth } from '@ts-hasura-starter/api';

export const config = {
  runtime: 'edge',
};

function getRefreshToken(req: Request) {
  const cookies = getCookies(req.headers);
  const refreshToken = cookies.get(refreshCookieKey) ?? '';
  return refreshToken;
}

// nneed to define this since not embedded during build time
const AUTH_URL = getConfig('AUTH_ENDPOINT');

async function getNewToken(currentToken: string): Promise<string> {
  const executeFn = createRPCExecute(auth.contract, AUTH_URL);

  return executeFn('refresh', { rt: currentToken })
    .then((d) => d.refreshToken ?? '')
    .catch(() => '');
}

export default async function handler(req: Request) {
  const method = req.method.toLowerCase();
  // get is to retrieve the cookie
  if (method === 'get') {
    return new Response(getRefreshToken(req));
  }

  // refresh
  if (method === 'post') {
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
