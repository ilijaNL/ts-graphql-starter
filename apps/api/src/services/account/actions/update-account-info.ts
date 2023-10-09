import { createAsyncAction } from '@/utils/actions';
import { Type } from '@sinclair/typebox';
import { AuthQueryBuilder } from '../../auth/db';

export const createUpdateAccountInfo = () =>
  createAsyncAction({
    schema: Type.Partial(
      Type.Object({
        imagePath: Type.Optional(Type.String()),
        displayName: Type.String({ minLength: 3, maxLength: 48 }),
        locale: Type.Union([Type.Literal('en')]),
      })
    ),
    async handler(input, state: { accountId: string }, { save: addCommand }) {
      // TODO: add task which deletes the old image

      addCommand(
        AuthQueryBuilder.insertInto('account_info')
          .values({
            account_id: state.accountId,
            locale: input.locale,
            avatar_url: input.imagePath,
            display_name: input.displayName,
          })
          .onConflict((oc) =>
            oc.column('account_id').doUpdateSet({
              locale: input.locale,
              avatar_url: input?.imagePath,
              display_name: input.displayName,
            })
          )
          .compile()
      );
    },
  });
