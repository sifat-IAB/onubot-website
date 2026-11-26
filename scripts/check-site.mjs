import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['index.html', 'privacy-policy.html', 'terms-and-conditions.html', 'delete-account.html'];
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'path', 'use', 'rect', 'circle']);
const pageIds = new Map();
for (const page of pages) {
  const html = await readFile(path.join(root, page), 'utf8');
  const tags = [...html.matchAll(/<\/?([a-z][a-z0-9-]*)(?:\s[^<>]*?)?\s*\/?>/gi)];
  const stack = [];
  for (const [tag, name] of tags) {
    if (tag.startsWith('</')) {
      assert.equal(stack.pop(), name.toLowerCase(), `${page}: Unexpected closing tag: ${tag}`);
    } else if (!voidTags.has(name.toLowerCase()) && !tag.endsWith('/>')) stack.push(name.toLowerCase());
  }
  assert.equal(stack.length, 0, `${page}: Unclosed HTML elements`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: Duplicate HTML IDs`);
  pageIds.set(page, { ids, html, tags });
}
for (const [page, { ids, html, tags }] of pageIds) {
  for (const [, source] of html.matchAll(/(?:src|href|poster|srcset)="([^"]+)"/g)) {
    const url = new URL(source, `https://site.test/${page}`);
    if (url.origin !== 'https://site.test') continue;
    const local = decodeURIComponent(url.pathname.slice(1));
    await access(path.join(root, local));
    if (url.hash && pageIds.has(local)) {
      assert.ok(pageIds.get(local).ids.includes(url.hash.slice(1)), `${page}: Missing anchor target ${source}`);
    }
  }
  console.log(`${page}: valid structure, ${tags.length} elements, ${ids.length} unique IDs, all local links and anchor targets exist.`);
}
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
assert.ok(css.includes('prefers-reduced-motion'), 'Missing reduced-motion support');
