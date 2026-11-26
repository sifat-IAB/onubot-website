import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createDeletionHandler } from '../api/deletion-request.mjs';

const env = { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_USER: 'sender@example.com', SMTP_PASS: 'test-only-password', SMTP_FROM: 'Onubot <sender@example.com>' };
const valid = { name: 'Sample Person', email: 'person@example.com', phone: '', scope: 'entire', details: '', consent: true };
async function fixture(t, options = {}) {
  const messages = [];
  const sendMail = async message => { messages.push(message); return { accepted: ['admin@anchorblock.vc'], rejected: [] }; };
  const server = http.createServer(createDeletionHandler({ env, sendMail, ...options }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body = valid, headers = {}) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { base, post, messages };
}

test('a valid request is emailed directly to the admin and succeeds only after mail acceptance', async t => {
  const { post, messages } = await fixture(t);
  const response = await post({ ...valid, to: 'attacker@example.com' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, 'admin@anchorblock.vc');
  assert.equal(messages[0].replyTo, valid.email);
  assert.equal(messages[0].from, env.SMTP_FROM);
  assert.equal(messages[0].subject, 'Data deletion request');
  assert.match(messages[0].text, /Delete my entire account/);
  assert.equal(messages[0].html, undefined);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('invalid input, missing confirmation, and missing specific-data details never send email', async t => {
  const { post, messages } = await fixture(t);
  for (const body of [{ ...valid, consent: false }, { ...valid, email: 'bad' }, { ...valid, scope: 'specific', details: '  ' }]) {
    const response = await post(body);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
  assert.equal(messages.length, 0);
});

test('missing mail credentials returns a clear failure without pretending the request was sent', async t => {
  const { post, messages } = await fixture(t, { env: {} });
  const response = await post();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  assert.equal(messages.length, 0);
});

test('provider failures or rejected recipients never produce a success response or expose internal errors', async t => {
  for (const sendMail of [async () => { throw new Error('private SMTP diagnostic'); }, async () => ({ accepted: [], rejected: ['admin@anchorblock.vc'] })]) {
    const { post } = await fixture(t, { sendMail });
    const response = await post();
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /private SMTP diagnostic|test-only-password/);
  }
});

test('cross-site requests, unsupported media, and honeypot submissions are rejected', async t => {
  const { base, post, messages } = await fixture(t);
  assert.equal((await post(valid, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await post({ ...valid, website: 'spam.example' })).status, 400);
  assert.equal((await fetch(base, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'payload' })).status, 415);
  assert.equal((await fetch(base)).status, 405);
  assert.equal(messages.length, 0);
});

test('malformed and oversized JSON is rejected before mail delivery', async t => {
  const { base, messages } = await fixture(t);
  for (const [body, status] of [['{broken', 400], [JSON.stringify({ ...valid, details: 'x'.repeat(20000) }), 413]]) {
    const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, status);
  }
  assert.equal(messages.length, 0);
});

test('repeated submissions are rate-limited before sending additional email', async t => {
  const { post, messages } = await fixture(t);
  for (let i = 0; i < 5; i++) assert.equal((await post()).status, 200);
  const response = await post();
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal(messages.length, 5);
});

test('the Vercel pre-parsed request body follows the same validated direct-mail path', async () => {
  let message;
  let status;
  let body;
  const handler = createDeletionHandler({ env, sendMail: async value => { message = value; return { accepted: ['admin@anchorblock.vc'] }; } });
  await handler({ method: 'POST', headers: { 'content-type': 'application/json', host: 'onubot.example' }, body: { ...valid, scope: 'specific', details: 'Delete my scanned report.' }, socket: { remoteAddress: '127.0.0.1' } }, {
    writeHead(value) { status = value; },
    end(value) { body = JSON.parse(value); }
  });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(message.to, 'admin@anchorblock.vc');
  assert.match(message.text, /Delete my scanned report/);
});
