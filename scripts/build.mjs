import { mkdir, copyFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'privacy-policy.html', 'terms-and-conditions.html', 'delete-account.html', 'contact.html', 'legal.css', 'styles.css', 'media.css', 'ocr.css', 'journey.css', 'install.css', 'app.mjs', 'demo.mjs', 'media.mjs', 'ocr.mjs', 'journey.mjs', 'install.mjs']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log('Static site built successfully in dist/');
