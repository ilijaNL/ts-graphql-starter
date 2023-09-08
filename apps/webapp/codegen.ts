import type { CodegenConfig } from '@graphql-codegen/cli';
import createListFn from 'graphql-codegen-on-operations/lib/use/listing';
import { GenerateFn } from 'graphql-codegen-on-operations';
import { createCollector, OperationDefinition } from 'graphql-hive-edge-client';

const ROLES = [
  {
    role: 'user',
    extension: 'user',
  },
  {
    role: 'anonymous',
    extension: 'anonymous',
  },
];

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

const url = 'http://127.0.0.1:8082/v1/graphql';
const adminSecret = 'admin12345';

const ignorePatterns = ['!src/__generated__/**'];

const roleConfiguration: CodegenConfig['generates'] = ROLES.reduce((agg, role) => {
  const output = `./src/__generated__/${role.extension}.ts`;
  return {
    ...agg,
    [output]: {
      documents: [`src/**/*.common.graphql`, `src/**/*.${role.extension}.graphql`, ...ignorePatterns],
      schema: [
        {
          [url]: {
            headers: {
              'x-hasura-admin-secret': adminSecret,
              'x-hasura-role': role.role,
            },
          },
        },
      ],

      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: { documentMode: 'string', ...sharedConfig },
    },
  };
}, {} as CodegenConfig['generates']);

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

const baseGen = {
  documents: ['src/**/*.graphql'],
  schema: [
    {
      [url]: {
        headers: {
          'x-hasura-admin-secret': adminSecret,
          'x-hasura-role': 'admin',
        },
      },
    },
  ],
};

const config: CodegenConfig = {
  ignoreNoDocuments: true,
  generates: {
    ...roleConfiguration,
    './src/__generated__/operations.json': {
      ...baseGen,
      plugins: ['graphql-codegen-on-operations'],
      config: {
        gen: createListFn(),
      },
    },
    './src/__generated__/hive-ops.json': {
      ...baseGen,
      plugins: ['graphql-codegen-on-operations'],
      config: {
        gen: hiveOpsGen,
      },
    },
  },
};
export default config;
