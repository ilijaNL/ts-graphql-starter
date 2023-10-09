import { FastifyPluginAsync, FastifyServerOptions, RouteOptions } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import environment from './env';
import { domainIsAllowed } from './domains';
import { authPlugin } from './services/auth';
import { accountPlugin } from './services/account';
import { registerPool } from './utils/plugins/pg-pool';
import ENVS from './env';

const IS_PROD = environment.NODE_ENV === 'production';

const app: FastifyPluginAsync = async (fastify) => {
  if (IS_PROD) {
    await fastify.register(fastifyHelmet);
  }

  await fastify.register(cors, {
    credentials: true,
    // if not set, the requested headers are allowed
    // allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      domainIsAllowed(origin)
        .then((isAllowed) => {
          if (isAllowed) {
            return callback(null, true);
          }

          callback(new Error('Not allowed'), false);
        })
        .catch(() => {
          callback(new Error('Not allowed'), false);
        });
    },
  });

  if (!IS_PROD) {
    fastify.addHook('onRoute', (route: RouteOptions) => {
      fastify.log.info(`${route.url}`);
    });
  }

  void fastify.register(sensible);

  void registerPool(fastify, {
    connectionString: ENVS.PG_CONNECTION,
    max: 16,
  });

  void fastify.register(authPlugin, {
    prefix: '/auth',
  });

  void fastify.register(accountPlugin, {
    prefix: '/account',
  });

  fastify.get('/_health', (_, reply) => {
    return reply.status(200).send('ok');
  });
};

// this will be used by fastify cli
export const options: FastifyServerOptions = {
  trustProxy: true,
};

export default app;
