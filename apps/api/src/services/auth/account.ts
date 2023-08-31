import { createProcedures } from '@/utils/rpc';
import { DB } from './__generated__/auth-db';
import { Pool } from 'pg';
import { QueryCreator } from 'kysely';
import { FastifyInstance } from 'fastify';
import { account } from '@ts-hasura-starter/api';
import { randomUUID } from 'node:crypto';
import { generateSignedUrl, isValidPath } from '@/utils/s3';
import { AuthService } from './lib';

type Context = {
  fastify: FastifyInstance;
  pool: Pool;
  builder: QueryCreator<DB>;
  authService: AuthService;
  // requires to be authenticated
  account_id: string;
};

const getAvatarImagePath = (account_id: string) => `accounts/${account_id}/avatar`;

export const accountProcedures = createProcedures(account.contract)<Context>({
  async update_account_info(input, ctx) {
    const image = input.image;

    if (image && !isValidPath(image)) {
      throw ctx.fastify.httpErrors.badRequest('not valid image signature');

      // TODO: add task which deletes the old image
    }

    await ctx.authService.account.setAccountInfo(ctx.account_id, {
      locale: input.locale,
      avatar_url: image?.path,
      displayName: input.displayName,
    });

    return {
      ok: true,
    };
  },
  async get_avatar_upload_link(input, ctx) {
    const basePath = getAvatarImagePath(ctx.account_id);
    const filename = `${randomUUID()}.${input.extension}`;

    const data = await generateSignedUrl({
      basePath: basePath,
      fileName: filename,
      contentType: input.contentType,
      isPublic: true,
    });

    return {
      path_sig: data.path_sig,
      relative_path: data.path,
      resource_id: ctx.account_id,
      signed_data: data.signed_data,
    };
  },
  async delete(_, ctx) {
    await ctx.authService.account.deleteAccount(ctx.account_id);
    return {
      ok: true,
    };
  },
});
