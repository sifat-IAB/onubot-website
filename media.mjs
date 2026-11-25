// The reserved space keeps the complete video visible throughout its movement.
export function getParallaxOffset(top, height, viewportHeight, travel) {
  const distanceFromCenter = viewportHeight / 2 - (top + height / 2);
  return Math.max(-travel, Math.min(travel, distanceFromCenter * 0.08));
}

export function smoothParallaxOffset(current, target, elapsedMs) {
  if (Math.abs(target - current) < 0.025) return target;
  const blend = 1 - Math.exp(-Math.max(0, elapsedMs) / 110);
  return current + (target - current) * blend;
}

// Offscreen pauses belong to the page; user pauses belong to the visitor.
export function createVideoController(video, { allowAutoplay = true } = {}) {
  let visible = false;
  let userPaused = false;
  let programmaticPause = false;
  let autoplayAllowed = allowAutoplay;

  video.addEventListener('pause', () => {
    if (!programmaticPause && visible && !video.ended) userPaused = true;
    programmaticPause = false;
  });
  video.addEventListener('play', () => {
    userPaused = false;
    programmaticPause = false;
  });

  const pause = () => {
    if (video.paused) return;
    programmaticPause = true;
    video.pause();
  };
  const play = async () => {
    try { await video.play(); } catch { /* Native controls remain available if autoplay is blocked. */ }
  };

  return {
    async setVisible(value) {
      visible = value;
      if (!visible) pause();
      else if (autoplayAllowed && !userPaused) await play();
    },
    setAutoplayAllowed(value) {
      autoplayAllowed = value;
      if (!value) pause();
    },
    async toggle() {
      if (video.paused) { userPaused = false; await play(); }
      else { userPaused = true; pause(); }
    }
  };
}
