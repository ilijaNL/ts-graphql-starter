import { createAsyncAction } from '@/utils/actions';
import { Type } from '@sinclair/typebox';
import { AuthQueryBuilder } from '../db';

export const createDeleteAccount = () =>
  createAsyncAction({
    schema: Type.Null(),
    async handler(_, state: { accountId: string }, props) {
      props.save(
        AuthQueryBuilder
          //
          .deleteFrom('accounts')
          .where('id', '=', state.accountId)
          .compile()
      );
    },
  });
