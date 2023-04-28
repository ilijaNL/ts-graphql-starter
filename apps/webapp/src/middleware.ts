import { NextMiddleware, NextResponse } from 'next/server';
import { graphqlDocFetch } from './common/graphql-fetch';
import { GATEWAY_HEADERS, GRAPHQL_ENDPOINT } from './config';
import { RedeemDocument } from './__generated__/graphql';
import { createCookie, createRefreshCookieOps, refreshCookieKey } from './common/edge';

const AuthorizedPath = '/__authorized';

export const config = {
  matcher: [AuthorizedPath],
};

const middleware: NextMiddleware = async (req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname.startsWith(AuthorizedPath)) {
    const result = await graphqlDocFetch(
      GRAPHQL_ENDPOINT,
      RedeemDocument,
      {
        token: url.searchParams.get('request_token')!,
      },
      GATEWAY_HEADERS
    );

    const refreshToken = result.auth?.redeem ?? '';

    if (refreshToken) {
      url.pathname = '/account';
    } else {
      url.pathname = '/login';
    }

    url.search = '';

    return NextResponse.redirect(url, {
      headers: {
        'Set-Cookie': createCookie(refreshCookieKey, refreshToken, createRefreshCookieOps(req)),
      },
    });
  }

  return undefined;
};

export default middleware;
