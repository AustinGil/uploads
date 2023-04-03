import { PassThrough } from 'stream';
import formidable from 'formidable';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const { S3_URL, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION } = process.env;
const s3Client = new S3Client({
  endpoint: `https://${S3_URL}`, // austins-bucket.us-southeast-1.linodeobjects.com
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  region: S3_REGION,
});

/* global defineEventHandler, getRequestHeaders, readBody */

/**
 * @see https://nuxt.com/docs/guide/concepts/server-engine
 * @see https://github.com/unjs/h3
 */
export default defineEventHandler(async (event) => {
  let body;
  const headers = getRequestHeaders(event);

  if (headers['content-type']?.includes('multipart/form-data')) {
    body = await parseMultipartNodeRequest(event.node.req);
  } else {
    body = await readBody(event);
  }
  console.log(body);

  return { ok: true };
});

/**
 * @param {import('http').IncomingMessage} req
 */
function parseMultipartNodeRequest(req) {
  return new Promise((resolve, reject) => {
    /** @type {Promise<any>[]} */
    const s3Uploads = [];

    /** @param {import('formidable').File} file */
    function fileWriteStreamHandler(file) {
      const body = new PassThrough();
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: 'austins-bucket',
          Key: `files/${file.originalFilename}`,
          ContentType: file.mimetype,
          ACL: 'public-read',
          Body: body,
        },
      });
      const uploadRequest = upload.done().then((response) => {
        file.location = response.Location;
      });
      s3Uploads.push(uploadRequest);
      return body;
    }
    const form = formidable({
      multiples: true,
      fileWriteStreamHandler: fileWriteStreamHandler,
    });
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      Promise.all(s3Uploads)
        .then(() => {
          resolve({ ...fields, ...files });
        })
        .catch(reject);
    });
  });
}
