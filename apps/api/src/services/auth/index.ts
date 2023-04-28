import path from 'path';
import ENVS from '@/env';
import { migrate } from '@/utils/migration';
import { registerPool } from '@/utils/plugins/pg-pool';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { DB } from './__generated__/auth-db';
import { QueryCreator } from 'kysely';
import { registerKysely } from '@/utils/plugins/kysely';
import { oauth } from './oauth';
import { authProcedures } from './service';
import { createYoga } from 'graphql-yoga';
import { GraphQLContext, builder } from './graphql';

export type AuthQueryBuilder = QueryCreator<DB>;

declare module 'fastify' {
  export interface FastifyInstance {
    db_auth: AuthQueryBuilder;
  }
}

/**
 * Setup the service and expose as authService
 */
export const authService: FastifyPluginAsyncTypebox<{ schema?: string }> = async (fastify, opts) => {
  // SETUP
  const dbSchema = opts.schema ?? 'auth';
  await registerPool(fastify, { connectionString: ENVS.PG_CONNECTION, max: 5 });
  await migrate(fastify.pgPool, {
    // we need to have migrations in the root directory because typescript wont copy the sql files when build
    directory: path.join(process.cwd(), 'migrations', 'auth'),
    schema: dbSchema,
  });

  await registerKysely(fastify, { namespace: 'db_auth', schema: dbSchema });

  fastify.register(oauth);

  /**
   * Redeem the request token whichs results in a refresh token
   */
  fastify.post(
    '/redeem',
    {
      schema: {
        body: authProcedures.redeem.def.input,
        response: {
          '2xx': authProcedures.redeem.def.output,
        },
      },
    },
    (req) => {
      return authProcedures.redeem.execute(req.body, { fastify });
    }
  );

  /**
   * Refresh refresh token
   */
  fastify.post(
    '/refresh',
    {
      schema: {
        body: authProcedures.refresh.def.input,
        response: {
          '2xx': authProcedures.refresh.def.output,
        },
      },
    },
    (request) => {
      return authProcedures.refresh.execute(request.body, { fastify });
    }
  );

  fastify.post(
    '/access-token',
    {
      schema: {
        body: authProcedures['access-token'].def.input,
        response: {
          '2xx': authProcedures['access-token'].def.output,
        },
      },
    },
    (req) => {
      return authProcedures['access-token'].execute(req.body, { fastify });
    }
  );

  // add graphql schema
  const server = createYoga<GraphQLContext>({
    schema: builder.toSchema(),
    landingPage: false,
    graphqlEndpoint: '/auth/graphql',
  });

  fastify.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await server.handleNodeRequest(req, {
        fastify: fastify,
      });

      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      reply.status(response.status);
      reply.send(response.body);

      return reply;
    },
  });
};
