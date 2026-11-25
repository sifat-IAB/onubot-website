import test from 'node:test';
import assert from 'node:assert/strict';
import { createStaticServer } from '../server.mjs';
import { createVideoController, getParallaxOffset, smoothParallaxOffset } from '../media.mjs';

class Video extends EventTarget {
  paused = true;
  muted = true;
  ended = false;
  play() { this.paused = false; this.dispatchEvent(new Event('play')); return Promise.resolve(); }
  pause() { if (!this.paused) { this.paused = true; this.dispatchEvent(new Event('pause')); } }
}

test('parallax is centered in view and remains inside its reserved space', () => {
  assert.equal(getParallaxOffset(200, 400, 800, 40), 0);
  assert.ok(getParallaxOffset(0, 400, 800, 40) > 0);
  assert.ok(getParallaxOffset(400, 400, 800, 40) < 0);
  assert.equal(getParallaxOffset(-2000, 400, 800, 40), 40);
  assert.equal(getParallaxOffset(2000, 400, 800, 40), -40);
  assert.equal(getParallaxOffset(0, 400, 800, 0), 0);
});

test('parallax settles gently without overshooting its available space', () => {
  let offset = -24;
  for (let frame = 0; frame < 60; frame++) {
    const next = smoothParallaxOffset(offset, 24, 1000 / 60);
    assert.ok(next >= offset && next <= 24);
    offset = next;
  }
  assert.ok(Math.abs(offset - 24) < 0.1);
});

test('parallax easing has the same pace on 60 Hz and 120 Hz displays', () => {
  let standard = 0;
  let fast = 0;
  for (let frame = 0; frame < 30; frame++) standard = smoothParallaxOffset(standard, 24, 1000 / 60);
  for (let frame = 0; frame < 60; frame++) fast = smoothParallaxOffset(fast, 24, 1000 / 120);
  assert.ok(Math.abs(standard - fast) < 0.01);
});

test('video previews play in view and pause offscreen', async () => {
  const video = new Video();
  const controller = createVideoController(video);
  await controller.setVisible(true);
  assert.equal(video.paused, false);
  controller.setVisible(false);
  assert.equal(video.paused, true);
});

test('manual pause is respected when a video reenters the viewport', async () => {
  const video = new Video();
  const controller = createVideoController(video);
  await controller.setVisible(true);
  video.pause();
  controller.setVisible(false);
  await controller.setVisible(true);
  assert.equal(video.paused, true);
});

test('reduced-motion and data-saving preferences prevent automatic playback', async () => {
  const video = new Video();
  const controller = createVideoController(video, { allowAutoplay: false });
  await controller.setVisible(true);
  assert.equal(video.paused, true);
  await controller.toggle();
  assert.equal(video.paused, false);
});

test('rejected autoplay stays paused and does not reject the controller operation', async () => {
  const video = new Video();
  video.play = () => Promise.reject(new Error('Autoplay blocked'));
  const controller = createVideoController(video);
  await assert.doesNotReject(controller.setVisible(true));
  assert.equal(video.paused, true);
});

test('video server supports byte seeking, suffix ranges, HEAD, and invalid ranges', async (t) => {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/assets/doctor.mp4`;
  const partial = await fetch(url, { headers: { Range: 'bytes=0-31' } });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get('content-type'), 'video/mp4');
  assert.equal(partial.headers.get('accept-ranges'), 'bytes');
  assert.match(partial.headers.get('content-range'), /^bytes 0-31\/\d+$/);
  assert.equal((await partial.arrayBuffer()).byteLength, 32);
  const suffix = await fetch(url, { headers: { Range: 'bytes=-16' } });
  assert.equal(suffix.status, 206);
  assert.equal((await suffix.arrayBuffer()).byteLength, 16);
  const head = await fetch(url, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  assert.ok(Number(head.headers.get('content-length')) > 0);
  const invalid = await fetch(url, { headers: { Range: 'bytes=999999999-' } });
  assert.equal(invalid.status, 416);
  assert.match(invalid.headers.get('content-range'), /^bytes \*\/\d+$/);
});
