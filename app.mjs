import { getDemoReply, getDemoExample, getInitialDemoConversation } from './demo.mjs';
import { createVideoController, getParallaxOffset, smoothParallaxOffset } from './media.mjs';
import { initOcrPreview } from './ocr.mjs';
import { initAudienceShowcase } from './assets/showcase.mjs';
import { initInstallPreview } from './install.mjs';

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  mobileNav.hidden = true;
};
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !open;
});
mobileNav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  closeMenu();
  const target = document.querySelector(link.hash);
  if (target) {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 801px)').addEventListener('change', ({ matches }) => {
  if (matches) closeMenu();
});

const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.querySelector('#chat-messages');
const sendButton = chatForm.querySelector('button');
const appCard = chatMessages.querySelector('.chat-app-card').cloneNode(true);
const chatWindow = document.querySelector('.chat-window');
const chatExpand = document.querySelector('.chat-expand');
function setChatExpanded(expanded) {
  chatWindow.classList.toggle('chat-expanded', expanded);
  chatExpand.setAttribute('aria-expanded', String(expanded));
  chatExpand.setAttribute('aria-label', expanded ? 'Show the shorter example conversation' : 'Read the full example conversation');
  chatExpand.textContent = expanded ? 'Show less' : 'Read full';
  const samples = getInitialDemoConversation({ compact: !expanded });
  for (const message of chatMessages.querySelectorAll('[data-seeded-message]')) {
    const sample = samples[Number(message.dataset.seededMessage)];
    if (!sample) continue;
    message.classList.toggle('message-with-doctors', Boolean(sample.example?.doctors));
    populateBubble(message.querySelector('.message-bubble'), sample.text, sample.role, sample.example, sample.showAppCard);
  }
}
chatExpand.addEventListener('click', () => setChatExpanded(chatExpand.getAttribute('aria-expanded') !== 'true'));
let replyTimer;
const scrollChat = () => { chatMessages.scrollTop = chatMessages.scrollHeight; };

function addDoctorExample(bubble, example) {
  const heading = document.createElement('h4');
  heading.className = 'demo-doctor-heading';
  heading.lang = 'bn';
  heading.textContent = example.heading;
  const introduction = document.createElement('p');
  introduction.lang = 'bn';
  introduction.textContent = example.introduction;
  const cards = document.createElement('ul');
  cards.className = 'demo-doctor-cards';
  cards.setAttribute('aria-label', 'Example cardiology doctors');
  for (const doctor of example.doctors) {
    const card = document.createElement('li');
    card.className = 'demo-doctor-card';
    const identity = document.createElement('div');
    identity.className = 'demo-doctor-identity';
    const avatar = document.createElement('span');
    avatar.className = `demo-doctor-avatar doctor-avatar-${doctor.avatar}`;
    avatar.setAttribute('aria-hidden', 'true');
    const details = document.createElement('div');
    const name = document.createElement('h5');
    name.lang = 'en';
    name.textContent = doctor.name;
    const verified = document.createElement('span');
    verified.className = 'demo-doctor-verified';
    verified.setAttribute('role', 'img');
    verified.setAttribute('aria-label', 'Verified doctor in this example');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('aria-hidden', 'true');
    const mark = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    mark.setAttribute('href', '#i-check');
    icon.append(mark);
    verified.append(icon);
    name.append(' ', verified);
    const qualifications = document.createElement('p');
    qualifications.className = 'demo-doctor-qualifications';
    qualifications.lang = 'en';
    qualifications.textContent = doctor.qualifications;
    details.append(name, qualifications);
    identity.append(avatar, details);
    const booking = document.createElement('div');
    booking.className = 'demo-doctor-booking';
    const fee = document.createElement('div');
    fee.className = 'demo-doctor-fee';
    const label = document.createElement('span');
    label.textContent = 'Consultation Fee';
    label.lang = 'en';
    const amount = document.createElement('strong');
    amount.textContent = doctor.fee.replace(/[০-৯]/g, digit => '০১২৩৪৫৬৭৮৯'.indexOf(digit));
    fee.append(label, amount);
    const link = document.createElement('a');
    link.className = 'demo-appointment-link';
    link.href = '#download';
    link.lang = 'en';
    link.textContent = 'Make Appointment';
    link.setAttribute('aria-label', `Continue in the Onubot app to make an appointment with ${doctor.name}`);
    booking.append(fee, link);
    card.append(identity, booking);
    cards.append(card);
  }
  const note = document.createElement('p');
  note.className = 'demo-example-note';
  note.lang = 'bn';
  note.textContent = example.compact ? 'নমুনা প্রোফাইল। বর্তমান প্রাপ্যতা ও ফি অ্যাপে দেখুন।' : 'এটি একটি নমুনা তালিকা। বর্তমান প্রাপ্যতা ও ফি অ্যাপে যাচাই করুন। অ্যাপে চালিয়ে যেতে Make Appointment চাপুন।';
  bubble.append(heading, introduction, cards, note);
}

