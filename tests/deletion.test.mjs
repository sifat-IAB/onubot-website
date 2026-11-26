import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createStaticServer } from '../server.mjs';
import { getDeletionErrors, buildDeletionEmail } from '../assets/deletion.mjs';

const valid = {
  name: 'Sample Person',
  email: 'person@example.com',
  phone: '+880 1700 000000',
  scope: 'entire',
  details: '',
  consent: true
};

test('account deletion prepares an email to the supplied mailbox with the exact subject', () => {
  const result = buildDeletionEmail(valid);
  assert.equal(result.recipient, 'admin@anchorblock.vc');
  assert.equal(result.subject, 'Data deletion request');
  assert.match(result.body, /Name: Sample Person/);
  assert.match(result.body, /Account email: person@example.com/);
  assert.match(result.body, /Delete my entire account/);
  assert.match(result.body, /deletion is permanent and cannot be undone/);
  assert.equal(result.mailto, undefined, 'The request is sent by the server, not an email draft');
});

test('name, a valid account email, a supported scope, and explicit consent are required', () => {
  assert.ok(getDeletionErrors({ ...valid, name: '   ' }).name);
  assert.ok(getDeletionErrors({ ...valid, email: 'not-an-email' }).email);
  assert.ok(getDeletionErrors({ ...valid, scope: 'unknown' }).scope);
  assert.ok(getDeletionErrors({ ...valid, consent: false }).consent);
  assert.throws(() => buildDeletionEmail({ ...valid, consent: false }));
});

test('specific data requests require a description while the phone number stays optional', () => {
  assert.ok(getDeletionErrors({ ...valid, scope: 'specific', details: '   ' }).details);
  const result = buildDeletionEmail({ ...valid, scope: 'specific', phone: '', details: 'Delete the report I uploaded on 20 November.' });
  assert.match(result.body, /Delete specific data only/);
  assert.match(result.body, /Delete the report I uploaded on 20 November/);
  assert.match(result.body, /Phone number: Not provided/);
});

test('Unicode and query characters stay in the email body and cannot add headers or change the recipient', () => {
  const result = buildDeletionEmail({ ...valid, name: 'মাহিম খান', scope: 'specific', details: 'বাংলা রিপোর্ট\n&bcc=someone@example.com\n<img src=x onerror=alert(1)>' });
  assert.equal(result.recipient, 'admin@anchorblock.vc');
  assert.equal(result.bcc, undefined);
  assert.ok(result.body.includes('মাহিম খান'));
  assert.ok(result.body.includes('&bcc=someone@example.com'));
});

test('oversized fields and line breaks in identity fields are rejected', () => {
  assert.ok(getDeletionErrors({ ...valid, name: 'a'.repeat(121) }).name);
  assert.ok(getDeletionErrors({ ...valid, email: 'person@example.com\r\nBcc: other@example.com' }).email);
  assert.ok(getDeletionErrors({ ...valid, phone: '+880\n123' }).phone);
  assert.ok(getDeletionErrors({ ...valid, details: 'x'.repeat(1001) }).details);
});

test('the footer exposes the deletion page and its form assets are served successfully', async t => {
  const server = createStaticServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(home.includes('class="footer-delete-link" href="delete-account.html"'));
  for (const [route, mime] of [['delete-account.html', /^text\/html/], ['assets/deletion.css', /^text\/css/], ['assets/deletion.mjs', /javascript/]]) {
    const response = await fetch(`${base}/${route}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), mime);
    assert.equal(await response.text(), await readFile(new URL(`../${route}`, import.meta.url), 'utf8'));
  }
});
