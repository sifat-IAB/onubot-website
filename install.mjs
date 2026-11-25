export function createInstallAnimation({ onPhase, schedule = setTimeout, cancel = clearTimeout }) {
  let timers = [];
  const clear = () => { timers.forEach(cancel); timers = []; };
  return {
    start() {
      clear();
      onPhase('tap');
      timers.push(schedule(() => onPhase('installing'), 650));
      timers.push(schedule(() => { clear(); onPhase('installed'); }, 3450));
    },
    reset() { clear(); onPhase('ready'); },
    finish() { clear(); onPhase('installed'); }
  };
}

export function initInstallPreview(root = document.querySelector('[data-install-demo]')) {
  if (!root) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const replay = root.querySelector('[data-install-replay]');
  const caption = root.querySelector('[data-install-caption]');
  const status = root.querySelector('[data-install-status]');
  let inView = !('IntersectionObserver' in window);
  let complete = false;
  let preparing = false;
  const captions = { ready: 'Install', tap: 'Install', installing: 'Installing…', installed: 'Ready to open' };
  const animation = createInstallAnimation({
    onPhase(phase) {
      root.dataset.installPhase = phase;
      caption.textContent = captions[phase];
      replay.disabled = phase === 'tap' || phase === 'installing';
      if (phase === 'installed') {
        complete = true;
        status.textContent = 'Preview complete. This is how Onubot looks after installation. Get the app on Google Play.';
      } else if (phase === 'installing') status.textContent = 'Playing an installation preview. Nothing is being installed on this device.';
      else status.textContent = '';
    }
  });

  async function play() {
    if (preparing || preference.matches || document.hidden) return;
    preparing = true;
    await Promise.all([...root.querySelectorAll('img')].map(image => image.decode().catch(() => {})));
    preparing = false;
    if (!inView || document.hidden || preference.matches) return;
    complete = false;
    animation.start();
  }
  replay.hidden = preference.matches;
  replay.addEventListener('click', play);
  const updateVisibility = () => {
    if (!inView || document.hidden) {
      if (!complete) animation.reset();
    } else if (!complete && root.dataset.installPhase === 'ready') play();
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    }, { threshold: .2 });
    observer.observe(root);
  }
  document.addEventListener('visibilitychange', updateVisibility);
  preference.addEventListener('change', () => {
    replay.hidden = preference.matches;
    if (preference.matches) animation.finish();
  });
  if (preference.matches) animation.finish();
}
