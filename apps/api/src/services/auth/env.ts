import { parseEnvs } from '@/utils/env';
import { Type } from '@sinclair/typebox';

const AUTH_ENV = parseEnvs(
  Type.Object({
    AUTH_URL: Type.String({ format: 'uri' }),
    ENCRYPTION_KEY: Type.String({ minLength: 32 }),
    JWT_REFRESH_TOKEN_EXPIRATION_TIME: Type.String(),
    REFRESH_TOKEN_SECRET: Type.String({ minLength: 16 }),
    JWT_ACCESS_TOKEN_EXPIRATION_TIME: Type.String(),
    ACCESS_TOKEN_SECRET: Type.String({ minLength: 16 }),

    GOOGLE_OAUTH_CLIENT_ID: Type.Optional(Type.String()),
    GOOGLE_OAUTH_SECRET: Type.Optional(Type.String()),

    LINKEDIN_OAUTH_CLIENT_ID: Type.Optional(Type.String()),
    LINKEDIN_OAUTH_SECRET: Type.Optional(Type.String()),

    MICROSOFT_OAUTH_CLIENT_ID: Type.Optional(Type.String()),
    MICROSOFT_OAUTH_SECRET: Type.Optional(Type.String()),
  })
);

export default AUTH_ENV;
