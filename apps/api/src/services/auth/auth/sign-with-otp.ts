import { SaveCommandFn, createAsyncAction } from '@/utils/actions';
import { Type } from '@sinclair/typebox';
import createHttpError from 'http-errors';
import { sql } from 'kysely';
import { RefreshToken, createAddProviderQuery } from './common';
import { AuthDBClient, AuthQueryBuilder } from '../db';
import { randomUUID } from 'node:crypto';

export const createSignWithOTP = (deps: {
  dbClient: AuthDBClient;
  signRefreshToken: (refreshToken: RefreshToken) => string;
  createAccount: (accountId: string, save: SaveCommandFn) => Promise<any>;
}) => {
  return createAsyncAction({
    schema: Type.Object({ value: Type.String(), token: Type.String() }),
    async handler(input, ctx, props) {
      const verifiedToken = await deps.dbClient
        .selectFrom('otp')
        .select(['type', 'value', 'id'])
        .where('id', '=', input.token)
        .where('otp.value', '=', input.value)
        // only valid for 30 minute
        .where('created_at', '>', sql`now() - interval '30 min'`)
        .executeTakeFirst();

      if (!verifiedToken) {
        throw createHttpError.Unauthorized('invalid-token');
      }

      props.save(AuthQueryBuilder.deleteFrom('otp').where('id', '=', verifiedToken.id).compile());

      /**
       * 1. Check if the existing provider exists
       * 2. If exits, derive id token from it
       * 3. if not exists, create an account and add the provider to the account
       */
      const provider = verifiedToken.type as 'phone' | 'email';

      const existingProvider = await deps.dbClient
        .selectFrom('account_providers')
        .innerJoin('accounts', 'accounts.id', 'account_providers.account_id')
        .where('provider', '=', provider)
        .where('provider_account_id', '=', verifiedToken.value)
        .select(['accounts.id as account_id', 'accounts.token_version', 'provider', 'provider_account_id'])
        .executeTakeFirst();

      let idToken: RefreshToken | null = null;

      // create account, create account provider
      if (!existingProvider) {
        const newAccountId = randomUUID();
        await deps.createAccount(newAccountId, props.save);
        props.save(
          createAddProviderQuery(deps.dbClient, newAccountId, {
            provider: provider,
            provider_acc_id: verifiedToken.value,
          })
        );
        idToken = {
          account_id: newAccountId,
          sub: newAccountId,
          token_version: 1,
        };
      } else {
        idToken = {
          account_id: existingProvider.account_id,
          sub: existingProvider.account_id,
          token_version: existingProvider.token_version,
        };
      }

      return {
        refresh_token: idToken,
        jwt_refresh_token: deps.signRefreshToken(idToken),
      };
    },
  });
};
