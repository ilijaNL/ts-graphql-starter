import { parseEnvs } from '@/utils/env';
import { Type } from '@sinclair/typebox';

const PROXY_ENV = parseEnvs(
  Type.Object({
    GATEWAY_SECRET: Type.String({}),
    ACCESS_TOKEN_SECRET: Type.String({ minLength: 16 }),
  })
);

export default PROXY_ENV;
