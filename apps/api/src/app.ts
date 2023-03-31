import { FastifyPluginAsync, FastifyServerOptions, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import fastifyHelmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import environment from './env';

const IS_PROD = environment.NODE_ENV === 'production';

const app: FastifyPluginAsync = async (fastify) => {
  if (IS_PROD) {
    await fastify.register(fastifyHelmet);
  }

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

  fastify.get('/_health', (_, reply) => {
    return reply.status(200).send('ok');
  });
};

// this will be used by fastify cli
export const options: FastifyServerOptions = {
  trustProxy: true,
};

export default app;
