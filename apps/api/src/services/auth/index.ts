import ENVS from '@/env';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { getPoolFromFastify } from '@/utils/plugins/pg-pool';
import { createMigrations } from './migrations';
import { migrate } from '@/utils/migration';
import { kyselyCodegenForSchema } from '@/utils/kysely-codegen';
import path from 'node:path';
import { AuthService, createAuthService } from './actions';
import fp from 'fastify-plugin';
import { oauth } from './oauth';
import fastifyJWT from '@fastify/jwt';
import { authRoutes } from './routes';

export type AccessToken = {
  acc_id: string;
  sub: string;
} & Record<string, unknown>;

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessToken;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Authenticates the user and sets to `accessToken` to the request object.
     *
     * Use `request.user` to access the authenticated user object
     * */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authService: AuthService;
  }
}

/**
 * Setup the service and expose as authService
 */
const _authPlugin: FastifyPluginAsyncTypebox<{ schema?: string; prefix: string }> = async (fastify, opts) => {
  // SETUP
  const dbSchema = opts.schema ?? 'auth';
  const pgPool = getPoolFromFastify(fastify);

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

  const authService = createAuthService(fastify);

  const ISS = 'auth';
  void fastify.register(fastifyJWT, {
    secret: ENVS.ACCESS_TOKEN_SECRET,
    sign: {
      iss: ISS,
    },
    verify: {
      allowedIss: [ISS],
      cache: true,
    },
  });

  fastify.decorate('authenticate', async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      void reply.send(err);
    }
  });

  fastify.decorate('authService', authService);

  // register routes
  void fastify.register(
    async (fastify) => {
      void fastify.register(authRoutes);
      void fastify.register(oauth);
    },
    {
      prefix: opts.prefix,
    }
  );
};

export const authPlugin = fp(_authPlugin);
