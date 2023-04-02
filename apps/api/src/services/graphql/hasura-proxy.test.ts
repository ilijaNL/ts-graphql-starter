import tap from 'tap';
import { createHasuraProxy } from './hasura-proxy';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import { createValidateFn } from '../../utils/schema';
import { Type } from '@sinclair/typebox';
import { MockAgent } from 'undici';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { addMocksToSchema } from '@graphql-tools/mock';
import { graphql, parse, print } from 'graphql';

const queryDoc = { __meta__: { hash: 'hash1' } } as unknown as DocumentNode<{ me: number }, { var1: string }>;

const schema = makeExecutableSchema({
  typeDefs: `
    type Query {
      test: String!
    }

    type Mutation {
      create: String!
    }
`,
});

const schemaWithMocks = addMocksToSchema({ schema });

tap.test('happy', async (t) => {
  const proxy = createHasuraProxy(new URL('http://localhost:3001/dummy'), {}, {});
  const errors = await proxy.validate();

  t.teardown(() => proxy.close());
  t.same(errors, []);
});

tap.test('return errors when not all operations are implemented', async (t) => {
  const agent = new MockAgent();
  agent.disableNetConnect();

  const client = agent.get('http://localhost:3001');

  client
    .intercept({
      path: '/v1/graphql',
      method: 'POST',
    })
    .reply(200, ({ body }) => {
      return graphql({
        schema: schemaWithMocks,
        source: JSON.parse(body as any).query,
      });
    });

  const proxy = createHasuraProxy(
    new URL('http://localhost:3001/v1/graphql'),
    {
      hash1: 'query test { me }',
    },
    {
      undiciOpts: {
        factory() {
          return client;
        },
      },
    }
  );
  const errors = await proxy.validate();
  t.teardown(() => proxy.close());

  t.equal(errors[0]?.message, 'Cannot query field "me" on type "Query".');
});

tap.test('rejects when not found', async (t) => {
  t.plan(1);

  const proxy = createHasuraProxy(new URL('http://localhost:3001/dummy'), {}, {});
  t.teardown(() => proxy.close());

  t.rejects(proxy.request('does-not-exists', { var1: 'var2' }, { header: 'head1' }));
});

tap.test('calls remote', async (t) => {
  t.plan(4);
  const agent = new MockAgent();
  agent.disableNetConnect();

  const client = agent.get('http://localhost:3001');

  const hashMap = {
    hash1: `query test { test }`,
  };

  client
    .intercept({
      path: '/v1/graphql',
      method: 'POST',
    })
    .reply(200, ({ body, headers }) => {
      const input = JSON.parse(body as any);

      t.equal(input.query, print(parse(hashMap.hash1)));
      t.same(input.variables, { var1: 'var2' });
      t.equal((headers as Record<string, string>)['header'], 'head1');
      return {
        data: {
          me: 123,
        },
      };
    });

  const proxy = createHasuraProxy(new URL('http://localhost:3001/v1/graphql'), hashMap, {
    undiciOpts: {
      factory() {
        return client;
      },
    },
  });

  t.teardown(() => proxy.close());

  const result = await proxy.request('hash1', { var1: 'var2' }, { header: 'head1' });
  // it returns as a buffer
  const response = JSON.parse(String(result.response));
  t.same(response.data, { me: 123 });
});

