import http from 'node:http';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createReadStream } from 'node:fs';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.pdf': 'application/pdf' };
const publicFiles = new Set(['index.html', 'privacy-policy.html', 'terms-and-conditions.html', 'legal.css', 'styles.css', 'media.css', 'ocr.css', 'journey.css', 'install.css', 'app.mjs', 'demo.mjs', 'media.mjs', 'ocr.mjs', 'journey.mjs', 'install.mjs']);
export function createStaticServer() {
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      return response.end('Method not allowed');
    }
    try {
      const url = new URL(request.url, 'http://localhost');
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root) || (!publicFiles.has(relative) && !relative.startsWith('assets/'))) {
        response.writeHead(404);
        return response.end('Not found');
      }
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Not a file');
      const headers = {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes'
      };
      let start = 0;
      let end = info.size - 1;
      let status = 200;
      if (request.headers.range && request.method === 'GET') {
        const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        if (match && (match[1] || match[2])) {
          start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
          end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
        }
        if (!match || (!match[1] && !match[2]) || start >= info.size || start > end || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
          response.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}` });
          return response.end();
        }
        status = 206;
        headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
      }
      headers['Content-Length'] = Math.max(0, end - start + 1);
      response.writeHead(status, headers);
      if (request.method === 'HEAD' || info.size === 0) return response.end();
      const stream = createReadStream(file, { start, end });
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createStaticServer();
  server.listen(port, '127.0.0.1', () => console.log(`Onubot is ready at http://localhost:${port}`));
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
}
