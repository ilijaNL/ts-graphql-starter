import fastifyCookie, { CookieSerializeOptions } from '@fastify/cookie';
import { request } from 'undici';
import { GrantConfig, GrantProvider } from 'grant';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-ignore */
import Grant from 'grant/lib/grant'; // need to use internal library since it is not exposed
import { Type, FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { assertRedirect, createRequesTokenQuery, Provider, RequestToken } from './common';
import AUTH_ENV from './env';
import { randomUUID } from 'node:crypto';
import { QueryBatch } from '@/utils/kysely';
import { QueryCreator } from 'kysely';
import { DB } from './__generated__/auth-db';
import { Pool } from 'pg';

type AuthQueryBuilder = QueryCreator<DB>;

const SESSION_COOKIE_KEY = `__session_auth`;
const REDIRECT_COOKIE_KEY = `__redirect_auth`;

type OauthProviders = Exclude<Provider, 'email'>;

const AUTH_URL = new URL(AUTH_ENV.AUTH_URL);

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

type ProviderConfig = {
  grant: GrantProvider;
  getProfile: (sessionResponse: any) => NormalisedProfile | Promise<NormalisedProfile>;
};

/**
 * For getProfile impl, see https://github.com/nhost/hasura-auth/blob/02da92a585b50b67d7b896719dfbf9dc5a84793c/src/routes/oauth/config.ts
 */
export const authProviderConfig: Record<OauthProviders, ProviderConfig | null> = {
  google:
    AUTH_ENV.GOOGLE_OAUTH_CLIENT_ID && AUTH_ENV.GOOGLE_OAUTH_SECRET
      ? {
          grant: {
            key: AUTH_ENV.GOOGLE_OAUTH_CLIENT_ID,
            secret: AUTH_ENV.GOOGLE_OAUTH_SECRET,
            scope: ['profile', 'openid', 'email'],
            pkce: true,
          },
          getProfile({ profile: { sub, name, picture, email, email_verified, locale } }) {
            return {
              id: sub,
              displayName: name,
              avatarUrl: picture,
              email,
              emailVerified: email_verified,
              locale: locale?.slice(0, 2),
            };
          },
        }
      : null,
  linkedin:
    AUTH_ENV.LINKEDIN_OAUTH_CLIENT_ID && AUTH_ENV.LINKEDIN_OAUTH_SECRET
      ? {
          grant: {
            key: AUTH_ENV.LINKEDIN_OAUTH_CLIENT_ID,
            secret: AUTH_ENV.LINKEDIN_OAUTH_SECRET,
            scope: ['r_emailaddress', 'r_liteprofile'],
            profile_url:
              'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
          },
          getProfile: async ({ profile, access_token }) => {
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
        }
      : null,
  microsoft:
    AUTH_ENV.MICROSOFT_OAUTH_CLIENT_ID && AUTH_ENV.MICROSOFT_OAUTH_SECRET
      ? {
          grant: {
            key: AUTH_ENV.MICROSOFT_OAUTH_CLIENT_ID,
            secret: AUTH_ENV.MICROSOFT_OAUTH_SECRET,
            scope: ['openid', 'email'],
            pkce: true,
          },
          getProfile(response) {
            const { profile } = response;
            return {
              id: profile.sub,
              name: profile.given_name,
              email: profile.email,
              displayName: profile.given_name,
            };
          },
        }
      : null,
  github: null,
  twitter: null,
};

const CONFIG = {
  defaults: {
    dynamic: false,
    origin: AUTH_URL.origin,
    transport: 'session',
    prefix: AUTH_URL.pathname + '/signin',
    state: true,
    nonce: true,
    // pkce should be configured per provider
    // pkce: true,
    response: ['tokens', 'email', 'profile'],
  },
  ...(Object.keys(authProviderConfig) as OauthProviders[]).reduce((agg, providerKey) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const provider = authProviderConfig[providerKey];
    if (provider) {
      agg[providerKey] = provider.grant;
    }
    return agg;
  }, {} as GrantConfig),
};

const createAccountQuery = (builder: AuthQueryBuilder, input: { id: string }) =>
  builder
    .insertInto('accounts')
    .values({
      disabled: false,
      version: 1,
      token_version: 1,
      id: input.id,
    })
    .compile();

const addProviderQuery = (
  builder: AuthQueryBuilder,
  input: { account_id: string; provider: Provider; provider_acc_id: string }
) =>
  builder
    .insertInto('account_providers')
    .values({
      account_id: input.account_id,
      provider: input.provider,
      provider_account_id: input.provider_acc_id,
    })
    .onConflict((cb) =>
      cb.columns(['account_id', 'provider']).doUpdateSet({
        provider: input.provider,
        provider_account_id: input.provider_acc_id,
      })
    )
    .compile();

const setAccountInfoQuery = (
  builder: AuthQueryBuilder,
  input: { account_id: string; displayName?: string; avatar_url?: string; locale: string }
) =>
  builder
    .insertInto('account_info')
    .values({
      account_id: input.account_id,
      locale: input.locale,
      avatar_url: input.avatar_url,
      display_name: input.displayName,
    })
    .onConflict((oc) =>
      oc.constraint('account_info_account_id_key').doUpdateSet({
        locale: input.locale,
        avatar_url: input.avatar_url,
        display_name: input.displayName,
      })
    )
    .compile();

export const oauth: FastifyPluginAsyncTypebox<{
  builder: AuthQueryBuilder;
  pool: Pool;
}> = async (fastify, { builder, pool }) => {
  // need cookie to store auth
  await fastify.register(fastifyCookie, {
    secret: AUTH_ENV.COOKIE_SECRET,
    prefix: '__Host-',
  });

  const grant = Grant({ config: CONFIG });

  // start flow
  fastify.route({
    method: ['GET', 'POST'],
    url: `/signin/:provider`,
    schema: {
      querystring: Type.Object({
        redirectUrl: Type.String({ format: 'uri' }),
      }),
      params: Type.Object({
        provider: Type.String(),
      }),
    },
    handler: async function handler(req, reply) {
      const redirectPath = req.query.redirectUrl;

      await assertRedirect(redirectPath);

      const { location, session } = await grant({
        method: req.method,
        params: req.params,
        // query: req.query,
        body: req.body,
      });

      const cookieConfig: CookieSerializeOptions = {
        // make this short
        maxAge: 60 * 5, // in seconds
        secure: 'auto',
        httpOnly: true,
        sameSite: 'lax',
        signed: true,
        path: `${AUTH_URL.pathname}/signin/${req.params.provider}`,
      };

      return reply
        .setCookie(SESSION_COOKIE_KEY, JSON.stringify(session), cookieConfig)
        .setCookie(REDIRECT_COOKIE_KEY, redirectPath, cookieConfig)
        .redirect(location);
    },
  });

  /**
   * Callback route for the oauth2 flow
   * happy path returns a requests token
   */
  fastify.route({
    method: ['GET', 'POST'],
    url: `/signin/:provider/:override`,
    schema: {
      params: Type.Object({
        provider: Type.String(),
        override: Type.String(),
      }),
    },
    handler: async function handler(req, reply) {
      const _grantSession = req.cookies[SESSION_COOKIE_KEY];
      const _redirectPath = req.cookies[REDIRECT_COOKIE_KEY];

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reply.clearCookie(SESSION_COOKIE_KEY).clearCookie(REDIRECT_COOKIE_KEY);

      if (!_grantSession || !_redirectPath) {
        return reply.notFound();
      }

      const { value: decryptedSession, valid: vs } = req.unsignCookie(_grantSession);
      const { value: redirectPath, valid: vp } = req.unsignCookie(_redirectPath);

      if (!decryptedSession || !redirectPath || !vs || !vp) {
        fastify.log.error({ decryptedSession, redirectPath, vs, vp });
        return reply.notFound();
      }

      const { session } = await grant({
        method: req.method,
        params: req.params,
        query: req.query,
        body: req.body,
        session: JSON.parse(decryptedSession),
      });

      const provider = session.provider as OauthProviders;
      const providerSpec = authProviderConfig[provider];
      const response = session.response;

      if (!providerSpec || !response) {
        return reply.notAcceptable('no-response');
      }

      const normalizedProfile = await providerSpec.getProfile(response);
      const provider_account_id = normalizedProfile?.id;

      if (!provider_account_id) {
        return reply.notAcceptable();
      }

      const batcher = new QueryBatch();

      async function getRequestToken(provider_account_id: string): Promise<RequestToken> {
        const new_account_id = randomUUID();
        const dbBuilder = builder;

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
            batcher.add(
              addProviderQuery(dbBuilder, {
                account_id: emailProvider.account_id,
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

        // create new account
        batcher.add(
          createAccountQuery(dbBuilder, { id: new_account_id }),
          addProviderQuery(dbBuilder, {
            account_id: new_account_id,
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

        if (normalizedProfile.email && normalizedProfile.emailVerified) {
          batcher.add(
            addProviderQuery(dbBuilder, {
              account_id: new_account_id,
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

      if (!requestToken) {
        return reply.badRequest();
      }

      // create request token
      const tokenID = randomUUID();
      batcher.add(createRequesTokenQuery(builder, { account_id: requestToken.account_id, id: tokenID }));

      // commit
      await batcher.flush(pool);

      const redirectUrl = new URL(redirectPath);

      redirectUrl.searchParams.set('request_token', tokenID);
      redirectUrl.searchParams.set('redirectTo', redirectPath);

      return reply.redirect(302, redirectUrl.toString());
    },
  });
};
