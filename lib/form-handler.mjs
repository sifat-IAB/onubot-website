import { isMailConfigured, sendEmail } from './mail.mjs';

const MAX_BODY_BYTES = 16384;
const WINDOW_MS = 15 * 60 * 1000;
const fail = (status, message) => Object.assign(new Error(message), { status });
function parsePayload(value) {
  if (Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value), 'utf8') > MAX_BODY_BYTES) throw fail(413, 'The request is too large. Please shorten your message.');
  let payload;
  try { payload = typeof value === 'string' ? JSON.parse(value) : value; }
  catch { throw fail(400, 'Please submit a valid request.'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw fail(400, 'Please submit a valid request.');
  return payload;
}
async function readPayload(request) {
  if (request.body !== undefined) return parsePayload(Buffer.isBuffer(request.body) ? request.body.toString('utf8') : request.body);
  return new Promise((resolve, reject) => {
    let chunks = [], bytes = 0, settled = false;
    const stop = error => { if (settled) return; settled = true; chunks = []; clearTimeout(timer); reject(error); };
    const timer = setTimeout(() => stop(fail(408, 'The request timed out. Please try again.')), 10000);
    request.on('data', chunk => {
      if (settled) return;
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) stop(fail(413, 'The request is too large. Please shorten your message.'));
      else chunks.push(chunk);
    });
    request.once('end', () => {
      if (settled) return;
      clearTimeout(timer);
      try { const payload = parsePayload(Buffer.concat(chunks).toString('utf8')); settled = true; chunks = []; resolve(payload); }
      catch (error) { stop(error); }
    });
    request.once('error', () => stop(fail(400, 'Unable to read the request. Please try again.')));
    request.once('aborted', () => stop(fail(400, 'The request was interrupted. Please try again.')));
  });
}
function reply(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  response.end(JSON.stringify(body));
}

export function createFormHandler({ getErrors, buildEmail, successMessage, unavailableMessage, env = process.env, sendMail = message => sendEmail(message, env), now = Date.now }) {
  const attempts = new Map();
  return async (request, response) => {
    if (request.method !== 'POST') return reply(response, 405, { ok: false, message: 'Please use the website form to send your request.' }, { Allow: 'POST' });
    const origin = request.headers.origin;
    if (origin) {
      try { if (new URL(origin).host !== request.headers.host) return reply(response, 403, { ok: false, message: 'Please submit the form from this website.' }); }
      catch { return reply(response, 403, { ok: false, message: 'Please submit the form from this website.' }); }
    }
    if (request.headers['sec-fetch-site'] === 'cross-site') return reply(response, 403, { ok: false, message: 'Please submit the form from this website.' });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) return reply(response, 415, { ok: false, message: 'Please use the website form.' });
    try {
      const input = await readPayload(request);
      if (String(input.website ?? '').trim()) return reply(response, 400, { ok: false, message: 'Unable to submit this request.' });
      const errors = getErrors(input);
      if (Object.keys(errors).length) return reply(response, 400, { ok: false, message: 'Please check the highlighted fields.', errors });
      if (!isMailConfigured(env)) return reply(response, 503, { ok: false, message: unavailableMessage });
      const timestamp = now();
      for (const [key, value] of attempts) if (value.expires <= timestamp) attempts.delete(key);
      const address = env.VERCEL === '1' ? String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim() : request.socket?.remoteAddress || 'unknown';
      const previous = attempts.get(address);
      if (previous?.count >= 5) return reply(response, 429, { ok: false, message: 'Too many requests. Please wait before trying again.' }, { 'Retry-After': String(Math.max(1, Math.ceil((previous.expires - timestamp) / 1000))) });
      if (attempts.size >= 1000 && !previous) attempts.delete(attempts.keys().next().value);
      attempts.set(address, { count: (previous?.count || 0) + 1, expires: previous?.expires || timestamp + WINDOW_MS });
      const email = buildEmail(input);
      let delivery;
      try { delivery = await sendMail({ from: env.SMTP_FROM, to: email.recipient, replyTo: input.email.trim(), subject: email.subject, text: email.body }); }
      catch { return reply(response, 502, { ok: false, message: 'Your message could not be sent. Please try again. Your entries have been kept.' }); }
      if (!delivery?.accepted?.some(address => String(address).toLowerCase() === email.recipient.toLowerCase()) || delivery.rejected?.length) return reply(response, 502, { ok: false, message: 'Your message could not be sent. Please try again. Your entries have been kept.' });
      return reply(response, 200, { ok: true, message: successMessage });
    } catch (error) {
      return reply(response, error.status || 400, { ok: false, message: error.status ? error.message : 'Please submit a valid request.' });
    }
  };
}
