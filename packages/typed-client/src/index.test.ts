import tap from 'tap';
import { createClient, defineRoute } from './';
import { Type } from '@sinclair/typebox';

const testRoute = defineRoute({
  path: '/test',
  body: Type.Object({
    url: Type.String({}),
  }),
  method: 'POST',
  responses: {
    error: Type.Object({
      success: Type.Boolean(),
    }),
    success: Type.Object({
      test: Type.String(),
    }),
  },
});

const itemRoute = defineRoute({
  path: '/item/:itemId',
  body: Type.Object({
    url: Type.String({}),
  }),
  method: 'POST',
  responses: {
    error: Type.Object({
      success: Type.Boolean(),
    }),
    success: Type.Object({
      test: Type.String(),
    }),
  },
});

void tap.test('client fetch', async (t) => {
  t.plan(4);
  const finalClient = createClient({
    basePath: '/',
    origin: 'http://google.com',
    fetchFn: async (props) => {
      t.equal(props.path, '/user/id123/pathId123/path/item/itemId123');
      t.same(props.body, {
        url: '123',
      });
      t.same(props.params, {
        id: 'id123',
        itemId: 'itemId123',
        pathId: 'pathId123',
      });

      return {
        status: 200,
        body: {},
        headers: {},
      };
    },
  })
    .addRoute('works', testRoute, {})
    .register('test', '/user/:id', {
      build: (builder) =>
        builder
          //
          .addRoute('works', testRoute)
          .register('nested', '/:pathId/path/', {
            build: (builder) => builder.addRoute('www', itemRoute),
          }),
    })

    .build();

  t.equal(finalClient.test.nested.www.clientPath, '/user/:id/:pathId/path/item/:itemId');

  await finalClient.test.nested.www({
    body: {
      url: '123',
    },
    params: {
      id: 'id123',
      itemId: 'itemId123',
      pathId: 'pathId123',
    },
  });
});

void tap.test('client fetch', async (t) => {
  t.plan(3);
  const rr = defineRoute({
    ...testRoute,
    path: '/test/:tesId',
  });
  const finalClient = createClient({
    origin: 'http://google.com',
    basePath: '/',
    fetchFn: async (props) => {
      t.same(props.query, {
        qId: '123',
      });
      t.equal(props.path, '/user/paramId/test');
      t.same(props.params, {
        id: 'paramId',
      });

      return {
        status: 200,
        body: {},
        headers: {},
      };
    },
  })
    .addRoute('works', rr)
    .register('test', '/user/:id', {
      build: (builder) =>
        builder
          .addRoute(
            'works',
            defineRoute({
              path: '/test',
              method: 'GET',
              responses: {
                success: Type.Boolean(),
              },
              query: Type.Object({
                qId: Type.String(),
              }),
            })
          )
          .register('nested', '/:pathId/path', {
            build: (builder) => builder.addRoute('www', itemRoute),
          }),
    })
    .build();

  await finalClient.test.works({
    params: {
      id: 'paramId',
    },
    query: {
      qId: '123',
    },
  });
});

void tap.test('client override', async (t) => {
  const baseFetchFn = async () => {
    return {
      status: 200,
      body: {},
      headers: {},
    };
  };

  const tsIdRoute = defineRoute({
    ...testRoute,
    path: '/test/:tesId',
  });

  t.plan(6);

  const finalClient = createClient({
    basePath: '/',
    origin: 'http://google.com',
    fetchFn: baseFetchFn,
  })
    .addRoute('works', tsIdRoute, {
      fetchFn(props, parentFetch) {
        t.equal(parentFetch, baseFetchFn);
        t.ok(!!(props.params as any).tesId);
        return parentFetch(props);
      },
    })
    .register('test', '/user/:id', {
      fetchFn: function nesteddd(props, parent) {
        t.ok(true);
        t.equal(parent, baseFetchFn);
        t.equal(props.params.id, '_paramId');
        return parent(props);
      },
      build: (builder) =>
        builder.addRoute('works', testRoute).register('nested', '/:pathId/path', {
          build: (builder) =>
            builder.addRoute('www', itemRoute, {
              async fetchFn(props, parentFetch) {
                t.equal(props.params.itemId, '_itemId');
                return parentFetch(props);
              },
            }),
        }),
    })
    .build();

  await finalClient.test.nested.www({
    params: {
      id: '_paramId',
      itemId: '_itemId',
      pathId: '_pathId',
    },
    body: {
      url: '123',
    },
  });

  await finalClient.works({
    params: {
      tesId: '123',
    },
    body: {
      url: '123',
    },
  });
});
