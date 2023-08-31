import pgp from 'pg-promise';
import {
  CompiledQuery,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresDialect,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';
import { PGClient } from './sql';
import { Pool } from 'pg';

/* Only used for the helpers */
const pgpInstance = pgp({});

export interface Query {
  readonly query: string;
  readonly values: ReadonlyArray<unknown>;
}

export function combine(queries: (Query | Query[])[]): string {
  return pgpInstance.helpers.concat(queries.flat());
}

export async function combineAndExecute(client: PGClient, ...queries: Query[]): Promise<void> {
  const queryText = combine(queries);
  await client.query({ text: queryText, values: [] });
}

export async function kQuery<Result>(client: PGClient, query: CompiledQuery<Result>) {
  return client
    .query<Result>({
      text: query.sql,
      values: query.parameters as any[],
    })
    .then((d) => d.rows);
}

export class QueryBatch {
  private readonly _queries: Query[] = [];

  public addCompiled(...queries: CompiledQuery[]) {
    this._queries.push(...queries.map((q) => ({ query: q.sql, values: q.parameters })));
  }

  public add(...queries: Query[]) {
    this._queries.push(...queries);
  }

  /**
   * Flushes the batcher
   */
  public async commit(client: PGClient) {
    if (this._queries.length === 0) {
      return;
    }
    const queryText = combine(this._queries);
    this._queries.length = 0;
    await client.query({ text: queryText, values: [] });
  }
}

export function createPureQueryBuilder<T>(schema?: string) {
  const qb = new Kysely<T>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });

  if (!schema) {
    return qb;
  }

  return qb.withSchema(schema);
}

export function createQueryBuilder<T>(pool: Pool, schema: string) {
  const kysely = new Kysely<T>({
    dialect: new PostgresDialect({
      pool: pool,
    }),
  });
  const queryBuilder = kysely.withSchema(schema);
  return queryBuilder;
}
