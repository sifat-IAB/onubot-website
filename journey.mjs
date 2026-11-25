export function initAppJourney(root = document.querySelector('#app-journey')) {
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const phones = [...root.querySelectorAll('[data-screen]')];
  const views = tabs.map(tab => tab.dataset.view);

  function select(index, moveFocus = false) {
    const active = (index + tabs.length) % tabs.length;
    root.dataset.view = views[active];
    tabs.forEach((tab, position) => {
      const selected = position === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    phones.forEach((phone, index) => {
      const offset = (index - active + views.length) % views.length;
      phone.dataset.position = ['active','next','previous'][offset];
      phone.setAttribute('aria-hidden', String(offset !== 0));
    });
    if (moveFocus) tabs[active].focus({ preventScroll: true });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
  select(0);
  if ('IntersectionObserver' in window) {
    const stage = root.querySelector('.journey-stage');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      stage.classList.add('is-ready');
      observer.disconnect();
    }, { threshold: .2 });
    observer.observe(stage);
  }
}
