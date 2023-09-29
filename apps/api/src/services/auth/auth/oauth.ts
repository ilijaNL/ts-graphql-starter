import { SaveCommandFn, createAsyncAction } from '@/utils/actions';
import { Type } from '@sinclair/typebox';
import { createHash, randomUUID } from 'node:crypto';
import { createAuthDBClient } from '../db';
import { QueryCreator, sql } from 'kysely';
import createHttpError from 'http-errors';
import { Pool } from 'pg';
import { OAuthProviders, Provider, RefreshToken, RequestToken, createAddProviderQuery } from './common';
import { GrantResponse } from 'grant';
import { DB } from '../__generated__/auth-db';

export type FlowSession = {
  session: any;
  redirectURL: string;
  code_challenge: string;
};

export const createRedeem = (
  pg: Pool,
  deps: {
    signRefreshToken: (token: RefreshToken) => string;
  }
) => {
  const qb = createAuthDBClient(pg);

  return createAsyncAction({
    schema: Type.Object({
      code_verifier: Type.String(),
      token: Type.String(),
    }),
    async handler(input) {
      const { code_verifier, token } = input;
      //
      const codeChallengeHash = createHash('sha256').update(code_verifier).digest('base64url');

      // delete after requesting
      const verifiedToken = await qb
        .deleteFrom('code_challenge')
        .where('id', '=', token)
        .where('code_challenge', '=', codeChallengeHash)
        // only valid for 1 minute
        .where('created_at', '>', sql`now() - interval '1 min'`)
        .returning('account_id')
        .executeTakeFirst();

      if (!verifiedToken) {
        throw createHttpError.Unauthorized();
      }

      // get account that belongs to the challenge
      const account = await qb
        .selectFrom('accounts')
        .select(['id', 'token_version'])
        .where('id', '=', verifiedToken.account_id)
        .executeTakeFirst();

      if (!account) {
        throw new createHttpError.NotFound();
      }

      const refreshToken: RefreshToken = {
        sub: account.id,
        account_id: account.id,
        token_version: account.token_version,
      };

      return {
        refresh_token: refreshToken,
        jwt_refresh_token: deps.signRefreshToken(refreshToken),
      };
    },
  });
};

export const createConnect = (deps: {
  validateUrl: (redirectUrl: string) => Promise<boolean>;
  grant: (provider: Provider) => Promise<{ location: string; session: any }>;
}) => {
  return createAsyncAction({
    schema: Type.Null(),
    async handler(
      _,
      ctx: {
        redirectUrl: string;
        code_challenge: string;
        provider: OAuthProviders;
      }
    ) {
      const validUrl = await deps.validateUrl(ctx.redirectUrl);

      if (!validUrl) {
        throw new createHttpError.Forbidden('not valid redirectUrl');
      }

      const { location, session } = await deps.grant(ctx.provider);

      const connectSess: FlowSession = {
        session,
        redirectURL: ctx.redirectUrl,
        code_challenge: ctx.code_challenge,
      };

      return {
        flowSession: connectSess,
        location: location,
      };
    },
  });
};

/**
 * Fields that can be possibly returned by the OAuth provider and stored in the database
 */
export type NormalisedProfile = Partial<{
  id: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  locale: string;
  emailVerified: boolean;
}>;

export type ExtractProfileFn = (sessionResponse: GrantResponse) => NormalisedProfile | Promise<NormalisedProfile>;

