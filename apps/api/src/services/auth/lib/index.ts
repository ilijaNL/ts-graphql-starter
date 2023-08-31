import { Pool, PoolConfig } from 'pg';
import { JWTOptions, createJWTFactory } from './common';
import { OAuthConfig, createOAuth } from './oauth';
import { createOTP } from './otp';
import { DB } from '../__generated__/auth-db';
import createHttpError from 'http-errors';
import { createAccount } from './account';
import { createQueryBuilder } from '@/utils/kysely';

export type AuthService = ReturnType<typeof createAuth>;

export const createAuth = (config: {
  pgSchema: string;
  jwt: JWTOptions;
  /**
   * Postgres database pool or existing pool
   */
  db: Pool | PoolConfig;
  oauth: OAuthConfig;
}) => {
  let pgPool: Pool;

  let cleanupDB = async () => {
    // noop
  };

  if ('query' in config.db) {
    pgPool = config.db;
  } else {
    pgPool = new Pool({
      max: 5,
      ...config.db,
    });
    cleanupDB = async () => {
      await pgPool.end();
    };
  }

  const jwtFactory = createJWTFactory(config.jwt);

  const qb = createQueryBuilder<DB>(pgPool, config.pgSchema);

  const otp = createOTP({
    jwtFactory: jwtFactory,
    pool: pgPool,
    qb: qb,
  });

  const oauth = createOAuth(
    {
      jwtFactory: jwtFactory,
      pool: pgPool,
      qb: qb,
    },
    config.oauth
  );

  const account = createAccount({ pool: pgPool, qb: qb });

  async function refresh(refresh_token: string) {
    const refreshToken = jwtFactory.getRefreshToken(refresh_token);

    if (!refreshToken) {
      throw createHttpError.Unauthorized('invalid-token');
    }

    // check if allowed to refresh
    const account = await qb
      .selectFrom('accounts')
      .select(['id', 'token_version'])
      .where('id', '=', refreshToken.account_id)
      .where('token_version', '=', refreshToken.token_version)
      .executeTakeFirst();

    // check if refresh token is same as in token
    if (!account) {
      throw createHttpError.Forbidden('invalid-token');
    }

    const token = {
      sub: account.id,
      account_id: account.id,
      token_version: account.token_version,
    };

    const newRefreshToken = jwtFactory.createRefreshToken(token);

    return {
      refresh_token: token,
      jwt_refresh_token: jwtFactory.signRefreshToken(newRefreshToken),
    };
  }

  async function getUserId(refresh_token: string): Promise<string | null> {
    const refreshToken = jwtFactory.getRefreshToken(refresh_token);

    if (!refreshToken) {
      throw createHttpError.Unauthorized();
    }

    const { account_id, token_version } = refreshToken;

    if (!account_id) {
      throw createHttpError.Unauthorized();
    }

    const user = await qb
      .selectFrom('accounts')
      .select('id')
      .where('id', '=', account_id)
      // check if token version is changed
      .where('token_version', '=', token_version)
      .executeTakeFirst();

    return user?.id ?? null;
  }

  return {
    otp,
    oauth,
    account,
    jwtFactory,
    refresh,
    getUserId,
    async stop() {
      await cleanupDB();
    },
  };
};
