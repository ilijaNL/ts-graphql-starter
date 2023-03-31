import { CodegenConfig } from '@graphql-codegen/cli';
import { getOperationAST } from 'graphql';

const sharedConfig = {
  skipTypename: true,
  avoidOptionals: {
    field: true,
    inputValue: false,
    object: true,
    defaultValue: false,
  },
  // avoidOptionals: true,
  exposeQueryKeys: true,
  scalars: {
    uuid: 'string',
    UUID: 'string',
    EmailAddress: 'string',
    JSONObject: 'Record<string, any>',
    bigint: 'number',
    timestamptz: 'string',
    time: 'string',
    Date: 'Date',
    // json: 'Record<string, any> | Array<any>',
    // jsonb: 'Record<string, any> | Array<any>',
  },
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
    // additional schema
    './graphql.overrides.graphql',
  ],
  documents: ['src/**/*.graphql'],
  generates: {
    './src/generated/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
        onExecutableDocumentNode: function (document) {
          const ast = getOperationAST(document);
          if (ast?.operation) {
            return {
              op: ast.operation,
            };
          }
        },
        persistedDocuments: {
          mode: 'replaceDocumentWithHash',
        },
      },
      config: {
        documentMode: 'string',
        ...sharedConfig,
      },
    },

    // config: { ...sharedConfig /* documentMode: 'graphQLTag' */ }
  },
};

export default config;
