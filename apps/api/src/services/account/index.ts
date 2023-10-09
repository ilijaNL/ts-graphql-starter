import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { AccountService, createAccountService } from './actions';
import fp from 'fastify-plugin';
import { accountRoutes } from './routes';

declare module 'fastify' {
  interface FastifyInstance {
    accountService: AccountService;
  }
}

const _accountPlugin: FastifyPluginAsyncTypebox<{ schema?: string; prefix: string }> = async (fastify, opts) => {
  const accountService = createAccountService(/* fastify */);

  fastify.decorate('accountService', accountService);

  void fastify.register(
    async (fastify) => {
      void fastify.register(accountRoutes, {
        prefix: '/me',
      });
    },
    {
      prefix: opts.prefix,
    }
  );
};

export const accountPlugin = fp(_accountPlugin);
