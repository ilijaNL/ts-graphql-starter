import { NextMiddleware, NextRequest, NextResponse } from 'next/server';
import { createCookie, createRefreshCookieOps, refreshCookieKey } from './common/edge';
import { routes } from './routes';
import { apiClient } from './api-client';

const AuthorizedPath = '/__authorized';

export const config = {
  matcher: ['/', '/__authorized'],
};

const baseDomain = process.env.NEXT_APP_BASE_DOMAIN!;

/**
 * 1. Check if token & verifier exist
 * 2. clean up the search param
 * 3. clean up the pkce
 * 4. Try to fetch refresh token
 * 5. redirect to login if no refresh token
 * 6. redirect to dashboard if refresh token is set
 */
async function handleAuthorizedPath(req: NextRequest) {
  const url = req.nextUrl;
  const token = url.searchParams.get('token');
  const verifier = req.cookies.get('pkce')?.value;

  // clean up
  url.search = '';

  if (!token || !verifier) {
    url.pathname = routes.login;
    url.search = '?error=no-token';
    return NextResponse.redirect(url, {});
  }

  req.cookies.delete('pkce');

  const refreshToken = await apiClient.auth
    .redeem({
      body: { token, code_verifier: verifier },
    })
    .then((d) => (d.ok ? d.data.refreshToken : ''));

  if (!refreshToken || refreshToken.length < 10) {
    url.pathname = routes.login;
    url.search = '?error=invalid-token';
    return NextResponse.redirect(url, {});
  }

  url.pathname = routes.account;

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
