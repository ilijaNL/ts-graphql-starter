import { createAsyncAction } from '@/utils/actions';
import { Type } from '@sinclair/typebox';
import { AuthQueryBuilder } from '../../auth/db';

export const createCreateAccount = () =>
  createAsyncAction({
    schema: Type.Null(),
    async handler(_, state: { accountId: string }, props) {
      props.save(
        AuthQueryBuilder.insertInto('accounts')
          .values({
            disabled: false,
            version: 1,
            token_version: 1,
            id: state.accountId,
          })
          .compile()
      );
    },
  });
