import { getAuthURL } from '@/config';
import { getRefreshCookie, setRefreshCookie } from '@/common/refresh-cookie';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function refresh(req: NextApiRequest, res: NextApiResponse) {
  const refreshCookie = getRefreshCookie(req) ?? '';
  let refresh_token = '';

  if (refreshCookie) {
    refresh_token = await fetch(`${getAuthURL()}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshCookie }),
    })
      .then((d) => {
        if (d.status >= 400) {
          throw new Error(d.statusText);
        }

        return d.json();
      })
      .then((d) => {
        setRefreshCookie(d.refreshToken, res, req);
        return d.refreshToken;
      })
      .catch((_err) => {
        // clearRefreshCookie(res, req);
        return '';
      });
  }

  if (req.method === 'POST') {
    return res.json({
      refresh_token,
    });
  }

  if (req.method === 'GET') {
    return res.redirect('/');
  }

  return res.status(404).send('not-allowed');
}
