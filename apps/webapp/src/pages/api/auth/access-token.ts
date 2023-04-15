import { getAuthURL } from '@/config';
import { getRefreshCookie } from '@/common/refresh-cookie';
import type { AuthContext } from '@/common/auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { match } from 'ts-pattern';

/**
 * Proxy api route for retrieving access token with refresh token (gathered from cookie)
 * @param req
 * @param res
 * @returns
 */
export default async function accessToken(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(400).json({ success: false });
  }

  const refreshCookie = getRefreshCookie(req) ?? '';

  if (!refreshCookie) {
    return res.status(401).send('not-authenticated');
  }

  try {
    const context = req.body as AuthContext;

    const request = match(context)
      .with({ role: 'user' }, (r) =>
        fetch(`${getAuthURL()}/access-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rt: refreshCookie, claims: [{ type: 'hasura', role: r.role }] }),
        })
      )
      .with({ role: 'admin' }, () => {
        throw new Error('admin access token not implemented in ' + __dirname);
      })
      .exhaustive();

    const response = await request.then((d) => {
      if (d.status >= 400) {
        throw new Error(d.statusText);
      }

      return d.json();
    });
    return res.status(200).send(response);
  } catch (e: any) {
    return res.status(401).send(e.message ?? 'internal error');
  }
}
