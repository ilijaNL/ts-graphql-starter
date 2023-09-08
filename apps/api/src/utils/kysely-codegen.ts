import ENVS from '@/env';
import { Logger, LogLevel, Generator, DialectManager } from 'kysely-codegen';

export type CliOptions = {
  camelCase: boolean;
  excludePattern: string | undefined;
  includePattern: string | undefined;
  logLevel: LogLevel;
  outFile: string;
  schema: string | undefined;
  typeOnlyImports: boolean;
};

export async function kyselyCodegenForSchema(connectionString: string, schema: string, filePath: string) {
  if (ENVS.NODE_ENV !== 'development') {
    return;
  }

  await kyselyCodegen(connectionString, {
    includePattern: `(${schema}).*`,
    camelCase: false,
    typeOnlyImports: true,
    logLevel: LogLevel.DEBUG,
    excludePattern: undefined,
    schema: schema,
    outFile: filePath,
  });
}

export async function kyselyCodegen(connectionString: string, options: CliOptions) {
  const camelCase = !!options.camelCase;
  const outFile = options.outFile;
  const excludePattern = options.excludePattern;
  const includePattern = options.includePattern;
  const schema = options.schema;
  const typeOnlyImports = options.typeOnlyImports;

  const logger = new Logger(options.logLevel);
  const inferredDialectName = 'postgres';

  const dialectManager = new DialectManager();
  const dialect = dialectManager.getDialect(inferredDialectName);

  const db = await dialect.introspector.connect({
    connectionString,
    dialect,
  });

  const generator = new Generator();

  await generator.generate({
    camelCase,
    db,
    dialect,
    excludePattern,
    includePattern,
    logger,
    outFile,
    schema,
    typeOnlyImports,
  });
}
