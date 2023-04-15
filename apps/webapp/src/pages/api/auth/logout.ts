import { clearRefreshCookie } from '@/common/refresh-cookie';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function callback(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    clearRefreshCookie(res, req);
    return res.json({ success: true });
  }

  if (req.method === 'GET') {
    clearRefreshCookie(res, req);
    return res.redirect('/');
  }

  return res.status(404).send('not-allowed');
}
