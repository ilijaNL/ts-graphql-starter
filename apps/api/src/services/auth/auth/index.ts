import AUTH_ENV from '../env';
import { Pool } from 'pg';
import { ExtractProfileFn, createCallback, createConnect, createRedeem } from './oauth';
import { OAuthProviders, ShortToken, createJWTFactory } from './common';
import { GrantConfig, GrantProvider } from 'grant';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-ignore */
import Grant from 'grant/lib/grant'; // need to use internal library since it is not exposed
import { domainIsAllowed } from '@/domains';
import { createAuthDBClient } from '../db';
import { AccountService } from '../account';
import { request } from 'undici';
import createHttpError from 'http-errors';
import { createSignWithOTP } from './sign-with-otp';

type ProviderGetProfile = Record<OAuthProviders, ExtractProfileFn>;

const oauthProviders: { [provider in OAuthProviders]?: GrantProvider } = {
  google:
    AUTH_ENV.GOOGLE_OAUTH_CLIENT_ID && AUTH_ENV.GOOGLE_OAUTH_SECRET
      ? {
          key: AUTH_ENV.GOOGLE_OAUTH_CLIENT_ID,
          secret: AUTH_ENV.GOOGLE_OAUTH_SECRET,
          scope: ['profile', 'openid', 'email'],
        }
      : undefined,
  linkedin:
    AUTH_ENV.LINKEDIN_OAUTH_CLIENT_ID && AUTH_ENV.LINKEDIN_OAUTH_SECRET
      ? {
          key: AUTH_ENV.LINKEDIN_OAUTH_CLIENT_ID,
          secret: AUTH_ENV.LINKEDIN_OAUTH_SECRET,
          pkce: false,
          scope: ['r_emailaddress', 'r_liteprofile'],
        }
      : undefined,
  microsoft:
    AUTH_ENV.MICROSOFT_OAUTH_CLIENT_ID && AUTH_ENV.MICROSOFT_OAUTH_SECRET
      ? {
          key: AUTH_ENV.MICROSOFT_OAUTH_CLIENT_ID,
          secret: AUTH_ENV.MICROSOFT_OAUTH_SECRET,
          scope: ['openid', 'email'],
        }
      : undefined,
};

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
    }).then((d) => d.body.json() as any);

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

export type AuthService = ReturnType<typeof createAuthService>;

export const createAuthService = (deps: { pg: Pool; accountService: AccountService }) => {
  const authUrl = new URL(AUTH_ENV.AUTH_URL);

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

  const jwtFactory = createJWTFactory({
    iss: 'auth',
    secret: AUTH_ENV.ACCESS_TOKEN_SECRET,
    shortTokenInSec: parseInt(AUTH_ENV.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
    refreshTokenInSec: parseInt(AUTH_ENV.JWT_REFRESH_TOKEN_EXPIRATION_TIME),
  });

  const queryClient = createAuthDBClient(deps.pg);

  return {
    sendOTP: () => {
      throw new Error('not implemented');
    },
    signInWithOTP: createSignWithOTP({
      dbClient: queryClient,
      createAccount: (accountId, save) => deps.accountService.createAccount(null, { accountId: accountId }, save),
      signRefreshToken: jwtFactory.signRefreshToken,
    }),
    signShortToken: (token: ShortToken) => {
      return jwtFactory.signShortToken(token);
    },
    async refresh(jwtToken: string) {
      const account = await this.getUserFromToken(jwtToken);

      if (!account) {
        throw createHttpError.Unauthorized();
      }

      const newRefreshToken = jwtFactory.createRefreshToken({
        sub: account.id,
        account_id: account.id,
        token_version: account.token_version,
      });

      return {
        refresh_token: newRefreshToken,
        jwt_refresh_token: jwtFactory.signRefreshToken(newRefreshToken),
      };
    },
    async getUserFromToken(jwtToken: string) {
      const refreshToken = jwtFactory.getRefreshToken(jwtToken);

      if (!refreshToken) {
        throw createHttpError.Unauthorized();
      }

      const { account_id, token_version } = refreshToken;

      if (!account_id) {
        throw createHttpError.Unauthorized();
      }

      const user = await queryClient
        .selectFrom('accounts')
        .select(['id', 'token_version'])
        .where('id', '=', account_id)
        // check if token version is changed
        .where('token_version', '=', token_version)
        .executeTakeFirst();

      return user;
    },
    oauth: {
      redeem: createRedeem(deps.pg, { signRefreshToken: jwtFactory.signRefreshToken }),
      connect: createConnect({
        validateUrl: domainIsAllowed,
        grant(provider) {
          return grant({
            method: 'GET',
            params: { provider: provider },
          });
        },
      }),
      callback: createCallback({
        dbClient: createAuthDBClient(deps.pg),
        extractProfileFn: (provider) => providerGetProfileMap[provider],
        createAccount: (accountId, save) => deps.accountService.createAccount(null, { accountId }, save),
        updateAccountInfo: (props, save) =>
          deps.accountService.updateAccountInfo(
            {
              displayName: props.displayName,
              locale: props.locale,
              imagePath: props.avatar_url,
            },
            { accountId: props.account_id },
            save
          ),
        grant(ctx) {
          return grant({
            method: 'GET',
            params: { provider: ctx.provider, override: 'callback' },
            query: ctx.query,
            session: ctx.flowSession.session,
          });
        },
      }),
    },
  };
};
