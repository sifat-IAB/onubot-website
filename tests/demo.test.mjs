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
