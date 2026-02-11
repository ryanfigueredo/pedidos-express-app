/**
 * Upload de imagens para AWS S3
 * Variáveis: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_LOGO
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || process.env.S3_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET_LOGO || process.env.S3_BUCKET;

function getClient(): S3Client | null {
  const accessKey =
    process.env.S3_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID;
  const secretKey =
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKey || !secretKey || !BUCKET) return null;
  return new S3Client({
    region: REGION,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

export function isS3Configured(): boolean {
  return !!getClient();
}

export async function uploadLogo(
  buffer: Buffer,
  contentType: string,
  tenantId: string
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const ext = contentType.includes("png") ? "png" : "jpg";
  const key = `logos/${tenantId}-${Date.now()}.${ext}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // URL pública (bucket deve ter acesso público de leitura ou usar CloudFront)
    const baseUrl =
      process.env.S3_PUBLIC_URL ||
      `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
    return `${baseUrl}/${key}`;
  } catch (error) {
    console.error("[S3] Erro ao fazer upload:", error);
    return null;
  }
}
