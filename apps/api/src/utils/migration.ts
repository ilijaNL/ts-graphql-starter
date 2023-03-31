import { readFile, readdir } from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import { createSql, PGClient, query, withTransaction } from './sql';

const isValidFile = (fileName: string) => /\.(sql)$/gi.test(fileName);

const getFileName = (filePath: string) => path.basename(filePath);

const hashString = (s: string) => crypto.createHash('sha1').update(s, 'utf8').digest('hex');

const parseId = (id: string) => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    throw new Error(`Migration file name should begin with an integer ID.'`);
  }

  return parsed;
};

export interface FileInfo {
  id: number;
  name: string;
}

const parseFileName = (fileName: string): FileInfo => {
  const result = /^(-?\d+)[-_]?(.*).(sql)$/gi.exec(fileName);

  if (!result) {
    throw new Error(`Invalid file name: '${fileName}'.`);
  }

  const [, id, name] = result;

  return {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    id: parseId(id!),
    name: name == null || name === '' ? fileName : name,
  };
};

type Migration = {
  id: number;
  name: string;
  contents: string;
  fileName: string;
  hash: string;
  sql: string;
};

const loadMigrationFile = async (filePath: string, schema: string) => {
  const fileName = getFileName(filePath);

  try {
    const { id, name } = parseFileName(fileName);
    const contents = await readFile(filePath, { encoding: 'utf8' });

    const sql = contents.replace(new RegExp('{{schema}}', 'g'), schema);
    const hash = hashString(fileName + sql);

    return {
      id,
      name,
      contents,
      fileName,
      hash,
      sql,
    };
  } catch (err: any) {
    throw new Error(`${err.message} - Offending file: '${fileName}'.`);
  }
};

const loadMigrationFiles = async (directory: string, schema: string) => {
  const fileNames = await readdir(directory);

  if (fileNames == null) {
    return [];
  }

  const migrationFiles = fileNames.map((fileName) => path.resolve(directory, fileName)).filter(isValidFile);

  const unorderedMigrations = await Promise.all(migrationFiles.map((path) => loadMigrationFile(path, schema)));

  // Arrange in ID order
  const orderedMigrations = unorderedMigrations.sort((a, b) => a.id - b.id);

  return orderedMigrations;
};

function filterMigrations(migrations: Array<Migration>, appliedMigrations: Set<number>) {
  const notAppliedMigration = (migration: Migration) => !appliedMigrations.has(migration.id);

  return migrations.filter(notAppliedMigration);
}

function validateMigrationHashes(
  migrations: Array<Migration>,
  appliedMigrations: Array<{
    id: number;
    name: string;
    hash: string;
  }>
) {
  const invalidHash = (migration: Migration) => {
    const appliedMigration = appliedMigrations.find((m) => m.id === migration.id);
    return !!appliedMigration && appliedMigration.hash !== migration.hash;
  };

  // Assert migration hashes are still same
  const invalidHashes = migrations.filter(invalidHash);
  if (invalidHashes.length > 0) {
    // Someone has altered one or more migrations which has already run - gasp!
    const invalidFiles = invalidHashes.map(({ fileName }) => fileName);
    throw new Error(`Hashes don't match for migrations '${invalidFiles}'.
This means that the scripts have changed since it was applied.`);
  }
}

export type QueryCommand<Result> = {
  text: string;
  values: unknown[];
  frags: ReadonlyArray<string>;
  // used to keep the type definition and is always undefined
  __result?: Result;
};

export const createMigrationPlans = (schema: string) => {
  const sql = createSql([{ re: new RegExp('{{schema}}', 'g'), value: schema }]);

  function getMigrations() {
    return sql<{ id: number; name: string; hash: string }>`
      SELECT * FROM {{schema}}.migrations ORDER BY id
    `;
  }

  function insertMigration(migration: { id: number; hash: string; name: string }) {
    return sql`
      INSERT INTO 
        {{schema}}.migrations (id, name, hash) 
      VALUES (${migration.id}, ${migration.name}, ${migration.hash})
    `;
  }

  function tableExists(table: string) {
    return sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = '{{schema}}'
        AND    table_name   = ${table}
      );  
    `;
  }

  return {
    tableExists,
    getMigrations,
    insertMigration,
  };
};

export async function migrate(pool: Pool, props: { schema: string; directory: string }) {
  const allMigrations = await loadMigrationFiles(props.directory, props.schema);
  // check if table exists
  const plans = createMigrationPlans(props.schema);
  let done = false;

  async function migrationTableExists(client: PGClient) {
    const rows = await query(client, plans.tableExists('migrations'));
    return !!rows[0]?.exists;
  }

  let migTableExists = await migrationTableExists(pool);

  while (done === false) {
    done = await withTransaction(pool, async (client) => {
      // acquire lock
      await client.query(`
        SELECT pg_advisory_xact_lock( ('x' || md5(current_database() || '.migrate.${props.schema}'))::bit(64)::bigint )
      `);

      let toApply = [...allMigrations];

      // need to recheck if exists, otherwise might be created from other process in meantime
      if (!migTableExists) {
        migTableExists = await migrationTableExists(client);
      }

      // fetch latest migration
      if (migTableExists) {
        const appliedMigrations = await query(client, plans.getMigrations());
        validateMigrationHashes(allMigrations, appliedMigrations);
        toApply = filterMigrations(allMigrations, new Set(appliedMigrations.map((m) => m.id)));
      }

      // get first migration
      const migration = toApply.shift();

      // nothing to do
      if (!migration) {
        return true;
      }

      await client.query(migration.sql);
      await query(client, plans.insertMigration(migration));

      // if items left, continue the for while loop
      return toApply.length === 0;
    });
  }
}
