import { defineRoute, Type, Static } from 'typed-client';
import { FileUploadData, ImageContentType, ImageExtension, Success, UploadData } from './utils';

const LocaleSchema = Type.Union([Type.Literal('en')]);

export type Locale = Static<typeof LocaleSchema>;

export const accountPrefix = '/account';

export const contract = {
  update_account_info: defineRoute({
    path: '/update',
    method: 'POST',
    body: Type.Partial(
      Type.Object({
        image: FileUploadData,
        displayName: Type.String({ minLength: 3, maxLength: 48 }),
        locale: LocaleSchema,
      })
    ),
    responses: {
      success: Success,
    },
  }),
  get_avatar_upload_link: defineRoute({
    path: '/get-avatar-url',
    method: 'POST',
    body: Type.Object({
      extension: ImageExtension,
      contentType: ImageContentType,
    }),
    responses: {
      success: UploadData,
    },
  }),
  delete: defineRoute({
    path: '/delete',
    method: 'DELETE',
    responses: {
      success: Success,
    },
  }),
};
