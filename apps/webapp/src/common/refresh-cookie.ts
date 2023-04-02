import { serialize, CookieSerializeOptions } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next/types';

const refreshCookieKey = '__ID_REFRESH_TOKEN__';
const refreshCookiePath = '/api/auth';
const refreshCookieDuration = 1209600; // 14 days
const isSecure = process.env.NODE_ENV === 'production';

/**
 * This sets `cookie` using the `res` object
 */

export const setCookie = (res: NextApiResponse, name: string, value: unknown, options: CookieSerializeOptions = {}) => {
  const stringValue = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

  if (typeof options.maxAge === 'number') {
    options.expires = new Date(Date.now() + options.maxAge * 1000);
  }

  res.setHeader('Set-Cookie', serialize(name, stringValue, options));
};

/**
 * If we on a subdomain such as componya.app.com, we return a wildcard domain *.app.com
 * if custom domain, we create cookie for *.customdomain.com
 */
const getCookieDomain = (req: NextApiRequest) => {
  const ROOT_HOST = new URL(process.env.NEXT_APP_ROOT_DOMAIN!);
  // check if root domain
  const host = req.headers['host'] ?? 'app.localhost:3000';

  const domain = host.replace(`.${ROOT_HOST.host}`, '');
  const isMain = domain === host;
  return isMain ? `.${host.split(':')[0]}` : `.${ROOT_HOST.hostname}`;
};

export const clearRefreshCookie = (res: NextApiResponse, req: NextApiRequest) => {
  setCookie(res, refreshCookieKey, '', {
    expires: new Date(1),
    maxAge: undefined,
    path: refreshCookiePath,
    sameSite: 'lax',
    secure: isSecure,
    httpOnly: true,
    domain: getCookieDomain(req),
  });
};

export const getRefreshCookie = (req: NextApiRequest) => req.cookies[refreshCookieKey];

export const setRefreshCookie = (refreshToken: string, res: NextApiResponse, req: NextApiRequest) => {
  // clear previous first so we dont have any stale
  clearRefreshCookie(res, req);
  setCookie(res, refreshCookieKey, refreshToken, {
    maxAge: refreshCookieDuration, // 14 days
    path: refreshCookiePath,
    sameSite: 'lax',
    httpOnly: true,
    secure: isSecure,
    domain: getCookieDomain(req),
  });
};
