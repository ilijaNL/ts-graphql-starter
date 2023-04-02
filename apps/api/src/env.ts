import { Type } from '@sinclair/typebox';
import { parseEnvs } from '@/utils/env';

const ENVS = parseEnvs(
  Type.Object({
    PORT: Type.String(),
    PG_CONNECTION: Type.String(),
    NODE_ENV: Type.Union((['production', 'staging', 'development'] as const).map((c) => Type.Literal(c))),
  })
);

export default ENVS;
