import type { CodegenConfig } from '@graphql-codegen/cli';
import createListFn from 'graphql-codegen-on-operations/lib/use/listing';
import { GenerateFn } from 'graphql-codegen-on-operations';
import { createCollector, OperationDefinition } from 'graphql-hive-edge-client';

const sharedConfig = {
  enumsAsTypes: true,
  skipTypename: true,
  avoidOptionals: {
    field: true,
    inputValue: false,
    object: true,
    defaultValue: false,
  },
  // avoidOptionals: true,
  scalars: {
    uuid: 'string',
    UUID: 'string',
    EmailAddress: 'string',
    JSONObject: 'Record<string, any>',
    bigint: 'number',
    timestamptz: 'string',
    timestampt: 'string',
    time: 'string',
    Date: 'Date',
    json: 'Record<string, any> | Array<any>',
    jsonb: 'Record<string, any> | Array<any>',
  },
};

const hiveOpsGen: GenerateFn = (schema, { documents }) => {
  const collect = createCollector(schema);
  // generate record<operationName, item>
  const result = documents.reduce((agg, curr) => {
    if (curr.operation.name) {
      agg[curr.operation.name] = collect(curr.node, null);
    }

    return agg;
  }, {} as Record<string, OperationDefinition>);

  return JSON.stringify(result, null, 2);
};

const config: CodegenConfig = {
  schema: [
    {
      // hasura api
      ['http://localhost:8082/v1/graphql']: {
        headers: {
          'x-hasura-admin-secret': 'admin12345',
          'x-hasura-role': 'admin',
        },
      },
    },
  ],
  documents: ['src/**/*.{ts,tsx,graphql}'],
  ignoreNoDocuments: true,
  generates: {
    './src/__generated__/': {
      preset: 'client',
      config: {
        ...sharedConfig,
      },
    },
    './src/__generated__/operations.json': {
      plugins: ['graphql-codegen-on-operations'],
      config: {
        gen: createListFn(),
      },
    },
    './src/__generated__/hive-ops.json': {
      plugins: ['graphql-codegen-on-operations'],
      config: {
        gen: hiveOpsGen,
      },
    },
  },
};
export default config;
