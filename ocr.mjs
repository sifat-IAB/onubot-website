export function initOcrPreview(root = document.querySelector('#ocr-clarity')) {
  if (!root) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const button = root.querySelector('#ocr-replay');
  const status = root.querySelector('#ocr-status');
  const visual = root.querySelector('.ocr-visual');
  let running = false;
  let finishTimer;

  function finish() {
    clearTimeout(finishTimer);
    running = false;
    button.disabled = false;
    status.textContent = 'Example complete. The prescription photo and app review screen are shown side by side.';
  }
  async function play() {
    if (running || preference.matches) return;
    running = true;
    button.disabled = true;
    // Wait for lazy images before illustrating their transformation.
    await Promise.all([...visual.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
    if (preference.matches) { finish(); return; }
    root.classList.remove('is-scanning');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (preference.matches) { finish(); return; }
      root.classList.add('is-scanning');
      status.textContent = 'Playing a visual scan walkthrough. This is an example, not a live OCR scan.';
      finishTimer = setTimeout(finish, 2200);
    }));
  }

  button.hidden = preference.matches;
  button.addEventListener('click', play);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      play();
    }, { threshold: .3 });
    observer.observe(visual);
  }
  preference.addEventListener('change', () => {
    button.hidden = preference.matches;
    if (preference.matches) {
      root.classList.remove('is-scanning');
      finish();
    }
  });
}
