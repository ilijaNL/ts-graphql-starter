import SchemaBuilder from '@pothos/core';
import { authProcedures } from './service';
import { FastifyInstance } from 'fastify';
import WithInputPlugin from '@pothos/plugin-with-input';
import createHttpError from 'http-errors';
import { GraphQLError } from 'graphql';

export type GraphQLContext = {
  fastify: FastifyInstance;
};

const builder = new SchemaBuilder<{
  Context: GraphQLContext;
}>({
  plugins: [WithInputPlugin],
});

const Claim = builder.inputType('Claim', {
  fields: (t) => ({
    type: t.string({ required: true }),
    role: t.string({
      required: true,
    }),
  }),
});

async function formatError<P>(promise: Promise<P>) {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof createHttpError.HttpError) {
      return Promise.reject(new GraphQLError(e.message, { extensions: { code: e.status } }));
    }
    return Promise.reject(e);
  }
}

builder.queryType({
  fields: (t) => ({
    health: t.boolean({
      resolve: () => true,
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    refresh: t.string({
      args: {
        rt: t.arg({
          type: 'String',
          required: true,
        }),
      },
      resolve: (_, args, context) =>
        formatError(authProcedures['refresh'].execute(args, context).then((d) => d.refreshToken)),
    }),
    accessToken: t.string({
      args: {
        rt: t.arg({
          type: 'String',
          required: true,
        }),
        claims: t.arg({
          type: [Claim],
          required: true,
        }),
      },
      resolve: (_, args, context) =>
        formatError(authProcedures['access-token'].execute(args, context).then((d) => d.access_token)),
    }),
    redeem: t.string({
      args: {
        token: t.arg({
          type: 'String',
          required: true,
        }),
      },
      resolve: (_, args, ctx) =>
        formatError(authProcedures.redeem.execute({ t: args.token }, ctx).then((d) => d.refreshToken)),
    }),
  }),
});

export { builder };
