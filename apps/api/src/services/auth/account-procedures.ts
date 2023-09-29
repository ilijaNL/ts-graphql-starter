import { createProcedures } from '@/utils/rpc';
import { Pool } from 'pg';
import { account } from '@ts-hasura-starter/api';
import type { AccountService } from './account';
import { execute } from '@/utils/actions';
import { isValidPath } from '@/utils/s3';
import createHttpError from 'http-errors';

type Context = {
  // requires to be authenticated
  account_id: string;
};

const Ok = {
  ok: true,
} as const;

export const createAccountProcedures = (accountService: AccountService, pg: Pool) =>
  createProcedures(account.contract)<Context>({
    async update_account_info(input, ctx) {
      const image = input.image;

      if (image && !isValidPath(image)) {
        throw createHttpError.BadRequest('not valid image signature');
      }

      await execute(pg, accountService.updateAccountInfo)(
        {
          displayName: input.displayName,
          imagePath: image?.path,
          locale: input.locale,
        },
        { accountId: ctx.account_id }
      );
      return Ok;
    },
    async get_avatar_upload_link(input, ctx) {
      return await execute(pg, accountService.getAvatarUploadLink)(
        {
          contentType: input.contentType,
          extension: input.extension,
        },
        { accountId: ctx.account_id }
      );
    },
    async delete(_, ctx) {
      await execute(pg, accountService.deleteAccount)(null, { accountId: ctx.account_id });
      return Ok;
    },
  });
