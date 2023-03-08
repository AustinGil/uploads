function uploadFile(req, filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    stream.on('open', () => {
      req.pipe(stream);
    });
    // stream.on('drain', () => {
    //   const written = parseInt(stream.bytesWritten);
    //   const total = parseInt(req.headers['content-length']);
    //   const pWritten = ((written / total) * 100).toFixed(2);
    //   console.log(`Processing  ...  ${pWritten}% done`);
    // });
    stream.on('close', () => {
      resolve(filePath);
    });
    stream.on('error', (err) => {
      console.error(err);
      reject(err);
    });
  });
}
