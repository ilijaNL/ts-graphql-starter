import ENVS from '@/env';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { DB } from './__generated__/auth-db';
import { oauth } from './oauth';
import { authProcedures } from './service';
import { createFastifyPool } from '@/utils/plugins/pg-pool';
import { registerProcedures } from '@/utils/rpc';
import { accountProcedures } from './account';
import createHttpError from 'http-errors';
import { getUserAuthFromRequest } from '@/jwt';
import { createAuth } from './lib';
import AUTH_ENV from './env';
import { domainIsAllowed } from '@/domains';
import { createQueryBuilder } from '@/utils/kysely';
import { createMigrations } from './lib/migrations';
import { migrate } from '@/utils/migration';
import { kyselyCodegenForSchema } from '@/utils/kysely-codegen';
import path from 'node:path';

/**
 * Setup the service and expose as authService
 */
export const authService: FastifyPluginAsyncTypebox<{ schema?: string }> = async (fastify, opts) => {
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

  const authService = createAuth({
    pgSchema: dbSchema,
    db: pgPool,
    jwt: {
      iss: 'auth',
      secret: AUTH_ENV.ACCESS_TOKEN_SECRET,
      shortTokenInSec: parseInt(AUTH_ENV.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
      refreshTokenInSec: parseInt(AUTH_ENV.JWT_REFRESH_TOKEN_EXPIRATION_TIME),
    },
    oauth: {
      authURL: AUTH_ENV.AUTH_URL,
      async validateUrl(redirectUrl) {
        return domainIsAllowed(redirectUrl);
      },
      oauthProviders: {
        google:
          AUTH_ENV.GOOGLE_OAUTH_CLIENT_ID && AUTH_ENV.GOOGLE_OAUTH_SECRET
            ? {
                key: AUTH_ENV.GOOGLE_OAUTH_CLIENT_ID,
                secret: AUTH_ENV.GOOGLE_OAUTH_SECRET,
                scope: ['profile', 'openid', 'email'],
              }
            : undefined,
        linkedin:
          AUTH_ENV.LINKEDIN_OAUTH_CLIENT_ID && AUTH_ENV.LINKEDIN_OAUTH_SECRET
            ? {
                key: AUTH_ENV.LINKEDIN_OAUTH_CLIENT_ID,
                secret: AUTH_ENV.LINKEDIN_OAUTH_SECRET,
                pkce: false,
                scope: ['r_emailaddress', 'r_liteprofile'],
              }
            : undefined,
        microsoft:
          AUTH_ENV.MICROSOFT_OAUTH_CLIENT_ID && AUTH_ENV.MICROSOFT_OAUTH_SECRET
            ? {
                key: AUTH_ENV.MICROSOFT_OAUTH_CLIENT_ID,
                secret: AUTH_ENV.MICROSOFT_OAUTH_SECRET,
                scope: ['openid', 'email'],
              }
            : undefined,
      },
    },
  });

  fastify.addHook('onClose', () => authService.stop());

  const qb = createQueryBuilder<DB>(pgPool, dbSchema);

  void fastify.register(oauth, {
    authService: authService,
  });

  void registerProcedures(fastify, authProcedures, {
    contextFactory(req) {
      return {
        fastify: req.server,
        authService: authService,
      };
    },
  });

  void registerProcedures(fastify, accountProcedures, {
    prefix: '/account',
    contextFactory(req) {
      const user = getUserAuthFromRequest(req);

      if (!user) {
        throw new createHttpError.Forbidden('not-authenticated');
      }

      return {
        fastify: req.server,
        builder: qb,
        authService,
        pool: pgPool,
        account_id: user.acc_id,
      };
    },
  });
};
