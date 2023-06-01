import env from '@beam-australia/react-env';

type EnvKeys = 'API' | 'CDN' | 'BASE_DOMAIN' | 'AUTH_ENDPOINT';

export default function getEnv(key: EnvKeys) {
  return env(key);
}

export const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT as string;

export function getImagePath(bucketPath: string) {
  if (bucketPath.startsWith('http')) {
    return bucketPath;
  }

  const url = new URL(getEnv('CDN'));
  url.pathname = url.pathname ? (url.pathname + '/' + bucketPath).replaceAll('//', '/') : bucketPath;

  return url.toString();
}

export function isNextJSImage(url: string) {
  const bucketHost = new URL(getEnv('CDN')).hostname;
  const pu = new URL(url);
  if (pu.hostname === bucketHost) {
    return true;
  }

  return false;
}

export const BRAND_NAME = 'ts-starter-graphql';
