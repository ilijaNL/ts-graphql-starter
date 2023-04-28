import { serialize, CookieSerializeOptions } from 'cookie';

export function getCookies(headers: Headers) {
  const cookie = headers.get('cookie');
  const cookies = new Map();
  if (!cookie) {
    return cookies;
  }
  const pairs = cookie.split(/;\s+/);
  for (const pair of pairs) {
    const parts = pair.trim().split('=');
    cookies.set(parts[0], parts[1]);
  }
  return cookies;
}

export const refreshCookieKey = '__ID_REFRESH_TOKEN__';
export const refreshCookiePath = '/api/id-token';
export const refreshCookieDuration = 1209600; // 14 days

const isSecure = process.env.NODE_ENV === 'production';

/**
 * This sets `cookie` using the `res` object
 */

export const createCookie = (name: string, value: unknown, options: CookieSerializeOptions = {}) => {
  const stringValue = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

  if (typeof options.maxAge === 'number') {
    options.expires = new Date(Date.now() + options.maxAge * 1000);
  }

  return serialize(name, stringValue, options);
};

/**
 * If we on a subdomain such as componya.app.com, we return a wildcard domain *.app.com
 * if custom domain, we create cookie for *.customdomain.com
 */
const getCookieDomain = (req: Request) => {
  const ROOT_HOST = new URL(process.env.NEXT_APP_BASE_DOMAIN!);
  // check if root domain
  const host = req.headers.get('host') ?? 'app.localhost:3000';

  const domain = host.replace(`.${ROOT_HOST.host}`, '');
  const isMain = domain === host;
  return isMain ? `.${host.split(':')[0]}` : `.${ROOT_HOST.hostname}`;
};

export const createClearCookie = (cookie: string, path: string, req: Request) => {
  return createCookie(cookie, '', {
    expires: new Date(1),
    maxAge: undefined,
    path: path,
    sameSite: 'lax',
    secure: isSecure,
    httpOnly: true,
    domain: getCookieDomain(req),
  });
};

export const createRefreshCookieOps = (req: Request): CookieSerializeOptions => ({
  maxAge: refreshCookieDuration, // 14 days
  path: refreshCookiePath,
  sameSite: 'lax',
  httpOnly: true,
  secure: isSecure,
  domain: getCookieDomain(req),
});
