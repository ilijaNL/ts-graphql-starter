import path from 'path';
import ENVS from '@/env';
import { migrate } from '@/utils/migration';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { DB } from './__generated__/auth-db';
import { createQueryBuilder } from '@/utils/plugins/kysely';
import { oauth } from './oauth';
import { authProcedures } from './service';
import { createFastifyPool } from '@/utils/plugins/pg-pool';
import { registerProcedures } from '@/utils/rpc';
import { accountProcedures } from './account';
import createHttpError from 'http-errors';
import { getUserAuthFromRequest } from '@/jwt';

/**
 * Setup the service and expose as authService
 */
export const authService: FastifyPluginAsyncTypebox<{ schema?: string }> = async (fastify, opts) => {
  // SETUP
  const dbSchema = opts.schema ?? 'auth';

  const pgPool = createFastifyPool(fastify, { connectionString: ENVS.PG_CONNECTION, max: 5 });

  await migrate(pgPool, {
    // we need to have migrations in the root directory because typescript wont copy the sql files when build
    directory: path.join(process.cwd(), 'migrations', 'auth'),
    schema: dbSchema,
  });

  const qb = createQueryBuilder<DB>(pgPool, dbSchema);

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  fastify.register(oauth, {
    builder: qb,
    pool: pgPool,
  });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  registerProcedures(fastify, authProcedures, {
    contextFactory(req) {
      return {
        fastify: req.server,
        builder: qb,
        pool: pgPool,
      };
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  registerProcedures(fastify, accountProcedures, {
    prefix: '/account',
    contextFactory(req) {
      const user = getUserAuthFromRequest(req);

      if (!user) {
        throw new createHttpError.Forbidden('not-authenticated');
      }

      return {
        fastify: req.server,
        builder: qb,
        pool: pgPool,
        account_id: user.acc_id,
      };
    },
  });
};
