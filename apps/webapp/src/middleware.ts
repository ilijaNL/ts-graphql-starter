import { NextMiddleware, NextRequest, NextResponse } from 'next/server';
import { createCookie, createRefreshCookieOps, refreshCookieKey } from './common/edge';
import { createRPCExecute } from '@/common/rpc/execute';
import { auth } from '@ts-hasura-starter/api';
import { routes } from './routes';

const AuthorizedPath = '/__authorized';

export const config = {
  matcher: ['/', '/__authorized'],
};

const baseDomain = process.env.NEXT_APP_BASE_DOMAIN!;
const apiEndpoint = process.env.NEXT_APP_AUTH_ENDPOINT!;

async function handleAuthorizedPath(req: NextRequest) {
  const url = req.nextUrl;

  const executeFn = createRPCExecute(auth.contract, apiEndpoint);

  const reqToken = url.searchParams.get('request_token');

  if (!reqToken) {
    return NextResponse.redirect(url, {});
  }

  const refreshToken = await executeFn('redeem', { t: reqToken })
    .then((d) => d.refreshToken)
    .catch((_) => '');

  if (refreshToken) {
    url.pathname = routes.account;
  } else {
    url.pathname = routes.login;
  }

  url.search = '';

  return NextResponse.redirect(url, {
    headers: {
      'Set-Cookie': createCookie(refreshCookieKey, refreshToken, createRefreshCookieOps(req)),
    },
  });
}

const middleware: NextMiddleware = async (req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;

  const host = req.headers.get('host') || baseDomain;

  // for dev, use app. since we need cookies
  if (host.startsWith('localhost')) {
    return NextResponse.redirect(baseDomain);
  }

  if (pathname.startsWith(AuthorizedPath)) {
    return handleAuthorizedPath(req);
  }

  return undefined;
};

export default middleware;
