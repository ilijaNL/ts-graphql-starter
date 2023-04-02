import { getAuthURL } from '@/config';
import { clearRefreshCookie, setRefreshCookie } from '@/common/refresh-cookie';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function acquire(req: NextApiRequest, res: NextApiResponse) {
  let refresh_token = '';

  try {
    const payload = JSON.stringify({
      request_token: req.query.request_token as string,
    });
    const result = await fetch(`${getAuthURL()}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    }).then((d) => {
      if (d.status >= 400) {
        throw new Error(d.statusText);
      }

      return d.json();
    });

    refresh_token = result.refreshToken;

    if (refresh_token) {
      // clear previous cookie first
      clearRefreshCookie(res, req);
      setRefreshCookie(refresh_token, res, req);
    }

    //
  } catch (e) {
    // catch per error basic, and then redirect accordingly
    console.log({ e });
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
