import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstallAnimation } from '../install.mjs';

function setup() {
  let time = 0;
  let sequence = 0;
  const tasks = new Map();
  const phases = [];
  const animation = createInstallAnimation({
    onPhase: phase => phases.push(phase),
    schedule: (callback, delay) => { const id = ++sequence; tasks.set(id, { callback, due: time + delay }); return id; },
    cancel: id => tasks.delete(id)
  });
  const advance = milliseconds => {
    time += milliseconds;
    for (const [id, task] of [...tasks].sort((a,b) => a[1].due - b[1].due)) {
      if (task.due <= time) { tasks.delete(id); task.callback(); }
    }
  };
  return { animation, phases, advance, tasks };
}

test('install preview moves from tap to installing to the supplied installed screen', () => {
  const { animation, phases, advance } = setup();
  animation.start();
  assert.deepEqual(phases, ['tap']);
  advance(650);
  assert.deepEqual(phases, ['tap', 'installing']);
  advance(2800);
  assert.equal(phases.at(-1), 'installed');
});

test('leaving the preview cancels pending transitions without falsely completing it', () => {
  const { animation, phases, advance, tasks } = setup();
  animation.start();
  advance(800);
  animation.reset();
  advance(10000);
  assert.equal(phases.at(-1), 'ready');
  assert.equal(tasks.size, 0);
  assert.ok(!phases.includes('installed'));
});

test('a static reduced-motion finish has no animation timers and can be replayed later', () => {
  const { animation, phases, tasks } = setup();
  animation.start();
  animation.finish();
  assert.equal(phases.at(-1), 'installed');
  assert.equal(tasks.size, 0);
  animation.start();
  assert.equal(phases.at(-1), 'tap');
});
