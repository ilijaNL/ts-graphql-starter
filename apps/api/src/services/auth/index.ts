import ENVS from '@/env';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createFastifyPool } from '@/utils/plugins/pg-pool';
import { registerProcedures } from '@/utils/rpc';
import { createAccountProcedures } from './account-procedures';
import createHttpError from 'http-errors';
import { getUserAuthFromRequest } from '@/jwt';
import { createMigrations } from './migrations';
import { migrate } from '@/utils/migration';
import { kyselyCodegenForSchema } from '@/utils/kysely-codegen';
import path from 'node:path';
import { createAccountService } from './account';
import { createAuthService } from './auth';
import { createAuthProcedures } from './service';
import { oauth } from './oauth';

/**
 * Setup the service and expose as authService
 */
export const authPlugin: FastifyPluginAsyncTypebox<{ schema?: string }> = async (fastify, opts) => {
  // SETUP
  const dbSchema = opts.schema ?? 'auth';

  // create own pool
  const pgPool = createFastifyPool(fastify, {
    //
    connectionString: ENVS.PG_CONNECTION,
    max: 5,
  });

  // apply migrations for auth service
  await migrate({
    schema: dbSchema,
    pool: pgPool,
    migrations: createMigrations({ schema: dbSchema }),
    migrationTable: '_migrations',
  });

  if (ENVS.NODE_ENV === 'development') {
    await kyselyCodegenForSchema(
      ENVS.PG_CONNECTION,
      dbSchema,
      path.join(__dirname, '__generated__', `${dbSchema}-db.d.ts`)
    );
  }

  const accountService = createAccountService();
  const authService = createAuthService({ accountService: accountService, pg: pgPool });

  void registerProcedures(fastify, createAuthProcedures({ authService: authService, pg: pgPool }), {
    contextFactory(req) {
      return {
        fastify: req.server,
        authService: authService,
      };
    },
  });

  void fastify.register(oauth, {
    authService: authService,
    pg: pgPool,
  });

  void registerProcedures(fastify, createAccountProcedures(accountService, pgPool), {
    prefix: '/account',
    contextFactory(req) {
      const user = getUserAuthFromRequest(req);

      if (!user) {
        throw new createHttpError.Forbidden('not-authenticated');
      }

      return {
        account_id: user.acc_id,
      };
    },
  });
};
