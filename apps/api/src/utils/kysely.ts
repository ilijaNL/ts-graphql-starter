import pgp from 'pg-promise';
import { CompiledQuery } from 'kysely';
import { PGClient } from './sql';

/* Only used for the helpers */
const pgpInstance = pgp({});

export function combine(queries: (CompiledQuery | CompiledQuery[])[]): string {
  return pgpInstance.helpers.concat(queries.flat().map((q) => ({ query: q.sql, values: q.parameters })));
}

export async function combineAndExecute(client: PGClient, ...queries: CompiledQuery[]): Promise<void> {
  const queryText = combine(queries);
  await client.query({ text: queryText, values: [] });
}

export class QueryBatch {
  private readonly _queries: CompiledQuery[] = [];
  public add(...queries: CompiledQuery[]) {
    this._queries.push(...queries);
  }

  /**
   * Flushes the batcher
   */
  public async flush(client: PGClient) {
    if (this._queries.length === 0) {
      return;
    }
    const queryText = combine(this._queries);
    this._queries.length = 0;
    await client.query({ text: queryText, values: [] });
  }
}
