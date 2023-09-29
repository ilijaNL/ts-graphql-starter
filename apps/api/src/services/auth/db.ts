import { createPureQueryBuilder, createQueryBuilder } from '@/utils/kysely';
import { DB } from './__generated__/auth-db';
import { Pool } from 'pg';
import { QueryCreator } from 'kysely';

const authSchema = 'auth';

export const createAuthQB = (schema = authSchema) => createPureQueryBuilder<DB>(schema);
export const createAuthDBClient = (pool: Pool, schema = authSchema) => createQueryBuilder<DB>(pool, schema);

export const AuthQueryBuilder = createAuthQB();

export type AuthDBClient = QueryCreator<DB>;