function populateBubble(bubble, text, role, example, showAppCard = true) {
  bubble.replaceChildren();
  if (example?.doctors) addDoctorExample(bubble, example);
  else {
    const paragraph = document.createElement('p');
    paragraph.className = 'message-text';
    paragraph.textContent = text;
    if (/[\u0980-\u09ff]/.test(text)) paragraph.lang = 'bn';
    bubble.append(paragraph);
  }
  if (role === 'assistant' && showAppCard) bubble.append(appCard.cloneNode(true));
}

function addMessage(text, role, example = null, autoScroll = true, showAppCard = true) {
  const message = document.createElement('div');
  message.className = `message ${role}-message`;
  const avatar = document.createElement('span');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  if (role === 'user') avatar.textContent = 'You';
  else {
    const logo = document.createElement('img');
    logo.src = 'assets/onubot-mark.png';
    logo.width = 18;
    logo.height = 24;
    logo.alt = '';
    avatar.append(logo);
  }
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  message.classList.toggle('message-with-doctors', Boolean(example?.doctors));
  populateBubble(bubble, text, role, example, showAppCard);
  message.append(avatar, bubble);
  chatMessages.append(message);
  // Keep a long preview session bounded in memory.
  while (chatMessages.children.length > 31) chatMessages.children[1].remove();
  if (autoScroll && role === 'assistant') {
    message.scrollIntoView({ block: 'start', behavior: 'auto' });
  } else if (autoScroll && example) {
    const top = message.getBoundingClientRect().top - chatMessages.getBoundingClientRect().top + chatMessages.scrollTop - 24;
    chatMessages.scrollTo({ top });
  } else if (autoScroll) scrollChat();
  return message;
}

function restoreDemoConversation() {
  chatMessages.setAttribute('aria-live', 'off');
  chatMessages.replaceChildren();
  setChatExpanded(false);
  getInitialDemoConversation({ compact: true }).forEach((sample, index) => {
    const message = addMessage(sample.text, sample.role, sample.example, false, sample.showAppCard);
    message.dataset.seededMessage = String(index);
  });
  chatMessages.scrollTo({ top: 0, behavior: 'instant' });
  requestAnimationFrame(() => chatMessages.setAttribute('aria-live', 'polite'));
}

restoreDemoConversation();

// Inline email links remain available where a floating control could cover content.
const contactFab = document.querySelector('#chat-with-us');
if (contactFab && 'IntersectionObserver' in window) {
  const visibleContactSections = new Set();
  const contactObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleContactSections.add(entry.target);
      else visibleContactSections.delete(entry.target);
    }
    contactFab.hidden = visibleContactSections.size > 0;
  });
  for (const section of document.querySelectorAll('#demo, #footer')) contactObserver.observe(section);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (sendButton.disabled) return;
  const input = chatInput.value.trim();
  const reply = getDemoReply(input);
  const example = getDemoExample(input);
  if (!reply) return;
  addMessage(input, 'user');
  chatInput.value = '';
  sendButton.disabled = true;
  const typing = document.createElement('div');
  typing.className = 'message assistant-message typing-message';
  typing.setAttribute('aria-hidden', 'true');
  typing.innerHTML = '<span class="message-avatar"><img src="assets/onubot-mark.png" width="18" height="24" alt=""></span><div class="message-bubble"><i></i><i></i><i></i></div>';
  chatMessages.append(typing);
  scrollChat();
  replyTimer = setTimeout(() => {
    typing.remove();
    addMessage(reply, 'assistant', example);
    sendButton.disabled = false;
  }, 650);
});

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    if (sendButton.disabled) return;
    chatInput.value = button.dataset.prompt;
    chatForm.requestSubmit();
  });
});

document.querySelector('.reset-chat').addEventListener('click', () => {
  clearTimeout(replyTimer);
  restoreDemoConversation();
  chatInput.value = '';
  sendButton.disabled = false;
  chatInput.focus({ preventScroll: true });
});

