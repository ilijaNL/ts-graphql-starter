import AWS from 'aws-sdk';
import { parseEnvs } from './env';
import { Type } from '@sinclair/typebox';
import { createHmac } from 'node:crypto';

export const S3_ENV = parseEnvs(
  Type.Object({
    STORAGE_ENDPOINT: Type.String({ format: 'uri' }),
    STORAGE_REGION: Type.String({}),
    STORAGE_SPACE: Type.String({}),
    STORAGE_ACCESS_KEY: Type.String({}),
    STORAGE_SECRET_KEY: Type.String({}),
    STORAGE_CDN_URL: Type.String({ format: 'uri' }),
  })
);

const s3 = new AWS.S3({
  endpoint: S3_ENV.STORAGE_ENDPOINT, // Find your endpoint in the control panel, under Settings. Prepend "https://".
  region: S3_ENV.STORAGE_REGION, // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (e.g. nyc3).
  signatureVersion: 'v4',
  s3ForcePathStyle: true,
  credentials: {
    accessKeyId: S3_ENV.STORAGE_ACCESS_KEY, // Access key pair. You can create access key pairs using the control panel or API.
    secretAccessKey: S3_ENV.STORAGE_SECRET_KEY, // Secret access key defined through an environment variable.
  },
});

type GenerateSignedUrlProps = {
  basePath: string;
  /**
   * filename + extension
   */
  fileName: string;
  contentType: string;
  // if set to true, allowed to read by public
  isPublic?: boolean;
};

export async function deleteFile(filePath: string) {
  return s3
    .deleteObject({
      Bucket: S3_ENV.STORAGE_SPACE,
      Key: filePath,
    })
    .promise();
}

function signPath(path: string) {
  return createHmac('sha256', S3_ENV.STORAGE_SECRET_KEY).update(path).digest('hex');
}

export function isValidPath(path: string, sign: string) {
  const expected = signPath(path);
  return expected === sign;
}

export function generateSignedUrl(props: GenerateSignedUrlProps) {
  const s3Params = {
    Bucket: S3_ENV.STORAGE_SPACE,
    Key: `${props.basePath}/${props.fileName}`.replaceAll('//', '/'),
    ContentType: props.contentType,
    ACL: props.isPublic === true ? 'public-read' : 'private',
    Expires: 60, // in seconds
  };
  const url = s3.getSignedUrl('putObject', s3Params);
  const path = `${props.basePath}/${props.fileName}`;
  const path_sig = signPath(path);

  return {
    fileLocation: s3Params.Bucket + '/' + s3Params.Key,
    path: path,
    path_sig: path_sig,
    preSignedUrl: url,
    headers: {
      'x-amz-acl': s3Params.ACL,
    },
  };
}
