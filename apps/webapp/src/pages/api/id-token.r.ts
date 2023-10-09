import { apiClient } from '@/api-client';
import {
  createClearCookie,
  createCookie,
  createRefreshCookieOps,
  getCookies,
  refreshCookieKey,
  refreshCookiePath,
} from '@/common/edge';

export const config = {
  runtime: 'edge',
};

function getRefreshToken(req: Request): string | null {
  const cookies = getCookies(req.headers);
  const refreshToken = cookies.get(refreshCookieKey) ?? null;
  return refreshToken;
}

async function getNewToken(currentToken: string): Promise<string> {
  return apiClient.auth
    .refresh({ body: { rt: currentToken } })
    .then((d) => (d.ok ? d.data.refreshToken : ''))
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

    const access_token = await apiClient.auth['access-token']({
      body: {
        ...(await req.json()),
        rt: token,
      },
    }).then((d) => {
      if (d.ok) {
        return d.data.access_token;
      }

      throw d.error;
    });

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
