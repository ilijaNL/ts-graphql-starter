import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Kysely, PostgresDialect } from 'kysely';

export type KyselyOpts = { namespace: string; schema: string };

const kyselyPlugin = fp<KyselyOpts>(async (fastify, opts) => {
  const pool = fastify.pgPool;
  const kysely = new Kysely({
    dialect: new PostgresDialect({
      pool: pool,
    }),
  });

  const queryBuilder = kysely.withSchema(opts.schema);
  fastify.decorate(opts.namespace, queryBuilder);
});

export const registerKysely = async (fastify: FastifyInstance, config: KyselyOpts) => {
  await fastify.register(kyselyPlugin, config);
};
