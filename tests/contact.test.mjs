import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createStaticServer } from '../server.mjs';
const contact = await import('../assets/contact.mjs').catch(() => ({}));
const api = await import('../api/contact.mjs').catch(() => ({}));
const valid = { name: 'মাহিম খান', email: 'person@example.com', message: 'I would like to learn about Onubot.\nCould your team help?' };
const env = { SMTP_HOST: 'smtp.example.com', SMTP_USER: 'sender@example.com', SMTP_PASS: 'test-only-password', SMTP_FROM: 'Onubot <sender@example.com>' };

test('contact validation accepts a real enquiry and rejects missing, oversized, or injected identity fields', () => {
  assert.equal(typeof contact.getContactErrors, 'function', 'Contact validation must exist');
  assert.deepEqual(contact.getContactErrors(valid), {});
  for (const [key, value] of [['name',' '],['name','a'.repeat(121)],['name','Person\r\nBcc: x@y.test'],['email','bad'],['email','person@example.com\nBcc: x@y.test'],['message',' '],['message','x'.repeat(3001)]]) {
    assert.ok(contact.getContactErrors({ ...valid, [key]: value })[key], key);
  }
});

test('contact mail preserves plain text and uses the fixed contact mailbox and subject', () => {
  assert.equal(typeof contact.buildContactEmail, 'function', 'Contact email builder must exist');
  const email = contact.buildContactEmail({ ...valid, to: 'other@example.com', message: '<img src=x onerror=alert(1)>\nFeedback & questions' });
  assert.equal(email.recipient, 'sifat@anchorblock.vc');
  assert.equal(email.subject, 'Onubot website enquiry');
  assert.match(email.body, /মাহিম খান/);
  assert.match(email.body, /<img src=x onerror=alert\(1\)>/);
  assert.equal(email.html, undefined);
  assert.throws(() => contact.buildContactEmail({ ...valid, email: 'bad' }));
});

async function fixture(t, overrides = {}) {
  assert.equal(typeof api.createContactHandler, 'function', 'Contact API must exist');
  const messages = [];
  const server = http.createServer(api.createContactHandler({ env, sendMail: async message => { messages.push(message); return { accepted: ['sifat@anchorblock.vc'], rejected: [] }; }, ...overrides }));
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(() => new Promise(resolve => {server.closeAllConnections();server.close(resolve);}));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body = valid, headers = {}) => fetch(base,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  return {base,post,messages};
}

test('contact submission sends directly to the fixed contact with a safe Reply-To', async t => {
  const {post,messages} = await fixture(t);
  const response = await post({...valid,to:'other@example.com'});
  assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
  assert.equal(messages.length,1);assert.equal(messages[0].to,'sifat@anchorblock.vc');
  assert.equal(messages[0].replyTo,valid.email);assert.equal(messages[0].from,env.SMTP_FROM);
  assert.equal(messages[0].subject,'Onubot website enquiry');assert.equal(messages[0].html,undefined);
});

test('invalid contact data and missing mail configuration never send or claim success', async t => {
  const {post,messages} = await fixture(t);
  assert.equal((await post({...valid,message:''})).status,400);assert.equal(messages.length,0);
  const unavailable = await fixture(t,{env:{}});
  const response = await unavailable.post();assert.equal(response.status,503);assert.equal((await response.json()).ok,false);assert.equal(unavailable.messages.length,0);
});

test('provider errors and rejected mail return a safe failure', async t => {
  for(const sendMail of [async()=>{throw new Error('private SMTP diagnostic');},async()=>({accepted:[],rejected:['sifat@anchorblock.vc']})]){
    const {post} = await fixture(t,{sendMail});const response=await post();
    assert.equal(response.status,502);assert.doesNotMatch(await response.text(),/private SMTP diagnostic|test-only-password/);
  }
});

test('contact endpoint rejects cross-site, spam, malformed, oversized and unsupported requests', async t => {
  const {base,post,messages}=await fixture(t);
  assert.equal((await post(valid,{Origin:'https://other.example'})).status,403);
  assert.equal((await post(valid,{'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await post({...valid,website:'spam.example'})).status,400);
  for(const [body,status] of [['{bad',400],[JSON.stringify({...valid,message:'x'.repeat(20000)}),413]]){
    assert.equal((await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body})).status,status);
  }
  assert.equal((await fetch(base)).status,405);
  assert.equal((await fetch(base,{method:'POST',headers:{'Content-Type':'text/plain'},body:'text'})).status,415);
  assert.equal(messages.length,0);
});

test('contact endpoint bounds repeated messages', async t => {
  const {post,messages}=await fixture(t);
  for(let i=0;i<5;i++)assert.equal((await post()).status,200);
  const response=await post();assert.equal(response.status,429);assert.ok(Number(response.headers.get('Retry-After'))>0);assert.equal(messages.length,5);
});

test('contact handles the pre-parsed Vercel request body', async () => {
  assert.equal(typeof api.createContactHandler,'function','Contact API must exist');
  let status,body,sent;
  await api.createContactHandler({env,sendMail:async message=>{sent=message;return {accepted:['sifat@anchorblock.vc']};}})(
    {method:'POST',headers:{host:'onubot.example','content-type':'application/json'},body:valid,socket:{remoteAddress:'127.0.0.1'}},
    {writeHead(value){status=value;},end(value){body=JSON.parse(value);}}
  );
  assert.equal(status,200);assert.equal(body.ok,true);assert.equal(sent.replyTo,valid.email);
});

test('contact page and assets are served and homepage contact links reach it', async t => {
  const server=createStaticServer({contactHandler:(_req,res)=>{res.writeHead(200);res.end('contact handler');}});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const file of ['contact.html','assets/contact.css','assets/contact.mjs'])assert.equal((await fetch(`${base}/${file}`)).status,200,file);
  assert.equal(await (await fetch(`${base}/api/contact`,{method:'POST'})).text(),'contact handler');
  const home=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(home,/class="footer-chat-link" href="contact.html"/);
});
