import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import PROXY_ENV from './env';
import { createVerifier } from 'fast-jwt';
import { FastifyRequest } from 'fastify';

const verifyJwt = createVerifier({ cache: true, key: PROXY_ENV.ACCESS_TOKEN_SECRET, allowedIss: ['auth'] });

type AccessToken = {
  acc_id: string;
  sub: string;
} & Record<string, unknown>;

function getUserAuthFromRequest(request: FastifyRequest): AccessToken | null {
  try {
    const verifiedToken = verifyJwt((request.headers.authorization ?? '').replace('Bearer ', '')) as AccessToken;
    return verifiedToken;
  } catch (e) {
    return null;
  }
}

const anonymousClaims = {
  'X-Hasura-Role': 'anonymous',
};

export const proxyService: FastifyPluginAsyncTypebox = async (fastify) => {
  // TODO: cache by the token duration
  fastify.route({
    url: '/hasura/claims',
    method: ['POST', 'GET'],
    handler: async function getHasuraClaims(req, reply) {
      const secret = req.headers['x-gateway-secret'];

      if (!secret || secret !== PROXY_ENV.GATEWAY_SECRET) {
        return reply.unauthorized('invalid gateway secret');
      }

      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return anonymousClaims;
      }

      const accessToken = getUserAuthFromRequest(req);

      if (!accessToken) {
        return anonymousClaims;
      }

      const hasuraClaims = accessToken['hg'];

      if (!hasuraClaims) {
        return anonymousClaims;
      }

      return Object.keys(hasuraClaims).reduce((agg, key) => {
        agg[`x-hasura-${key}`] = (hasuraClaims as any)[key];
        return agg;
      }, {} as Record<string, any>);
    },
  });
};
