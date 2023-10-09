import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { isValidPath } from '@/utils/s3';
import { createFastifyExecute } from '@/utils/actions';
import { account } from '@ts-hasura-starter/api';
import { registerRoutes } from '@/utils/typed-client';

const Ok = {
  ok: true,
} as const;

export const accountRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  const executor = createFastifyExecute(fastify);
  const { httpErrors } = fastify;

  fastify.addHook('onRequest', fastify.authenticate);

  void registerRoutes(account.contract, {
    update_account_info: (config) => {
      fastify.route({
        ...config,
        async handler(req) {
          const { body: input } = req;
          const image = input.image;

          if (image && !isValidPath(image)) {
            throw httpErrors.badRequest('not valid image signature');
          }

          await executor(fastify.accountService.updateAccountInfo)(
            {
              displayName: input.displayName,
              imagePath: image?.path,
              locale: input.locale,
            },
            { accountId: req.user.acc_id }
          );

          return Ok;
        },
      });
    },
    get_avatar_upload_link: (config) => {
      fastify.route({
        ...config,
        async handler(req) {
          const { body: input } = req;
          return await executor(fastify.accountService.getAvatarUploadLink)(
            {
              contentType: input.contentType,
              extension: input.extension,
            },
            { accountId: req.user.acc_id }
          );
        },
      });
    },
    delete: (config) => {
      fastify.route({
        ...config,
        async handler(req) {
          await executor(fastify.accountService.deleteAccount)(null, { accountId: req.user.acc_id });
          return Ok;
        },
      });
    },
  });
};
