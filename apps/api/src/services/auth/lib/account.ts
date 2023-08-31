import { Pool } from 'pg';
import { ProviderInput, QueryBuilder, addProviderQuery, createAccountQuery, setAccountInfoQuery } from './common';
import { QueryBatch, kQuery } from '@/utils/kysely';

export type Account = ReturnType<typeof createAccount>;

export type AccountInfo = {
  locale: string;
  avatar_url: string;
  displayName: string;
};

export const createAccount = (props: { qb: QueryBuilder; pool: Pool }) => {
  return {
    async createAccount(account_id: string, provider: ProviderInput, acocount_info?: Partial<AccountInfo>) {
      const batcher = new QueryBatch();

      batcher.addCompiled(createAccountQuery(props.qb, { id: account_id }));
      batcher.addCompiled(addProviderQuery(props.qb, account_id, provider));

      if (acocount_info) {
        batcher.addCompiled(
          setAccountInfoQuery(props.qb, {
            account_id: account_id,
            locale: acocount_info.locale,
            avatar_url: acocount_info.avatar_url,
            displayName: acocount_info.displayName,
          })
        );
      }

      await batcher.commit(props.pool);
    },
    async setAccountInfo(
      account_id: string,
      info: Partial<{
        locale: string;
        avatar_url: string;
        displayName: string;
      }>
    ) {
      await kQuery(
        props.pool,
        setAccountInfoQuery(props.qb, {
          account_id: account_id,
          locale: info.locale,
          avatar_url: info.avatar_url,
          displayName: info.displayName,
        })
      );
    },
    async deleteAccount(account_id: string) {
      await props.qb.deleteFrom('accounts').where('id', '=', account_id).execute();
    },
  };
};
