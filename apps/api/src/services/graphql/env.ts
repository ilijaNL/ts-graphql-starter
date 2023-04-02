import { parseEnvs } from '@/utils/env';
import { Type } from '@sinclair/typebox';

const G_ENV = parseEnvs(
  Type.Object({
    HASURA_ORIGIN: Type.String({ format: 'uri' }),
    HASURA_ADMIN_SECRET: Type.String({ minLength: 8 }),
  })
);

export default G_ENV;