export const createCallback = (deps: {
  dbClient: QueryCreator<DB>;
  extractProfileFn: (provider: OAuthProviders) => ExtractProfileFn | undefined;
  grant: (ctx: {
    provider: OAuthProviders;
    query: Record<string, any>;
    flowSession: FlowSession;
  }) => Promise<{ session: any; state: any }>;
  createAccount: (accountId: string, save: SaveCommandFn) => Promise<any>;
  updateAccountInfo: (
    props: {
      account_id: string;
      displayName: string;
      locale?: 'en';
      avatar_url?: string;
    },
    save: SaveCommandFn
  ) => Promise<any>;
}) => {
  const dbClient = deps.dbClient;
  /**
   * 1. Complete the oauth flow
   * 2. Get normalized profile
   * 3. Create request token
   *    - If account exists, and provider already registered with account return
   *    - If account provider exists with verified email, link this to the same account and return
   *    - create account
   *    - Insert the provider data into the account_provides
   *    - If email is verified from oauth, add the email provider to the account
   *    - update account info with the normalized profile data
   */
  return createAsyncAction({
    schema: Type.Null(),
    async handler(
      _,
      ctx: { provider: OAuthProviders; query: Record<string, any>; flowSession: FlowSession },
      { save }
    ) {
      const getProfile = deps.extractProfileFn(ctx.provider);

      if (!getProfile) {
        throw new createHttpError.Forbidden('invalid provider');
      }

      const { session, state } = await deps.grant(ctx);

      const provider = session.provider as OAuthProviders;
      const response = state.response as GrantResponse;

      if (!response) {
        throw new createHttpError.InternalServerError('not supported provider');
      }

      const normalizedProfile = await getProfile(response);
      const provider_account_id = normalizedProfile?.id;

      if (!provider_account_id) {
        throw new createHttpError.Conflict('could not extract provider account id');
      }

      async function getRequestToken(provider_account_id: string): Promise<RequestToken> {
        // check if account_provider exists
        const accountProvider = await dbClient
          .selectFrom('account_providers')
          .where('provider', '=', provider)
          .where('provider_account_id', '=', provider_account_id)
          .select(['account_id', 'provider', 'provider_account_id'])
          .executeTakeFirst();

        if (accountProvider) {
          return {
            provider: provider,
            p_account_id: accountProvider.provider_account_id,
            account_id: accountProvider.account_id,
          };
        }

        if (normalizedProfile.email && normalizedProfile.emailVerified) {
          // check if account exists with the email
          const emailProvider = await dbClient
            .selectFrom('account_providers')
            .where('provider', '=', 'email')
            .where('provider_account_id', '=', normalizedProfile.email)
            .select(['account_id', 'provider', 'provider_account_id'])
            .executeTakeFirst();

          // already have account
          // just add
          if (emailProvider) {
            save(
              createAddProviderQuery(dbClient, emailProvider.account_id, {
                provider,
                provider_acc_id: provider_account_id,
              })
            );

            return {
              provider: provider,
              p_account_id: provider_account_id,
              account_id: emailProvider.account_id,
            };
          }
        }

        const new_account_id = randomUUID();

        await deps.createAccount(new_account_id, save),
          // init new account
          save(
            createAddProviderQuery(dbClient, new_account_id, {
              provider,
              provider_acc_id: provider_account_id,
            })
          );

        await deps.updateAccountInfo(
          {
            account_id: new_account_id,
            displayName: normalizedProfile.displayName ?? '   ',
            locale: /* normalizedProfile.locale ?? */ 'en',
            avatar_url: normalizedProfile.avatarUrl,
          },
          save
        );

        // if email is verified, add as a provider too
        if (normalizedProfile.email && normalizedProfile.emailVerified) {
          save(
            createAddProviderQuery(dbClient, new_account_id, {
              provider: 'email',
              provider_acc_id: normalizedProfile.email,
            })
          );
        }

        return {
          provider: provider,
          p_account_id: provider_account_id,
          account_id: new_account_id,
        };
      }

      const requestToken = await getRequestToken(provider_account_id);

      const token = randomUUID();

      save(
        dbClient
          .insertInto('code_challenge')
          .values({
            account_id: requestToken.account_id,
            id: token,
            code_challenge: ctx.flowSession.code_challenge,
          })
          .compile()
      );

      const redirectUrl = new URL(ctx.flowSession.redirectURL);
      redirectUrl.searchParams.set('token', token);

      return {
        location: redirectUrl.toString(),
        token: token,
        account_id: requestToken.account_id,
        oauthProfile: normalizedProfile,
      };
    },
  });
};
