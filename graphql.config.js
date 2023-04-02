module.exports = {
  schema: [
    {
      'http://localhost:8082/v1/graphql': {
        headers: {
          'x-hasura-admin-secret': 'admin12345',
          'x-hasura-role': 'admin'
        }
      }
    },
    './packages/operations/graphql.overrides.graphql',
  ]
};
