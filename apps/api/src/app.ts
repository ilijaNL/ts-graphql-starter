import { FastifyPluginAsync, FastifyServerOptions, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import fastifyHelmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import environment from './env';
import { authService } from './services/auth';
import { domainIsAllowed } from './domains';

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
    await fastify.register(
      fp(async function (instance) {
        instance.addHook('onRoute', (route: RouteOptions) => {
          instance.log.info(`${route.url}`);
        });
      })
    );
  }

  await fastify.register(sensible);

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  fastify.register(authService, {
    prefix: '/auth',
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
