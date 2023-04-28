import { RefreshTokenDocument } from '@/__generated__/graphql';
import {
  createClearCookie,
  createCookie,
  createRefreshCookieOps,
  getCookies,
  refreshCookieKey,
  refreshCookiePath,
} from '@/common/edge';
import { graphqlDocFetch } from '@/common/graphql-fetch';
import { GRAPHQL_ENDPOINT } from '@/config';

export const config = {
  runtime: 'edge',
};

function getRefreshToken(req: Request) {
  const cookies = getCookies(req.headers);
  const refreshToken = cookies.get(refreshCookieKey) ?? '';
  return refreshToken;
}

async function getNewToken(currentToken: string): Promise<string> {
  return graphqlDocFetch(GRAPHQL_ENDPOINT, RefreshTokenDocument, {
    token: currentToken,
  })
    .then((d) => d.auth?.refresh ?? '')
    .catch((_err) => {
      return '';
    });
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
