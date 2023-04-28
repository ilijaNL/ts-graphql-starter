import type { CodegenConfig } from '@graphql-codegen/cli';
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
      plugins: ['graphql-operation-list'],
    },
  },
};
export default config;
