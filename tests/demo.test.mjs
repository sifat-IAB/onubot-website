import test from 'node:test';
import assert from 'node:assert/strict';
import { getDemoReply } from '../demo.mjs';

test('empty and whitespace input does not produce a message', () => {
  assert.equal(getDemoReply('   '), null);
});

test('English prescription questions receive a short plain-text reply without doses', () => {
  const reply = getDemoReply('Can you read my prescription?');
  assert.match(reply, /prescription/i);
  assert.ok(reply.length <= 180);
  assert.doesNotMatch(reply, /<[^>]*>/);
  assert.doesNotMatch(reply, /\d+\s?mg|twice daily/i);
});

test('ordinary messages get a brief friendly response', () => {
  const reply = getDemoReply('Hello, how are you?');
  assert.ok(reply.length <= 150);
  assert.doesNotMatch(reply, /scripted|no live AI|personalized medical/i);
});

test('Bengali dosage questions receive Bengali text and refer to a clinician', () => {
  const reply = getDemoReply('বাচ্চার ওজন ১২ কেজি, জ্বরের সিরাপের ডোজ কত?');
  assert.match(reply, /চিকিৎসক/);
  assert.doesNotMatch(reply, /\d+\s?ml|\d+\s?mg|[০-৯]+\s?মিলি/i);
});

test('arbitrary markup is never copied into a generated reply', () => {
  assert.doesNotMatch(getDemoReply('<img src=x onerror=alert(1)>'), /<img|onerror/);
});

test('the headache example opens with empathy without assuming an age and keeps both follow-up questions', () => {
  const reply = getDemoReply('  Matha   betha korse?  ');
  assert.ok(reply.startsWith('আপনার মাথাব্যথার কথা জানতে পেরে দুঃখিত হলাম।'));
  assert.doesNotMatch(reply, /২৮|28|বয়স|বয়স|উপশমে/);
  assert.ok(reply.includes('সঠিক পরামর্শ দেওয়ার জন্য নিচের দুটি বিষয় একটু জানাবেন:'));
  assert.ok(reply.includes('১. আপনার এই মাথাব্যথা কতদিন ধরে হচ্ছে'));
  assert.ok(reply.includes('২. ব্যথার সাথে আপনার কি বমি বমি ভাব, চোখে ঝাপসা দেখা বা জ্বরের মতো কোনো লক্ষণ আছে?'));
});

test('the cardiology example uses the complete doctor details from the latest reference', () => {
  const reply = getDemoReply('CARDIOLOGY doctor book korbo');
  assert.ok(reply.includes('অনুবটে ডাক্তার বুক করুন'));
  assert.ok(reply.includes('প্রোফাইল কেবল নমুনা'), 'Doctor profiles must be identified as examples before the cards');
  assert.ok(reply.includes('Prof. Dr. Sk | BDS, FCPS, MCPS · Cardiology | ৳৫০০'));
  assert.ok(reply.includes('Prof. Dr. Mahim Khan | MBBS · Cardiology | ৳৩০০'));
  assert.ok(reply.includes('Prof. Dr. Sifat | BDS, MD, MS · Cardiology | ৳১০০০'));
});

test('the initial chat contains both question-answer pairs without requiring a prompt click', async () => {
  const demo = await import('../demo.mjs');
  assert.equal(typeof demo.getInitialDemoConversation, 'function');
  const conversation = demo.getInitialDemoConversation();
  assert.deepEqual(conversation.map(message => message.role), ['user', 'assistant', 'user', 'assistant']);
  assert.equal(conversation[0].text, 'Matha betha korse');
  assert.equal(conversation[1].text, getDemoReply(conversation[0].text));
  assert.equal(conversation[2].text, 'Cardiology doctor book korbo');
  assert.deepEqual(conversation[3].example.doctors.map(doctor => doctor.name), ['Prof. Dr. Mahim Khan', 'Prof. Dr. Sifat', 'Prof. Dr. Sk']);
});

test('sample age and doctor listings are only used for the supplied example prompts', () => {
  for (const prompt of ['I have a headache', 'Book a doctor', '<img src=x onerror=alert(1)> Matha betha korse']) {
    const reply = getDemoReply(prompt);
    assert.ok(!reply.includes('২৮'));
    assert.ok(!reply.includes('Prof. Dr.'));
    assert.doesNotMatch(reply, /<img|onerror/);
  }
});

test('the short preview keeps both exchanges while the full version preserves the supplied answers and all doctors', async () => {
  const { getInitialDemoConversation } = await import('../demo.mjs');
  const short = getInitialDemoConversation({ compact: true });
  const full = getInitialDemoConversation();
  assert.deepEqual(short.filter(message => message.role === 'user').map(message => message.text), ['Matha betha korse', 'Cardiology doctor book korbo']);
  assert.ok(short[1].text.length < full[1].text.length);
  assert.equal(short[3].example.doctors.length, 1);
  assert.equal(full[3].example.doctors.length, 3);
  assert.equal(full[1].text, getDemoReply('Matha betha korse'));
  assert.equal(short[1].showAppCard, false);
  assert.equal(short[3].showAppCard, true);
});
