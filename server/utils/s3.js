import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
/**
 * @typedef {import('@aws-sdk/client-s3').PutObjectCommandInput} PutObjectCommandInput
 */

const s3Client = new S3Client({
  endpoint: process.env.S3_URL,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION,
});

/**
 * @param {PutObjectCommandInput['Body']} item
 * @param {string} path
 */
export default function uploadToS3(item, path) {
  /** @type {PutObjectCommandInput} */
  const params = {
    Bucket: 'npm',
    Key: path,
    Body: item,
  };
  const command = new PutObjectCommand(params);
  return s3Client.send(command);
}
