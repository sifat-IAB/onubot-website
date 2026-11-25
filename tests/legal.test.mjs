import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { createStaticServer } from '../server.mjs';

const root = new URL('../', import.meta.url);
const documents = [
  { key: 'terms', page: 'terms-and-conditions.html', sections: 17, references: 4 },
  { key: 'privacy', page: 'privacy-policy.html', sections: 15, references: 5 }
];
const normalize = text => text.replace(/\s/g, '');
const decode = text => text.replaceAll('&quot;', '"').replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&');

for (const { key, page, sections, references } of documents) {
  test(`${key} page preserves every extracted PDF clause, in order, including Unicode and page-break continuations`, async () => {
    const source = JSON.parse(await readFile(new URL(`docs/legal/${key}-extracted.json`, root), 'utf8'));
    const html = await readFile(new URL(page, root), 'utf8');
    const document = html.match(/<article\b[^>]*data-legal-document[^>]*>([\s\S]*?)<\/article>/)?.[1];
    assert.ok(document, 'Missing full legal document');
    const original = source.pages.flatMap(item => item.lines)
      .filter(line => !/^\d+ \/ \d+Onubot · /.test(line.text) && line.text !== 'O N U B OT')
      .map(line => line.text).join('');
    assert.equal(normalize(decode(document.replace(/<[^>]*>/g, ''))), normalize(original), 'Legal wording differs from the extracted PDF');
    assert.equal([...document.matchAll(/<h2>/g)].length, sections + 1);
    assert.equal([...document.matchAll(/<section id="section-\d+">/g)].length, sections);
    const referenceBlock = document.split('<section id="references">')[1];
    assert.equal([...referenceBlock.matchAll(/<p>/g)].length, references);
    assert.ok(html.includes('Last updated: 24 November 2026'));
    assert.ok(html.includes(`href="assets/legal/${source.filename}" download`));
    const pdf = await readFile(new URL(`assets/legal/${source.filename}`, root));
    const manifest = JSON.parse(await readFile(new URL('docs/legal/sources.json', root), 'utf8'));
    assert.equal(createHash('sha256').update(pdf).digest('hex'), manifest[key].sha256);
  });
}

test('footer links and HTTP delivery expose both complete policies and original PDFs', async t => {
  const index = await readFile(new URL('index.html', root), 'utf8');
  const server = createStaticServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const { key, page } of documents) {
    assert.ok(index.includes(`href="${page}"`));
    const response = await fetch(`${base}/${page}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/html; charset=utf-8$/);
    assert.equal(await response.text(), await readFile(new URL(page, root), 'utf8'));
    const source = JSON.parse(await readFile(new URL(`docs/legal/${key}-extracted.json`, root), 'utf8'));
    const pdf = await fetch(`${base}/assets/legal/${source.filename}`);
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.deepEqual(Buffer.from(await pdf.arrayBuffer()), await readFile(new URL(`assets/legal/${source.filename}`, root)));
  }
  assert.ok(!index.includes('data-dialog="privacy"'), 'Old placeholder privacy dialog is still linked');
  assert.equal((await fetch(`${base}/legal.css`)).status, 200);
});
