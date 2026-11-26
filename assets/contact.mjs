export const CONTACT_EMAIL = 'sifat@anchorblock.vc';
const clean = value => typeof value === 'string' ? value.trim() : '';
export function getContactErrors(input = {}) {
  const errors = {};
  const name = clean(input.name), email = clean(input.email), message = clean(input.message);
  if (!name || name.length > 120 || /[\r\n\0]/.test(name)) errors.name = 'Enter your name, up to 120 characters.';
  if (!email || email.length > 254 || /[\r\n\0]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address so we can reply.';
  if (!message || message.length > 3000 || /\0/.test(message)) errors.message = 'Write your message, up to 3,000 characters.';
  return errors;
}
export function buildContactEmail(input) {
  const errors = getContactErrors(input);
  if (Object.keys(errors).length) throw new TypeError(Object.values(errors).join(' '));
  return {
    recipient: CONTACT_EMAIL,
    subject: 'Onubot website enquiry',
    body: ['New message from the Onubot contact page', '', `Name: ${clean(input.name)}`, `Email: ${clean(input.email)}`, '', 'Message:', clean(input.message)].join('\n')
  };
}

export function initContactForm(form = document.querySelector('#contact-form')) {
  if (!form) return;
  const feedback = document.querySelector('#contact-feedback');
  const summary = document.querySelector('#contact-errors');
  const submit = form.querySelector('button[type="submit"]');
  const fields = Object.fromEntries(['name','email','message'].map(key => [key,form.elements.namedItem(key)]));
  const counter = document.querySelector('#message-count');
  const read = () => Object.fromEntries(Object.entries(fields).map(([key,element]) => [key,element.value]));
  const markError = (key, message = '') => {
    const error = document.querySelector(`#contact-${key}-error`);
    error.textContent = message; error.hidden = !message;
    if (message) fields[key].setAttribute('aria-invalid','true');
    else fields[key].removeAttribute('aria-invalid');
  };
  const updateCount = () => { counter.textContent = `${fields.message.value.length.toLocaleString()} / 3,000`; };
  form.noValidate = true;
  submit.disabled = false;
  form.addEventListener('input', () => {
    feedback.hidden = true;updateCount();
    const errors = getContactErrors(read());
    for (const key of Object.keys(fields)) if (!errors[key]) markError(key);
    if (!Object.keys(errors).length) summary.hidden = true;
  });
  document.querySelector('[data-contact-feedback]')?.addEventListener('click', event => {
    event.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;
    if (!fields.message.value.trim()) fields.message.value = 'App feedback: ';
    updateCount(); fields.message.focus();fields.message.scrollIntoView({block:'center',behavior:'auto'});
  });
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();if (sending) return;
    const input = read(), errors = getContactErrors(input);
    for (const key of Object.keys(fields)) markError(key,errors[key]);
    summary.hidden = !Object.keys(errors).length;
    if (!summary.hidden) {fields[Object.keys(errors)[0]].focus();return;}
    input.website = form.elements.namedItem('website').value;
    sending = true;
    const controls = [...form.querySelectorAll('input,textarea,button')];
    for (const element of controls) element.disabled = true;
    form.setAttribute('aria-busy','true');submit.querySelector('span').textContent = 'Sending…';
    feedback.hidden = false;feedback.setAttribute('role','status');feedback.dataset.state = 'sending';feedback.textContent = 'Sending your message…';
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(),35000);
    try {
      const response = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(input),signal:controller.signal});
      let result;
      try {result = await response.json();}catch {throw new Error('The form is temporarily unavailable. Please try again. Your message has been kept.');}
      if (!response.ok || result.ok !== true) {
        if (result.errors) for (const key of Object.keys(fields)) markError(key,result.errors[key]);
        throw new Error(result.message || 'Your message could not be sent. Please try again.');
      }
      form.reset();updateCount();feedback.dataset.state = 'success';feedback.textContent = result.message;
    } catch (error) {
      feedback.setAttribute('role','alert');feedback.dataset.state = 'error';
      feedback.textContent = error.name === 'AbortError' ? 'The request timed out. Please try again. Your message has been kept.' : error instanceof TypeError ? 'Unable to connect. Please try again. Your message has been kept.' : error.message;
    } finally {
      clearTimeout(timeout);sending = false;
      for (const element of controls) element.disabled = false;
      form.removeAttribute('aria-busy');submit.querySelector('span').textContent = 'Send message';
      feedback.focus({preventScroll:true});feedback.scrollIntoView({block:'nearest',behavior:'auto'});
    }
  });
  updateCount();
}
if (typeof document !== 'undefined') initContactForm();
