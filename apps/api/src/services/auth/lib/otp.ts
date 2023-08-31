import { randomUUID } from 'crypto';
import { JWTFactory, QueryBuilder, RefreshToken, addProviderQuery, createAccountQuery } from './common';
import { Pool } from 'pg';
import { sql } from 'kysely';
import createHttpError from 'http-errors';
import { QueryBatch } from '@/utils/kysely';

export const createOTP = (props: { qb: QueryBuilder; pool: Pool; jwtFactory: JWTFactory }) => {
  const { qb } = props;

  return {
    async sendOpt(input: { email: string } | { phone: string }) {
      const token = randomUUID();
      const batcher = new QueryBatch();

      if ('email' in input) {
        batcher.addCompiled(
          qb
            .insertInto('otp')
            .values({
              type: 'email',
              value: input.email.toLowerCase().trim(),
              id: token,
            })
            .compile()
        );
      }

      if ('phone' in input) {
        batcher.addCompiled(
          qb
            .insertInto('otp')
            .values({
              type: 'phone',
              value: input.phone.toLowerCase(),
              id: token,
            })
            .compile()
        );
      }

      // create otp job

      // send
      await batcher.commit(props.pool);
    },
    async signInWithOTP(input: { value: string; token: string }) {
      // delete after requesting
      const verifiedToken = await qb
        .deleteFrom('otp')
        .where('id', '=', input.token)
        .where('otp.value', '=', input.value)
        // only valid for 30 minute
        .where('created_at', '>', sql`now() - interval '30 min'`)
        .returning(['otp.type', 'otp.value', 'id'])
        .executeTakeFirst();

      if (!verifiedToken) {
        throw createHttpError.Unauthorized('invalid-token');
      }

      const batcher = new QueryBatch();

      /**
       * 1. Check if the existing provider exists
       * 2. If exits, derive id token from it
       * 3. if not exists, create an account and add the provider to the account
       */
      const provider = verifiedToken.type as 'phone' | 'email';

      const existingProvider = await qb
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
        batcher.addCompiled(
          createAccountQuery(qb, { id: newAccountId }),
          addProviderQuery(qb, newAccountId, {
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

      await batcher.commit(props.pool);

      const refreshToken = props.jwtFactory.createRefreshToken(idToken);

      return {
        refresh_token: refreshToken,
        jwt_refresh_token: props.jwtFactory.signRefreshToken(refreshToken),
      };
    },
  };
};
