import env from '@beam-australia/react-env';

type EnvKeys = 'API' | 'CDN' | 'BASE_DOMAIN';

export default function getConfig(key: EnvKeys) {
  return env(key);
}

export function getAuthURL() {
  const url = new URL(getConfig('API'));
  url.pathname = '/auth';

  return url.toString();
}

export function getGraphURL() {
  /* const url = new URL(getConfig('API'));
  url.pathname = '/graphql';

  return url.toString(); */

  return 'http://localhost:8082/v1/graphql';
}

export function getImagePath(bucketPath: string) {
  const url = new URL(getConfig('CDN'));
  url.pathname = url.pathname ? (url.pathname + '/' + bucketPath).replaceAll('//', '/') : bucketPath;

  return url.toString();
}

export const BRAND_NAME = 'EventBoss';
