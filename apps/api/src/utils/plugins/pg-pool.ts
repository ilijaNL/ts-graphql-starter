import { Pool, PoolConfig, types } from 'pg';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

types.setTypeParser(types.builtins.TIMESTAMPTZ, function (val) {
  return val;
});

// declare module 'fastify' {
//   export interface FastifyInstance {
//     pgPool: Pool;
//   }
// }

const poolPlugin = fp<{ poolConfig: PoolConfig }>(async (fastify, opts) => {
  const pgPool = createFastifyPool(fastify, opts.poolConfig);
  fastify.decorate('pgPool', pgPool);
});

export const getPoolFromFastify = (fastify: FastifyInstance): Pool => {
  const pool = (fastify as FastifyInstance & { pgPool: Pool | undefined }).pgPool;
  if (!pool) {
    throw new Error('pool is not registered on fastify instance');
  }

  return pool;
};

export const registerPool = (fastify: FastifyInstance, config: PoolConfig) =>
  fastify.register(poolPlugin, {
    poolConfig: config,
  });

/**
 * Creates a pg pool and gracefully closes the pool when fastify closes
 */
export const createFastifyPool = (fastify: FastifyInstance, config: PoolConfig) => {
  const pgPool = new Pool(config);
  fastify.addHook('onClose', (_, done) => {
    fastify.log.info('closing pg pool');
    pgPool.end(done);
  });

  return pgPool;
};
