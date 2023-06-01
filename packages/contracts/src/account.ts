import { createRPC } from '@ts-hasura-starter/rpc';
import { Type, Static } from '@sinclair/typebox';
import { ImageContentType, ImageExtension, Success, UploadData } from './utils';

const LocaleSchema = Type.Union([Type.Literal('en')]);

export type Locale = Static<typeof LocaleSchema>;

export const contract = createRPC({
  update_account_info: {
    type: 'mutation',
    input: Type.Partial(
      Type.Object({
        image: Type.String({ minLength: 10 }),
        displayName: Type.String({ minLength: 3 }),
        locale: LocaleSchema,
      })
    ),
    output: Success,
  },
  get_avatar_upload_link: {
    type: 'mutation',
    input: Type.Object({
      extension: ImageExtension,
      contentType: ImageContentType,
    }),
    output: UploadData,
  },
  delete: {
    input: Type.Object({}),
    type: 'mutation',
    output: Success,
  },
});
