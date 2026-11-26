import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getShowcaseView } from '../assets/showcase.mjs';

test('the combined showcase separates patient and doctor journeys and starts with their home screens', () => {
  assert.equal(getShowcaseView('patient', 0).screen.file, 'assets/app-patient-original.png');
  assert.equal(getShowcaseView('doctor', 0).screen.file, 'assets/app-doctor-original.png');
  assert.ok(getShowcaseView('patient', 0).screens.some(screen => screen.file.includes('patient-chat')));
  assert.ok(getShowcaseView('doctor', 0).screens.some(screen => screen.file.includes('doctor-schedule')));
});

test('screen navigation wraps in both directions and keeps invalid audiences on a known view', () => {
  const first = getShowcaseView('patient', 0);
  assert.equal(getShowcaseView('patient', first.screens.length).index, 0);
  assert.equal(getShowcaseView('patient', -1).index, first.screens.length - 1);
  assert.equal(getShowcaseView('unknown', 0).audience, 'patient');
});

test('all ten supplied app screens stay available with their original image bytes', async () => {
  const manifests = await Promise.all(['original-app-images', 'capability-images', 'assistant-images'].map(async name => JSON.parse(await readFile(new URL(`../docs/${name}.json`, import.meta.url), 'utf8'))));
  const originals = [...manifests[0].slice(0,3), ...manifests[1], ...manifests[2]];
  const screens = new Set(['patient', 'doctor'].flatMap(audience => getShowcaseView(audience, 0).screens.map(screen => screen.file)));
  assert.equal(screens.size, 10);
  for (const original of originals) {
    assert.ok(screens.has(original.file), original.file);
    const bytes = await readFile(new URL(`../${original.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), original.sha256);
  }
});
