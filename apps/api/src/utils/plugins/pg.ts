import { Pool, PoolConfig, types } from 'pg';
import fp from 'fastify-plugin';

types.setTypeParser(types.builtins.TIMESTAMPTZ, function (val) {
  return val;
});

declare module 'fastify' {
  export interface FastifyInstance {
    pgPool: Pool;
  }
}

const poolPlugin = fp<{ poolConfig: PoolConfig }>(async (fastify, opts) => {
  const pgPool = new Pool(opts.poolConfig);
  fastify.decorate('pgPool', pgPool);
  fastify.addHook('onClose', (_, done) => {
    fastify.log.info('closing pg pool');
    pgPool.end(done);
  });
});

export default poolPlugin;
