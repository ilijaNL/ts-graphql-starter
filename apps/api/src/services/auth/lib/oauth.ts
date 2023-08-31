import { GrantConfig, GrantProvider, GrantResponse } from 'grant';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-ignore */
import Grant from 'grant/lib/grant'; // need to use internal library since it is not exposed
import createHttpError from 'http-errors';
import { request } from 'undici';
import { createHash, randomUUID } from 'node:crypto';
import {
  JWTFactory,
  OAuthProviders,
  Provider,
  QueryBuilder,
  addProviderQuery,
  createAccountQuery,
  setAccountInfoQuery,
} from './common';
import { Pool } from 'pg';
import { sql } from 'kysely';
import { QueryBatch } from '@/utils/kysely';

export type FlowSession = {
  session: any;
  redirectURL: string;
  code_challenge: string;
};

type RequestToken = {
  account_id: string;
  provider: Provider;
  p_account_id: string;
};

// type ProviderConfig = {
//   grant: GrantProvider;
//   getProfile: (sessionResponse: GrantResponse) => NormalisedProfile | Promise<NormalisedProfile>;
// };

type ExtractProfileFn = (sessionResponse: GrantResponse) => NormalisedProfile | Promise<NormalisedProfile>;

type ProviderGetProfile = Record<OAuthProviders, ExtractProfileFn>;

/**
 * Fields that can be possibly returned by the OAuth provider and stored in the database
 */
type NormalisedProfile = Partial<{
  id: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  locale: string;
  emailVerified: boolean;
}>;

/**
 * Map of functions to retriev normalized profile
 */
const providerGetProfileMap: ProviderGetProfile = {
  google({ profile: { sub, name, picture, email, email_verified, locale } }) {
    return {
      id: sub,
      displayName: name,
      avatarUrl: picture,
      email,
      emailVerified: email_verified,
      locale: locale?.slice(0, 2),
    };
  },

  async linkedin({ profile, access_token }) {
    const {
      data: {
        elements: [
          {
            'handle~': { emailAddress: email },
          },
        ],
      },
    } = await request('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    }).then((d) => d.body.json());

    const locale = profile.firstName?.preferredLocale?.language?.slice(0, 2);
    const displayName = `${profile.localizedFirstName}`;

    const avatarUrl = profile.profilePicture?.['displayImage~']?.elements?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.authorizationMethod === 'PUBLIC'
    )?.identifiers?.[0]?.identifier;

    return {
      id: profile.id,
      displayName,
      avatarUrl,
      locale,
      email,
    };
  },
  microsoft(response) {
    const { profile } = response;
    return {
      id: profile.sub,
      name: profile.given_name,
      email: profile.email,
      displayName: profile.given_name,
    };
  },
  github() {
    throw new Error('not implemented');
  },
  twitter() {
    throw new Error('not implemented');
  },
};

export type OAuthConfig = {
  oauthProviders: {
    [provider in OAuthProviders]?: GrantProvider;
  };
  validateUrl: (redirectUrl: string) => Promise<boolean> | boolean;
  authURL: string;
};

export const createOAuth = (
  props: {
    qb: QueryBuilder;
    pool: Pool;
    jwtFactory: JWTFactory;
  },
  config: OAuthConfig
) => {
  const { validateUrl, oauthProviders } = config;
  const { qb, pool, jwtFactory } = props;
  const authUrl = new URL(config.authURL);

  const grantConfig = Object.assign(
    {
      defaults: {
        dynamic: false,
        origin: authUrl.origin,
        transport: 'state',
        prefix: authUrl.pathname + '/signin',
        state: true,
        nonce: true,
        pkce: true,
        response: ['tokens', 'profile'],
      },
    },
    (Object.keys(oauthProviders) as Array<OAuthProviders>).reduce((agg, key) => {
      if (oauthProviders[key]) {
        agg[key] = oauthProviders[key];
      }

      return agg;
    }, {} as GrantConfig)
  );

  const grant = Grant({ config: grantConfig });

  return {
    async redeem(props: { code_verifier: string; token: string }) {
      const { code_verifier, token } = props;
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

      const refreshToken = jwtFactory.createRefreshToken({
        sub: account.id,
        account_id: account.id,
        token_version: account.token_version,
      });

      return {
        refresh_token: refreshToken,
        jwt_refresh_token: jwtFactory.signRefreshToken(refreshToken),
      };
    },
    async connect(props: {
      redirectUrl: string;
      code_challenge: string;
      provider: OAuthProviders;
    }): Promise<{ flowSession: FlowSession; location: string }> {
      const validUrl = await validateUrl(props.redirectUrl);

      if (!validUrl) {
        throw new createHttpError.Forbidden('not valid redirectUrl');
      }

      const { location, session } = await grant({
        method: 'GET',
        params: { provider: props.provider },
        // query: req.query,
        // body: req.body,
      });

      const connectSess: FlowSession = {
        session,
        redirectURL: props.redirectUrl,
        code_challenge: props.code_challenge,
      };

      return {
        flowSession: connectSess,
        location: location,
      };
    },
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
    async callback(props: { provider: OAuthProviders; query: Record<string, any>; flowSession: FlowSession }) {
      const getProfile = providerGetProfileMap[props.provider];

      if (!getProfile) {
        throw new createHttpError.Forbidden('invalid provider');
      }

      //
      const { session, state } = await grant({
        method: 'GET',
        params: { provider: props.provider, override: 'callback' },
        query: props.query,
        session: props.flowSession.session,
      });

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

      const batcher = new QueryBatch();

      async function getRequestToken(provider_account_id: string): Promise<RequestToken> {
        const dbBuilder = qb;

        // check if account_provider exists
        const accountProvider = await dbBuilder
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
          const emailProvider = await dbBuilder
            .selectFrom('account_providers')
            .where('provider', '=', 'email')
            .where('provider_account_id', '=', normalizedProfile.email)
            .select(['account_id', 'provider', 'provider_account_id'])
            .executeTakeFirst();

          // already have account
          // just add
          if (emailProvider) {
            batcher.addCompiled(
              addProviderQuery(dbBuilder, emailProvider.account_id, {
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

        // create new account
        batcher.addCompiled(
          createAccountQuery(dbBuilder, { id: new_account_id }),
          addProviderQuery(dbBuilder, new_account_id, {
            provider,
            provider_acc_id: provider_account_id,
          }),
          setAccountInfoQuery(dbBuilder, {
            account_id: new_account_id,
            displayName: normalizedProfile.displayName ?? '   ',
            locale: /* normalizedProfile.locale ?? */ 'en',
            avatar_url: normalizedProfile.avatarUrl,
          })
        );

        // if email is verified, add as a provider too
        if (normalizedProfile.email && normalizedProfile.emailVerified) {
          batcher.addCompiled(
            addProviderQuery(dbBuilder, new_account_id, {
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

      batcher.addCompiled(
        qb
          .insertInto('code_challenge')
          .values({
            account_id: requestToken.account_id,
            id: token,
            code_challenge: props.flowSession.code_challenge,
          })
          .compile()
      );

      // commit all
      await batcher.commit(pool);

      const redirectUrl = new URL(props.flowSession.redirectURL);
      redirectUrl.searchParams.set('token', token);

      return {
        location: redirectUrl.toString(),
        token: token,
        account_id: requestToken.account_id,
        oauthProfile: normalizedProfile,
      };
    },
  };
};
