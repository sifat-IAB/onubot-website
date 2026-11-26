export function createInstallAnimation({ onPhase, schedule = setTimeout, cancel = clearTimeout }) {
  let timer = null;
  const phases = [['tap', 650], ['installing', 2800], ['installed', 3000], ['ready', 900]];
  const clear = () => { if (timer !== null) cancel(timer); timer = null; };
  const advance = index => {
    clear();
    const [phase, duration] = phases[index];
    onPhase(phase);
    timer = schedule(() => advance((index + 1) % phases.length), duration);
  };
  return {
    start() { advance(0); },
    reset() { clear(); onPhase('ready'); },
    finish() { clear(); onPhase('installed'); }
  };
}

export function initInstallPreview(root = document.querySelector('[data-install-demo]')) {
  if (!root) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const caption = root.querySelector('[data-install-caption]');
  let inView = !('IntersectionObserver' in window);
  let playing = false;
  let preparing = false;
  let imagesReady;
  const captions = { ready: 'Install', tap: 'Install', installing: 'Installing…', installed: 'Ready to open' };
  const animation = createInstallAnimation({
    onPhase(phase) {
      root.dataset.installPhase = phase;
      caption.textContent = captions[phase];
    }
  });

  async function play() {
    if (preparing || playing || !inView || preference.matches || document.hidden) return;
    preparing = true;
    imagesReady ??= Promise.all([...root.querySelectorAll('img')].map(image => image.decode().catch(() => {})));
    await imagesReady;
    preparing = false;
    if (!inView || document.hidden || preference.matches) return;
    playing = true;
    animation.start();
  }
  const updateVisibility = () => {
    if (preference.matches) {
      playing = false;
      animation.finish();
    } else if (!inView || document.hidden) {
      playing = false;
      animation.reset();
    } else play();
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    }, { threshold: .2 });
    observer.observe(root);
  }
  document.addEventListener('visibilitychange', updateVisibility);
  preference.addEventListener('change', updateVisibility);
  updateVisibility();
}