tap.test('dedupes remote', async (t) => {
  const agent = new MockAgent();
  agent.disableNetConnect();

  const client = agent.get('http://localhost:3001').setMaxListeners(20);

  const hashMap = {
    hash1: 'query test { test }',
  };

  client
    .intercept({
      path: '/v1/graphql',
      method: 'POST',
    })
    .reply(200, () => {
      return Buffer.from(Math.random().toString());
    })
    .times(7);

  const proxy = createHasuraProxy(new URL('http://localhost:3001/v1/graphql'), hashMap, {
    undiciOpts: {
      factory() {
        return client;
      },
    },
  });

  t.teardown(() => proxy.close());
  // test that it dedupes remote request
  {
    const r1 = proxy.request('hash1', { var1: 'var2' }, { header: 'head1', 'x-hasura-h': 'a' });
    const r2 = proxy.request('hash1', { var1: 'var2' }, { header: 'head1', 'x-hasura-h': 'a' });

    const [res1, res2] = await Promise.all([r1, r2]);
    t.equal(res1, res2);
  }

  // test that it does not dedupe remote request when different auth header
  {
    const r1 = proxy.request('hash1', { var1: 'var2' }, { authorization: 'auth1' });
    const r2 = proxy.request('hash1', { var1: 'var2' }, { authorization: 'auth2' });

    const [res1, res2] = await Promise.all([r1, r2]);
    t.not(res1, res2);
  }

  // when variables are diff
  {
    const r1 = proxy.request('hash1', { var1: 'var1' }, { authorization: 'a' });
    const r2 = proxy.request('hash1', { var1: 'var2' }, { authorization: 'a' });

    const [res1, res2] = await Promise.all([r1, r2]);
    t.not(res1, res2);
  }

  // when hasura vars are diff
  {
    const r1 = proxy.request('hash1', { var1: 'var1' }, { authorization: 'a', 'x-hasura-h': 'a' });
    const r2 = proxy.request('hash1', { var1: 'var2' }, { authorization: 'a', 'x-hasura-h': 'b' });

    const [res1, res2] = await Promise.all([r1, r2]);
    t.not(res1, res2);
  }
});

tap.test('correctly handles directives', async (t) => {
  const agent = new MockAgent();
  agent.disableNetConnect();

  const hashMap = {
    hash1: `query test @pcached(ttl: 1) { test }`,
    hash2: `query abc @cached(ttl: 1) { test }`,
    hash3: `query d { awaw }`,
  };

  const queries: string[] = [];

  const client = agent.get('http://localhost:3001');
  client
    .intercept({
      path: '/v1/graphql',
      method: 'POST',
    })
    .reply(200, ({ body }) => {
      const { query } = JSON.parse(body as string);
      queries.push(query);
      return Buffer.from(Math.random().toString());
    })
    .times(3);

  const proxy = createHasuraProxy(new URL('http://localhost:3001/v1/graphql'), hashMap, {
    undiciOpts: {
      factory() {
        return client;
      },
    },
  });

  await proxy.request('hash1');
  await proxy.request('hash2');
  await proxy.request('hash3');

  t.same(queries, [print(parse('query test { test }')), print(parse(hashMap.hash2)), print(parse(hashMap.hash3))]);
});

tap.test('caches remote', async (t) => {
  const agent = new MockAgent();
  agent.disableNetConnect();

  const hashMap = {
    hash1: `query test @pcached(ttl: 1) { test }`,
  };

  const client = agent.get('http://localhost:3001');
  client
    .intercept({
      path: '/v1/graphql',
      method: 'POST',
    })
    .reply(200, ({ body }) => {
      const { query } = JSON.parse(body as string);
      t.equal(query, print(parse('query test { test }')));
      return Buffer.from(Math.random().toString());
    })
    .times(2);

  const proxy = createHasuraProxy(new URL('http://localhost:3001/v1/graphql'), hashMap, {
    undiciOpts: {
      factory() {
        return client;
      },
    },
  });

  t.teardown(() => proxy.close());

  // test that it caches remote requests with correct ttl
  {
    const r1 = await proxy.request('hash1', { var1: 'var2' }, { header: 'head1', 'x-hasura-h': 'a' });
    await new Promise((resolve) => setTimeout(resolve, 30));
    const r2 = await proxy.request('hash1', { var1: 'var2' }, { header: 'head1', 'x-hasura-h': 'a' });

    t.equal(r1, r2);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const r3 = await proxy.request('hash1', { var1: 'var2' }, { header: 'head1', 'x-hasura-h': 'a' });
    t.not(r2, r3);
  }
});

