import { getDemoReply } from './demo.mjs';
import { createVideoController, getParallaxOffset, smoothParallaxOffset } from './media.mjs';
import { initOcrPreview } from './ocr.mjs';
import { initAppJourney } from './journey.mjs';
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
const initialMessage = chatMessages.firstElementChild.cloneNode(true);
let replyTimer;
const scrollChat = () => { chatMessages.scrollTop = chatMessages.scrollHeight; };

function addMessage(text, role) {
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
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  if (/[\u0980-\u09ff]/.test(text)) paragraph.lang = 'bn';
  bubble.append(paragraph);
  if (role === 'assistant') bubble.append(appCard.cloneNode(true));
  message.append(avatar, bubble);
  chatMessages.append(message);
  // Keep a long preview session bounded in memory.
  while (chatMessages.children.length > 31) chatMessages.children[1].remove();
  scrollChat();
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (sendButton.disabled) return;
  const input = chatInput.value.trim();
  const reply = getDemoReply(input);
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
    addMessage(reply, 'assistant');
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
  chatMessages.replaceChildren(initialMessage.cloneNode(true));
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
initAppJourney();
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
  scene, current: 0, target: 0, visible: false
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
      state.target = getParallaxOffset(bounds.top, bounds.height, viewportHeight, travel);
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

// Pointer movement adds a small amount of depth; touch scrolling stays native.
const depthHover = matchMedia('(hover: hover) and (pointer: fine)');
const depthCards = [...document.querySelectorAll('.capability-image-card')];
const depthPointers = new Map();
let depthFrame = 0;
const depthAllowed = () => depthHover.matches && !motionPreference.matches && !document.hidden;
function resetDepthCard(card) {
  depthPointers.delete(card);
  card.classList.remove('depth-is-active');
  card.style.removeProperty('--pointer-tilt-x');
  card.style.removeProperty('--pointer-tilt-y');
}
function renderDepthPointers() {
  depthFrame = 0;
  if (!depthAllowed()) return resetDepthPointers();
  // Read the stationary stage bounds before writing any styles.
  const updates = [...depthPointers].map(([card, pointer]) => {
    const bounds = pointer.stage.getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (pointer.x - bounds.left) / bounds.width - .5));
    const y = Math.max(-.5, Math.min(.5, (pointer.y - bounds.top) / bounds.height - .5));
    return { card, x: (-y * 8).toFixed(2), y: (x * 12).toFixed(2) };
  });
  for (const { card, x, y } of updates) {
    card.style.setProperty('--pointer-tilt-x', `${x}deg`);
    card.style.setProperty('--pointer-tilt-y', `${y}deg`);
    card.classList.add('depth-is-active');
  }
}
function resetDepthPointers() {
  if (depthFrame) cancelAnimationFrame(depthFrame);
  depthFrame = 0;
  for (const card of depthCards) resetDepthCard(card);
}
for (const card of depthCards) {
  const stage = card.querySelector('.capability-image-art');
  const trackPointer = event => {
    if (!depthAllowed() || event.pointerType !== 'mouse') return;
    depthPointers.set(card, { stage, x: event.clientX, y: event.clientY });
    if (!depthFrame) depthFrame = requestAnimationFrame(renderDepthPointers);
  };
  stage.addEventListener('pointerenter', trackPointer);
  stage.addEventListener('pointermove', trackPointer, { passive: true });
  stage.addEventListener('pointerleave', () => resetDepthCard(card));
  stage.addEventListener('pointercancel', () => resetDepthCard(card));
}
depthHover.addEventListener('change', resetDepthPointers);
motionPreference.addEventListener('change', resetDepthPointers);
document.addEventListener('visibilitychange', resetDepthPointers);
window.addEventListener('blur', resetDepthPointers);
window.addEventListener('scroll', resetDepthPointers, { passive: true });

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
