import fastifyCookie, { CookieSerializeOptions } from '@fastify/cookie';
import { Type, FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import AUTH_ENV from './env';
import type { AuthService } from './lib';
import { OAuthProviders } from './lib/common';
import { FlowSession } from './lib/oauth';

const SESSION_STORE_KEY = '__session_auth_store';

export const oauth: FastifyPluginAsyncTypebox<{
  authService: AuthService;
}> = async (fastify, { authService }) => {
  // need cookie to store auth
  await fastify.register(fastifyCookie, {
    secret: AUTH_ENV.COOKIE_SECRET,
  });

  // start flow
  fastify.route({
    method: ['GET'],
    url: `/signin/:provider`,
    schema: {
      querystring: Type.Object({
        redirectUrl: Type.String({ format: 'uri' }),
        // add code challenge
        code_challenge: Type.String({ minLength: 12 }),
      }),
      params: Type.Object({
        provider: Type.String(),
      }),
    },
    handler: async function handler(req, reply) {
      const { flowSession, location } = await authService.oauth.connect({
        code_challenge: req.query.code_challenge,
        provider: req.params.provider as OAuthProviders,
        redirectUrl: req.query.redirectUrl,
      });

      const cookieConfig: CookieSerializeOptions = {
        // make this short
        maxAge: 60 * 5, // in seconds
        secure: 'auto',
        httpOnly: true,
        sameSite: 'lax',
        signed: true,
        path: `/auth/signin/${req.params.provider}`,
      };

      return (
        reply
          .setCookie(SESSION_STORE_KEY, JSON.stringify(flowSession), cookieConfig)
          //
          .redirect(location)
      );
    },
  });

  /**
   * Callback route for the oauth2 flow
   * happy path redirects to page with a request token
   */
  fastify.route({
    method: ['GET'],
    url: `/signin/:provider/callback`,
    schema: {
      params: Type.Object({
        provider: Type.String(),
      }),
    },
    /**
     * 1. Extract the cookie
     * 2. Complete the oauth flow
     */
    handler: async function handler(req, reply) {
      const _session = req.cookies[SESSION_STORE_KEY];

      void reply.clearCookie(SESSION_STORE_KEY);

      if (!_session) {
        return reply.notFound();
      }

      const { value: decryptedSession, valid: vs } = req.unsignCookie(_session);

      if (!vs || !decryptedSession) {
        fastify.log.error({ decryptedSession });
        return reply.notFound();
      }

      const session = JSON.parse(decryptedSession) as FlowSession;

      const { location } = await authService.oauth.callback({
        provider: req.params.provider as OAuthProviders,
        flowSession: session,
        query: req.query as any,
      });

      return reply.redirect(302, location);
    },
  });
};
