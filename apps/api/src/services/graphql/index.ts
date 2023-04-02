import { Type } from '@sinclair/typebox';
import { createHasuraProxy } from './hasura-proxy';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { HealthDocument, operations } from '@my-app/operations';
import G_ENV from './env';

const graphqlProxyService: FastifyPluginAsyncTypebox = async (fastify) => {
  const hasuraURL = new URL('/v1/graphql', G_ENV.HASURA_ORIGIN);
  const hasuraProxy = createHasuraProxy(hasuraURL, operations, { cacheTTL: 0 });

  fastify.addHook('onClose', () => hasuraProxy.close());

  hasuraProxy.addOverride(HealthDocument, async () => {
    return {
      __health: true,
    };
  });

  const errors = await hasuraProxy.validate();
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join(', '));
  }

  fastify.post(
    '/',
    {
      schema: {
        body: Type.Object({
          hash: Type.String(),
          variables: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
        }),
      },
    },
    async (req, reply) => {
      const { hash, variables } = req.body;
      const { response: data, headers: resultHeaders } = await hasuraProxy.request(hash, variables, { ...req.headers });

      return reply.headers(resultHeaders).send(data);
    }
  );

  fastify.get(
    '/',
    {
      schema: {
        querystring: Type.Object({
          hash: Type.String(),
          variables: Type.Optional(Type.String()),
        }),
      },
    },
    async (req, reply) => {
      const { response: data, headers: resultHeaders } = await hasuraProxy.request(
        req.query.hash,
        req.query.variables ? JSON.parse(req.query.variables) : undefined,
        { ...req.headers }
      );

      return reply.headers(resultHeaders).send(data);
    }
  );
};

export default graphqlProxyService;
