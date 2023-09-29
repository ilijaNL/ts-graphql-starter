import { createRPC, Type, Static } from '@ts-hasura-starter/rpc';
import { FileUploadData, ImageContentType, ImageExtension, Success, UploadData } from './utils';

export const LocaleSchema = Type.Union([Type.Literal('en')]);

export type Locale = Static<typeof LocaleSchema>;

export const contract = createRPC({
  update_account_info: {
    type: 'mutation',
    input: Type.Partial(
      Type.Object({
        image: FileUploadData,
        displayName: Type.String({ minLength: 3, maxLength: 48 }),
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
