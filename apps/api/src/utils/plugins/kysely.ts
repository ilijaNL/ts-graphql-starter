import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export type KyselyOpts = { namespace: string; schema: string; pool: Pool };

const kyselyPlugin = fp<KyselyOpts>(async (fastify, opts) => {
  const kysely = new Kysely({
    dialect: new PostgresDialect({
      pool: opts.pool,
    }),
  });

  const queryBuilder = kysely.withSchema(opts.schema);
  fastify.decorate(opts.namespace, queryBuilder);
});

export const registerKysely = async (fastify: FastifyInstance, config: KyselyOpts) => {
  await fastify.register(kyselyPlugin, config);
};

export function createQueryBuilder<T>(pool: Pool, schema: string) {
  const kysely = new Kysely<T>({
    dialect: new PostgresDialect({
      pool: pool,
    }),
  });
  const queryBuilder = kysely.withSchema(schema);
  return queryBuilder;
}
