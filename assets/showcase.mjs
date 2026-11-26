const screen = (file, label, alt, width = 738, height = 1600) => ({ file: `assets/${file}`, label, alt, width, height });
const welcome = screen('app-signin-original.png', 'Welcome', 'Onubot sign-in screen with the original doctor photographs and Google sign-in option.');
const audiences = {
  patient: {
    title: 'Your care, a little closer.',
    description: 'Understand a prescription, find a doctor, and keep your health story together. In Bangla or English, at your own pace.',
    highlights: ['Clear prescriptions and visit summaries', 'Online and in-person doctor appointments', 'Your health details, in one familiar place'],
    screens: [
      screen('app-patient-original.png', 'Your health desk', 'Original Onubot patient home with prescription upload and appointment booking.'),
      screen('patient-profile-original.png', 'Health profile', 'Original patient profile showing personal health details.'),
      screen('doctor-list-original.png', 'Find a doctor', 'Original Onubot doctor list with consultation fees and appointment options.'),
      screen('consultation-prescription-original.png', 'After your visit', 'Original prescription issued after a doctor consultation.', 960, 1447),
      screen('patient-chat-original.png', 'Ask Onu', 'Original patient conversation in Bangla with follow-up questions.'),
      screen('patient-visit-summary-original.png', 'Visit summary', 'Original patient chat showing the summary of a completed consultation.'),
      welcome
    ]
  },
  doctor: {
    title: 'More room for patient care.',
    description: 'Bring your schedule, patient context, and consultation workspace together. Spend less time finding the details and more time with patients.',
    highlights: ['A clear view of your day and appointments', 'Patient history within the Onu conversation', 'Manage consultation schedules in one place'],
    screens: [
      screen('app-doctor-original.png', 'Your practice desk', 'Original Onubot doctor desk with availability, appointments, and financial overview.'),
      screen('doctor-patient-history-original.png', 'Patient history', 'Original doctor conversation showing a patient’s clinical history.'),
      screen('doctor-schedule-chat-original.png', 'Your schedule', 'Original doctor conversation confirming a consultation schedule.'),
      welcome
    ]
  }
};

export function getShowcaseView(audience = 'patient', index = 0) {
  const key = Object.hasOwn(audiences, audience) ? audience : 'patient';
  const group = audiences[key];
  const selected = ((Number.isFinite(index) ? Math.trunc(index) : 0) % group.screens.length + group.screens.length) % group.screens.length;
  return { ...group, audience: key, index: selected, screen: group.screens[selected], behind: group.screens[(selected + 1) % group.screens.length] };
}

export function initAudienceShowcase(root = document.querySelector('[data-audience-showcase]')) {
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panel = root.querySelector('[role="tabpanel"]');
  const choices = root.querySelector('[data-screen-choices]');
  const screenSelect = root.querySelector('[data-screen-select]');
  const stage = root.querySelector('[data-audience-stage]');
  const primary = root.querySelector('[data-primary-screen]');
  const secondary = root.querySelector('[data-secondary-screen]');
  const caption = root.querySelector('[data-screen-caption]');
  const count = root.querySelector('[data-screen-count]');
  const status = root.querySelector('[data-showcase-status]');
  const remembered = { patient: 0, doctor: 0 };
  let audience = 'patient';
  let revision = 0;

  async function select(nextAudience, index, announce = true) {
    const view = getShowcaseView(nextAudience, index);
    audience = view.audience;
    remembered[audience] = view.index;
    const currentRevision = ++revision;
    tabs.forEach(tab => {
      const active = tab.dataset.audience === audience;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) panel.setAttribute('aria-labelledby', tab.id);
    });
    root.querySelector('[data-audience-title]').textContent = view.title;
    root.querySelector('[data-audience-description]').textContent = view.description;
    const highlights = root.querySelector('[data-audience-highlights]');
    highlights.replaceChildren(...view.highlights.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
    if (choices.dataset.audience !== audience) {
      choices.replaceChildren(...view.screens.map((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.label;
      button.setAttribute('aria-pressed', String(index === view.index));
      button.addEventListener('click', () => select(audience, index));
      return button;
      }));
      screenSelect.replaceChildren(...view.screens.map((item, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = item.label; return option; }));
      choices.dataset.audience = audience;
    }
    [...choices.children].forEach((button, index) => button.setAttribute('aria-pressed', String(index === view.index)));
    screenSelect.value = String(view.index);
    stage.classList.add('is-changing');
    stage.setAttribute('aria-busy', 'true');
    try {
      if (announce) await Promise.all([view.screen, view.behind].map(async item => { const preload = new Image(); preload.src = item.file; await preload.decode(); }));
      if (currentRevision !== revision) return;
      for (const [image, item] of [[primary, view.screen], [secondary, view.behind]]) {
        image.src = item.file;
        image.alt = image === primary ? item.alt : '';
        image.width = item.width;
        image.height = item.height;
      }
      caption.textContent = view.screen.label;
      count.textContent = `${String(view.index + 1).padStart(2,'0')} / ${String(view.screens.length).padStart(2,'0')}`;
      root.dataset.audience = audience;
      root.dataset.screen = String(view.index);
      if (announce) status.textContent = `${audience === 'patient' ? 'For patients' : 'For doctors'}: ${view.screen.label}. Screen ${view.index + 1} of ${view.screens.length}.`;
    } catch {
      if (currentRevision === revision) status.textContent = 'This preview could not load. Please choose another screen.';
    } finally {
      if (currentRevision === revision) { stage.classList.remove('is-changing'); stage.removeAttribute('aria-busy'); }
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.audience, remembered[tab.dataset.audience]));
    tab.addEventListener('keydown', event => {
      const destination = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (destination === undefined) return;
      event.preventDefault();
      tabs[destination].focus({ preventScroll: true });
      select(tabs[destination].dataset.audience, remembered[tabs[destination].dataset.audience]);
    });
  });
  const move = direction => select(audience, remembered[audience] + direction);
  screenSelect.addEventListener('change', () => select(audience, Number(screenSelect.value)));
  root.querySelector('[data-screen-previous]').addEventListener('click', () => move(-1));
  root.querySelector('[data-screen-next]').addEventListener('click', () => move(1));
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  let touch;
  stage.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') touch = { x: event.clientX, y: event.clientY }; });
  stage.addEventListener('pointerup', event => {
    if (!touch) return;
    const x = event.clientX - touch.x;
    const y = event.clientY - touch.y;
    touch = null;
    if (Math.abs(x) > 60 && Math.abs(y) < 50) move(x < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { touch = null; });
  select('patient', 0, false);
}