tap.test('custom override', async (t) => {
  t.plan(3);
  const proxy = createHasuraProxy(
    new URL('http://localhost:3001/dummy'),
    {
      hash1: 'query test { me }',
    },
    {}
  );

  t.teardown(() => proxy.close());

  proxy.addOverride(queryDoc, async (input, headers) => {
    t.equal(input.var1, 'var2');
    t.equal(headers.header, 'head1');
    return {
      me: 123,
    };
  });

  const result = await proxy.request('hash1', { var1: 'var2' }, { header: 'head1' });
  t.same(result.response.data, { me: 123 });
});

tap.test('dedupes', async (t) => {
  const proxy = createHasuraProxy(new URL('http://localhost:3001/dummy'), {
    hash1: 'query test { me }',
  });

  t.teardown(() => proxy.close());

  proxy.addOverride(queryDoc, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      me: Math.random(),
    };
  });

  const p1 = proxy.request('hash1', { var1: 'var2' }, {});
  const p2 = proxy.request('hash1', { var1: 'var2' }, {});
  const [res1, res2] = await Promise.all([p1, p2]);
  t.equal(res1, res2);
});

tap.test('does not dedupes mutation', async (t) => {
  const proxy = createHasuraProxy(new URL('http://localhost:3001/dummy'), {
    hash1: 'mutation test { me }',
  });

  t.teardown(() => proxy.close());

  proxy.addOverride(queryDoc, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      me: Math.random(),
    };
  });

  const p1 = proxy.request('hash1', { var1: 'var2' }, {});
  const p2 = proxy.request('hash1', { var1: 'var2' }, {});
  const [res1, res2] = await Promise.all([p1, p2]);
  t.not(res1, res2);
});

tap.test('cache with override', async (t) => {
  const proxy = createHasuraProxy(
    new URL('http://localhost:3001/dummy'),
    {
      hash1: 'query test { me }',
    },
    {
      cacheTTL: 1,
    }
  );

  t.teardown(() => proxy.close());

  proxy.addOverride(queryDoc, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      me: Math.random(),
    };
  });

  const p1 = await proxy.request('hash1', { var1: 'var2' }, {});
  const p2 = await proxy.request('hash1', { var1: 'var2' }, {});
  t.equal(p1, p2);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const p3 = await proxy.request('hash1', { var1: 'var2' }, {});
  t.not(p2, p3);
});

tap.test('reset cache with override', async (t) => {
  const proxy = createHasuraProxy(
    new URL('http://localhost:3001/dummy'),
    {
      hash1: 'query test { me }',
    },
    {
      cacheTTL: 2,
    }
  );

  t.teardown(() => proxy.close());

  proxy.addOverride(queryDoc, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      me: Math.random(),
    };
  });

  const input = { var1: 'var2' };

  const p1 = await proxy.request('hash1', input, {});
  proxy.addOverride(queryDoc, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      me: 123,
    };
  });
  await new Promise((resolve) => setTimeout(resolve, 10));
  const p2 = await proxy.request('hash1', input, {});
  t.not(p1, p2);
});

tap.test('validates', async (t) => {
  t.plan(4);
  const proxy = createHasuraProxy(new URL('http://localhost:3001/dummy'), {
    hash1: 'query test { me }',
  });

  t.teardown(() => proxy.close());

  proxy.addOverride(queryDoc, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      me: 222,
    };
  });

  const validateFn = createValidateFn(Type.Object({ var1: Type.String({ minLength: 3 }) }));

  proxy.addValidation(queryDoc, async (input) => {
    t.pass('called');
    const isValid = validateFn(input);
    if (isValid) {
      return;
    }
    return {
      type: 'validation',
      message: 'notvalid',
    };
  });

  const p2 = await proxy.request('hash1', { var1: 'abcd' }, {});
  t.equal(p2.response.data.me, 222);

  t.rejects(proxy.request('hash1', { var1: 'a' }, {}));
});
