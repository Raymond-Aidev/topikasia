import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;

  if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }

  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}

/**
 * S3에 파일 업로드
 * AWS 자격 증명이 없는 개발 환경에서는 mock URL을 반환합니다.
 *
 * @param buffer - 파일 버퍼
 * @param mimeType - MIME 타입
 * @param prefix - S3 키 접두사 (예: 'media/audio', 'media/image')
 * @returns 업로드된 파일의 URL
 */
export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  prefix: string,
): Promise<string> {
  const ext = mimeTypeToExtension(mimeType);
  const key = `${prefix}/${randomUUID()}.${ext}`;

  const client = getS3Client();

  if (!client || !env.AWS_BUCKET_NAME) {
    // 개발 환경: mock URL 반환
    console.warn('[S3] AWS 자격 증명이 없습니다. Mock URL을 반환합니다.');
    return `https://mock-s3.example.com/${key}`;
  }

  const command = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await client.send(command);

  return `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

function mimeTypeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
  };
  return map[mimeType] ?? 'bin';
}
