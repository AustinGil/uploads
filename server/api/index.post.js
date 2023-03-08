import stream from 'node:stream';
import formidable from 'formidable';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const S3_BUCKET = 'npm';
const S3_URL = process.env.S3_URL;

const s3Client = new S3Client({
  endpoint: `https://${S3_URL}`,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION,
});

/* global defineEventHandler, getRequestHeaders, readBody, sendRedirect */
/**
 * @typedef {import('formidable').Options} FormidableOptions
 */

/** @type {FormidableOptions['filename']} */
const generateFilename = function (name, ext, part) {
  name += `_${Date.now()}`;
  const originalFilename = part.originalFilename ?? '';
  const lastDotIndex = originalFilename.lastIndexOf('.');
  if (lastDotIndex > 0) {
    name += originalFilename.slice(lastDotIndex);
  }
  return name.replace(/ /gi, '_');
};

/**
 * @param {import('http').IncomingMessage} req
 * @param {FormidableOptions} options
 */
function parseMultipartNodeRequest(req, options = {}) {
  return new Promise((resolve, reject) => {
    /** @type {any[]} */
    const s3Uploads = [];

    options.multiples = options.multiples ?? true;
    options.filename = options.filename ?? generateFilename;
    options.fileWriteStreamHandler = function (file) {
      const ws = new stream.PassThrough();
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: S3_BUCKET,
          Key: file.newFilename,
          Body: ws,
          ACL: 'public-read',
        },
      });
      const uploadRequest = upload.done().then((response) => {
        file.location = response.Location;
        return file;
      });
      s3Uploads.push(uploadRequest);
      return ws;
    };

    formidable(options).parse(req, (error, fields, files) => {
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

  const returnJson =
    (headers['sec-fetch-mode'] != null &&
      headers['sec-fetch-mode'] !== 'navigate') ||
    headers.accept?.includes('application/json') || // Fetch requesting JSON
    headers['content-type']?.includes('application/json') || // Fetch sent JSON
    headers['x-custom-fetch']; // Fetch using custom header

  if (returnJson) {
    return { ok: true };
  }
  return sendRedirect(event, String(headers.referer), 303);
});
