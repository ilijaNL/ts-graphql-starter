import { createProcedures } from '@/utils/rpc';
import { DB } from './__generated__/auth-db';
import { Pool } from 'pg';
import { QueryCreator } from 'kysely';
import { FastifyInstance } from 'fastify';
import { account } from '@ts-hasura-starter/api';
import { randomUUID } from 'node:crypto';
import { generateSignedUrl } from '@/utils/s3';

type Context = {
  fastify: FastifyInstance;
  pool: Pool;
  builder: QueryCreator<DB>;
  // requires to be authenticated
  account_id: string;
};

export const accountProcedures = createProcedures(account.contract)<Context>({
  async update_account_info(input, ctx) {
    await ctx.builder
      .updateTable('account_info')
      .where('account_id', '=', ctx.account_id)
      .set({
        avatar_url: input.image,
        locale: input.locale,
        display_name: input.displayName,
      })
      .execute();

    return {
      ok: true,
    };
  },
  async get_avatar_upload_link(input, ctx) {
    const basePath = `accounts/${ctx.account_id}/avatar`;
    const filename = `${randomUUID()}.${input.extension}`;

    // TODO: add event which deletes the old image

    const data = generateSignedUrl({
      basePath: basePath,
      fileName: filename,
      contentType: input.contentType,
      isPublic: true,
    });

    return {
      headers: data.headers,
      relative_path: data.path,
      resource_id: ctx.account_id,
      signed_url: data.preSignedUrl,
    };
  },
  async delete(_, ctx) {
    await ctx.builder.deleteFrom('accounts').where('id', '=', ctx.account_id).execute();
    return {
      ok: true,
    };
  },
});
