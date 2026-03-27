import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!config.s3.endpoint || !config.s3.accessKey || !config.s3.secretKey) {
    return null;
  }
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: config.s3.endpoint,
      region: 'auto',
      credentials: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretKey,
      },
    });
  }
  return s3Client;
}

export async function uploadFile(fileBuffer: Buffer, key: string, contentType: string): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'File storage is not configured');
  }

  await client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  if (config.s3.publicUrl) {
    return `${config.s3.publicUrl}/${key}`;
  }
  return key;
}

export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'File storage is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  return s3GetSignedUrl(client, command, { expiresIn });
}
