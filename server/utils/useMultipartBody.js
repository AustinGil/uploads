// import Busboy from 'busboy';
// import formidable from 'formidable';
// import multipart from 'parse-multipart-data';

/* global getRequestHeaders, readMultipartFormData, readBody */

/** @type {import('h3').EventHandler<any>} */
const useFiles = async (event) => {
  let body;
  const headers = getRequestHeaders(event);

  if (headers['content-type']?.includes('multipart/form-data')) {
    body = {};
    const formData = await readMultipartFormData(event);
    for (const data of formData || []) {
      const key = data.name;
      let value;
      if (data.filename == null) {
        value = data.data.toString();
      } else {
        value = data;
      }

      if (typeof body[key] === 'undefined') {
        body[key] = value;
      } else {
        if (Array.isArray(body[key])) {
          body[key].push(value);
        } else {
          body[key] = [body[key], value];
        }
      }
    }
  } else {
    body = await readBody(event);
  }

  return body;

  /**
   * V1
   */
  // return new Promise(async (resolve) => {
  //   console.log(event.node.req);
  //   const { req } = event.node;
  //   const files = [];
  //   const fields = {};
  //   const busboy = Busboy({ headers: req.headers });
  //   // busboy.on('file', (name, file, info) => {
  //   //   console.log(name, file, info);
  //   //   const { filename, encoding, mimeType } = info;
  //   //   var chunks = [];
  //   //   file.on('data', (chunk) => {
  //   //     chunks.push(chunk);
  //   //   });
  //   //   file.on('end', () => {
  //   //     files.push({
  //   //       fieldname: name,
  //   //       filename,
  //   //       encoding,
  //   //       mimetype: mimeType,
  //   //       buffer: Buffer.concat(chunks),
  //   //     });
  //   //   });
  //   // });
  //   // busboy.on('field', (name, value, info) => {
  //   //   fields[name] = value;
  //   // });
  //   busboy.on('close', () => {
  //     // busboy.on('finish', () => {
  //     resolve({ files, fields });
  //   });
  //   req.pipe(busboy);
  // });
  /**
   * V2
   */
  // const headers = getRequestHeaders(event);
  // // for (let i = 0; i < multipartBodyBuffer.length; i++) {
  // const boundary = headers['content-type'].split('boundary=')[1];
  // const body = await readRawBody(event);
  // console.log(headers['content-type'], boundary);
  // const parts = multipart.parse(body, boundary);
  // console.log(parts);
  // for (let i = 0; i < parts.length; i++) {
  //   const part = parts[i];
  //   console.log(part);
  //   // will be: { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
  // }
  // return parts;
  /**
   * V3
   */
  // return new Promise((resolve, reject) => {
  //   const form = new formidable.IncomingForm();
  //   form.parse(event.node.req, (err, fields, files) => {
  //     console.log(err);
  //     console.log(fields);
  //     console.log(files);
  //     if (err) {
  //       return reject(err);
  //     }
  //     resolve(files);
  //   });
  // });
};

export default useFiles;