const dialog = document.querySelector('#info-dialog');
const dialogContent = {
  support: {
    title: 'Get help with the app.',
    copy: 'Email admin@anchorblock.vc for app support or privacy requests. To request deletion, use the subject "Onubot account/data deletion", identify your account, and specify the information you want deleted. Do not send passwords, OTPs, card PINs, or unnecessary medical attachments. Urgent platform support: +8801400655308. This number is not an emergency medical service. See the Privacy Policy for the full request process and retention limits.'
  }
};
document.querySelectorAll('[data-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    const content = dialogContent[button.dataset.dialog];
    document.querySelector('#dialog-title').textContent = content.title;
    document.querySelector('#dialog-copy').textContent = content.copy;
    dialog.showModal();
  });
});
document.querySelector('#dialog-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
document.querySelector('#year').textContent = new Date().getFullYear();
initOcrPreview();
initAudienceShowcase();
initInstallPreview();

// Keep the page useful without animation support or when motion is disabled.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const canAutoplay = () => !motionPreference.matches && !connection?.saveData && !/^(slow-2g|2g)$/.test(connection?.effectiveType || '');
const revealTargets = document.querySelectorAll('[data-reveal], .section-heading, .capability-card, .tool-card, .doctor-features article, .peace-panel');
if ('IntersectionObserver' in window && !motionPreference.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
  for (const target of revealTargets) {
    target.classList.add('reveal-ready');
    revealObserver.observe(target);
  }
}

const films = [];
for (const video of document.querySelectorAll('[data-story-video]')) {
  const controller = createVideoController(video, { allowAutoplay: canAutoplay() });
  let inView = false;
  video.muted = true;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.3;
      controller.setVisible(inView && !document.hidden);
    }, { threshold: [0, 0.3] });
    // Observe the video itself; captions and buttons must not affect its visibility.
    observer.observe(video);
  }
  films.push({ controller, isInView: () => inView });
}
document.addEventListener('visibilitychange', () => {
  for (const film of films) film.controller.setVisible(film.isInView() && !document.hidden);
});
const updatePlaybackPreference = () => {
  for (const film of films) film.controller.setAutoplayAllowed(canAutoplay());
  if (motionPreference.matches) {
    for (const target of revealTargets) target.classList.add('is-revealed');
  }
};
motionPreference.addEventListener('change', updatePlaybackPreference);
connection?.addEventListener('change', updatePlaybackPreference);

// A short, frame-rate-independent ease softens wheel and touch scrolling.
const parallaxScenes = [...document.querySelectorAll('[data-parallax]')].map(scene => ({
  scene, current: 0, target: 0, visible: false,
  direction: scene.dataset.parallaxDirection === '-1' ? -1 : 1
}));
let parallaxFrame = 0;
let previousFrameTime = 0;
let measureParallax = true;
function renderParallax(timestamp) {
  parallaxFrame = 0;
  const elapsed = previousFrameTime ? Math.min(timestamp - previousFrameTime, 64) : 1000 / 60;
  previousFrameTime = timestamp;
  if (measureParallax) {
    const viewportHeight = window.innerHeight;
    // Read all geometry before writing transforms.
    for (const state of parallaxScenes) {
      const bounds = state.scene.getBoundingClientRect();
      state.visible = bounds.bottom >= 0 && bounds.top <= viewportHeight;
      const travel = motionPreference.matches ? 0 : parseFloat(getComputedStyle(state.scene).paddingTop) || 0;
      state.target = getParallaxOffset(bounds.top, bounds.height, viewportHeight, travel) * state.direction;
      // Initialize offscreen frames at their resting entry position.
      if (!state.visible || motionPreference.matches) state.current = state.target;
    }
    measureParallax = false;
  }
  let settling = false;
  for (const state of parallaxScenes) {
    state.current = motionPreference.matches ? 0 : smoothParallaxOffset(state.current, state.target, elapsed);
    state.scene.style.setProperty('--parallax-y', `${state.current.toFixed(2)}px`);
    state.scene.classList.toggle('parallax-active', state.visible && !motionPreference.matches);
    if (state.visible && Math.abs(state.target - state.current) > 0.025) settling = true;
  }
  if (settling) parallaxFrame = requestAnimationFrame(renderParallax);
  else previousFrameTime = 0;
}
function scheduleParallax() {
  measureParallax = true;
  if (!parallaxFrame) parallaxFrame = requestAnimationFrame(renderParallax);
}
window.addEventListener('scroll', scheduleParallax, { passive: true });
window.addEventListener('resize', scheduleParallax, { passive: true });
motionPreference.addEventListener('change', scheduleParallax);
scheduleParallax();

// Animate the care network only while it is on screen and the page is active.
const careNetwork = document.querySelector('[data-care-network]');
if (careNetwork) {
  let careInView = false;
  const updateCareMotion = () => {
    careNetwork.classList.toggle('network-is-active', careInView && !document.hidden && !motionPreference.matches);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      careInView = entry.isIntersecting;
      updateCareMotion();
    }, { threshold: .15 });
    observer.observe(careNetwork);
  }
  document.addEventListener('visibilitychange', updateCareMotion);
  motionPreference.addEventListener('change', updateCareMotion);
}
