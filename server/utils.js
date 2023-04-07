import { spawn } from 'node:child_process';

/** @param {string|string[]} filepaths */
export function clamscan(filepaths) {
  if (!Array.isArray(filepaths)) {
    filepaths = [filepaths];
  }
  return new Promise((resolve) => {
    const clamscan = spawn('clamscan', ['-r', '--remove', filepaths.join(' ')]);
    clamscan.on('close', (d) => {
      resolve(d);
    });
  });
}
