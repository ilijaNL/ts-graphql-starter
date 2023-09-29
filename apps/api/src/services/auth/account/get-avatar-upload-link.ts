import { createAsyncAction } from '@/utils/actions';
import { ImageExtension, ImageContentType } from '@ts-hasura-starter/api';
import { randomUUID } from 'node:crypto';
import { Type } from '@sinclair/typebox';
import { GenerateSignedUrlFn } from '@/utils/s3';

const getAvatarImagePath = (account_id: string) => `accounts/${account_id}/avatar`;

export const createGetAvatarUploadLink = (deps: { generateSignedUrl: GenerateSignedUrlFn }) =>
  createAsyncAction({
    schema: Type.Object({
      extension: ImageExtension,
      contentType: ImageContentType,
    }),
    async handler(input, ctx: { accountId: string }) {
      const basePath = getAvatarImagePath(ctx.accountId);
      const filename = `${randomUUID()}.${input.extension}`;

      const data = await deps.generateSignedUrl({
        basePath: basePath,
        fileName: filename,
        contentType: input.contentType,
        isPublic: true,
      });

      return {
        path_sig: data.path_sig,
        relative_path: data.path,
        resource_id: ctx.accountId,
        signed_data: data.signed_data,
      };
    },
  });
