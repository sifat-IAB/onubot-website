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

test('install preview automatically repeats after holding the installed screen and resetting', () => {
  const { animation, phases, advance, tasks } = setup();
  animation.start();
  assert.deepEqual(phases, ['tap']);
  advance(650);
  assert.deepEqual(phases, ['tap', 'installing']);
  advance(2800);
  assert.equal(phases.at(-1), 'installed');
  advance(3000);
  assert.equal(phases.at(-1), 'ready');
  advance(900);
  assert.equal(phases.at(-1), 'tap');
  advance(650);
  assert.equal(phases.at(-1), 'installing');
  assert.equal(tasks.size, 1, 'Only the next transition should be scheduled');
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

test('leaving during the installed hold cancels the next automatic cycle', () => {
  const { animation, phases, advance, tasks } = setup();
  animation.start();
  advance(650);
  advance(2800);
  assert.equal(phases.at(-1), 'installed');
  animation.reset();
  const count = phases.length;
  advance(20000);
  assert.equal(tasks.size, 0);
  assert.equal(phases.length, count);
  assert.equal(phases.at(-1), 'ready');
  animation.start();
  assert.equal(phases.at(-1), 'tap');
});

test('a static reduced-motion finish has no timers until automatic motion is enabled again', () => {
  const { animation, phases, advance, tasks } = setup();
  animation.start();
  animation.finish();
  assert.equal(phases.at(-1), 'installed');
  assert.equal(tasks.size, 0);
  const count = phases.length;
  advance(20000);
  assert.equal(phases.length, count);
  animation.start();
  assert.equal(phases.at(-1), 'tap');
});
