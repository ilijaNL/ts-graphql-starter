import { CustomTypesConfig, Pool, PoolClient } from 'pg';

export interface QueryResultRow {
  [column: string]: any;
}

export type PGClient = {
  query: <T = any>(props: {
    text: string;
    values: any[];
    name?: string;
    types?: CustomTypesConfig;
  }) => Promise<{
    rows: T[];
    rowCount: number;
  }>;
};

export type QueryCommand<Result> = {
  text: string;
  values: unknown[];
  // used to keep the type definition and is always undefined
  __result?: Result;
};

export function unsafeSQL<Result extends QueryResultRow>(
  sqlFragments: ReadonlyArray<string>,
  ...parameters: unknown[]
): QueryCommand<Result> {
  const reduced: string = sqlFragments.reduce((prev, curr, i) => prev + parameters[i - 1] + curr);

  return {
    text: reduced,
    values: [],
  };
}

export function createSql(replacers: Array<{ re: RegExp; value: string }>) {
  const cache = new WeakMap<ReadonlyArray<string>, string>();
  return function sql<Result extends QueryResultRow>(
    sqlFragments: ReadonlyArray<string>,
    ...parameters: unknown[]
  ): QueryCommand<Result> {
    let text: string;
    if (cache.has(sqlFragments)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      text = cache.get(sqlFragments)!;
    } else {
      const reduced: string = sqlFragments.reduce((prev, curr, i) => prev + '$' + i + curr);
      text = replacers.reduce((agg, curr) => agg.replace(curr.re, curr.value), reduced);
      cache.set(sqlFragments, text);
    }

    const result = {
      text: text,
      values: parameters,
    };

    return result;
  };
}

export async function query<Result extends QueryResultRow>(
  client: PGClient,
  command: QueryCommand<Result>,
  opts?: Partial<{ name: string; types: CustomTypesConfig }>
) {
  return client
    .query<Result>({
      text: command.text,
      values: command.values,
      ...opts,
    })
    .then((d) => d.rows);
}

export async function withTransaction<T>(pool: Pool, handler: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  let result: T;
  try {
    await client.query('BEGIN');
    result = await handler(client);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return result;
}
