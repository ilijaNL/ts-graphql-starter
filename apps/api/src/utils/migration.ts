import crypto from 'crypto';
import { query, withTransaction, unsafeSQL } from './sql';
import { Pool } from 'pg';

const baseMigration = (props: { schema: string; migrationTable: string }) =>
  `
  CREATE SCHEMA IF NOT EXISTS ${props.schema};

  CREATE TABLE IF NOT EXISTS ${props.schema}."${props.migrationTable}" (
    id integer PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL,
    -- sha1 hex encoded hash of the file name and contents, to ensure it hasn't been altered since applying the migration
    hash varchar(40) NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
  );
`;

const hashString = (s: string) => crypto.createHash('sha1').update(s, 'utf8').digest('hex');

type Migration = {
  id: number;
  name: string;
  hash: string;
  sql: string;
};

const loadMigrations = (
  props: {
    schema: string;
    migrationTable: string;
  },
  items: string[]
): Array<Migration> => {
  return [baseMigration(props), ...items].map((sql, idx) => ({
    hash: hashString(sql),
    id: idx,
    name: `${idx}_m`,
    sql: sql,
  }));
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
    const invalidIdx = invalidHashes.map(({ id }) => id.toString());
    throw new Error(`Hashes don't match for migrations id's '${invalidIdx.join(',')}'.
This means that the migrations items have changed since it was applied. You only allow to append new migrations`);
  }
}

export const createMigrationPlans = (props: { schema: string; migrationTable: string }) => {
  function getMigrations() {
    return unsafeSQL<{ id: number; name: string; hash: string }>`
      SELECT * FROM ${props.schema}.${props.migrationTable} ORDER BY id
    `;
  }

  function insertMigration(migration: { id: number; hash: string; name: string }) {
    return unsafeSQL`
      INSERT INTO 
        ${props.schema}.${props.migrationTable} (id, name, hash) 
      VALUES (${migration.id}, '${migration.name}', '${migration.hash}')
    `;
  }

  function tableExists(table: string) {
    return unsafeSQL<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = '${props.schema}'
        AND    table_name   = '${table}'
      );  
    `;
  }

  return {
    tableExists,
    getMigrations,
    insertMigration,
  };
};

export async function migrate(props: { pool: Pool; schema: string; migrations: string[]; migrationTable: string }) {
  const _props = { migrationTable: props.migrationTable, schema: props.schema };
  const allMigrations = loadMigrations(_props, props.migrations);
  let toApply = [...allMigrations];
  // check if table exists
  const plans = createMigrationPlans(_props);

  await withTransaction(props.pool, async (client) => {
    // acquire lock
    await client.query(`
      SELECT pg_advisory_xact_lock( ('x' || md5(current_database() || '.tb.${props.schema}'))::bit(64)::bigint )
    `);

    const rows = await query(client, plans.tableExists(props.migrationTable));
    const migTableExists = rows[0]?.exists;

    // fetch latest migration
    if (migTableExists) {
      const appliedMigrations = await query(client, plans.getMigrations());
      validateMigrationHashes(allMigrations, appliedMigrations);
      toApply = filterMigrations(allMigrations, new Set(appliedMigrations.map((m) => m.id)));
    }

    for (const migration of toApply) {
      await client.query(migration.sql);
      await query(client, plans.insertMigration(migration));
    }
  });
}
