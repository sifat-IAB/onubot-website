const recipient = 'admin@anchorblock.vc';
const subject = 'Data deletion request';
const clean = value => String(value ?? '').trim();
const singleLine = value => !/[\r\n]/.test(String(value ?? ''));

export function getDeletionErrors(input = {}) {
  const errors = {};
  const name = clean(input.name);
  const email = clean(input.email);
  const phone = clean(input.phone);
  const details = clean(input.details);
  if (typeof input.name !== 'string' || !name || name.length > 120 || !singleLine(input.name)) errors.name = 'Enter your name, using up to 120 characters.';
  if (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(email) || email.length > 254 || !singleLine(input.email)) errors.email = 'Enter the email address you used for your Onubot account.';
  if ((input.phone !== undefined && typeof input.phone !== 'string') || phone.length > 40 || !singleLine(input.phone)) errors.phone = 'Enter a phone number using up to 40 characters.';
  if (!['entire', 'specific'].includes(input.scope)) errors.scope = 'Choose whether to delete your entire account or specific data.';
  if ((input.details !== undefined && typeof input.details !== 'string') || details.length > 1000) errors.details = 'Keep the description within 1,000 characters.';
  else if (input.scope === 'specific' && !details) errors.details = 'Tell us exactly which data you want deleted.';
  if (input.consent !== true) errors.consent = 'Confirm that you understand deletion is permanent and cannot be undone.';
  return errors;
}

export function buildDeletionEmail(input) {
  const errors = getDeletionErrors(input);
  if (Object.keys(errors).length) throw new TypeError(Object.values(errors).join(' '));
  const body = [
    'Onubot account & data deletion request',
    '',
    `Name: ${clean(input.name)}`,
    `Account email: ${clean(input.email)}`,
    `Phone number: ${clean(input.phone) || 'Not provided'}`,
    `Request: ${input.scope === 'entire' ? 'Delete my entire account' : 'Delete specific data only'}`,
    '',
    'Additional details:',
    clean(input.details) || 'Not provided',
    '',
    'Confirmation: I understand that deletion is permanent and cannot be undone.',
    'Please verify account ownership before processing this request.'
  ].join('\n');
  return { recipient, subject, body };
}

export function initDeletionForm(form = document.querySelector('#deletion-form')) {
  if (!form) return;
  const feedback = document.querySelector('#deletion-feedback');
  const submitButton = form.querySelector('button[type="submit"]');
  const summary = document.querySelector('#deletion-errors');
  const requirement = document.querySelector('#details-requirement');
  const controls = Object.fromEntries(['name', 'email', 'phone', 'details', 'consent'].map(name => [name, form.elements.namedItem(name)]));
  controls.scope = form.querySelector('[name="scope"]');
  const read = () => ({
    name: controls.name.value,
    email: controls.email.value,
    phone: controls.phone.value,
    scope: new FormData(form).get('scope'),
    details: controls.details.value,
    consent: controls.consent.checked
  });
  const showError = (name, message = '') => {
    const error = document.querySelector(`#${name}-error`);
    error.textContent = message;
    error.hidden = !message;
    if (message) controls[name].setAttribute('aria-invalid', 'true');
    else controls[name].removeAttribute('aria-invalid');
  };
  const updateScope = () => {
    const specific = new FormData(form).get('scope') === 'specific';
    controls.details.required = specific;
    requirement.textContent = specific ? '(required for specific data)' : '(optional)';
    if (!specific) showError('details');
  };
  form.noValidate = true;
  submitButton.disabled = false;
  updateScope();
  form.addEventListener('input', () => {
    feedback.hidden = true;
    const errors = getDeletionErrors(read());
    for (const name of Object.keys(controls)) if (!errors[name]) showError(name);
    if (!Object.keys(errors).length) summary.hidden = true;
  });
  form.addEventListener('change', updateScope);
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const input = read();
    const errors = getDeletionErrors(input);
    for (const name of Object.keys(controls)) showError(name, errors[name]);
    summary.hidden = !Object.keys(errors).length;
    if (!summary.hidden) {
      summary.textContent = 'Please check the highlighted fields before continuing.';
      controls[Object.keys(errors)[0]].focus();
      return;
    }
    input.website = form.elements.namedItem('website').value;
    sending = true;
    const elements = [...form.querySelectorAll('input,textarea,button')];
    for (const element of elements) element.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending request…';
    feedback.hidden = false;
    feedback.setAttribute('role', 'status');
    feedback.dataset.state = 'sending';
    feedback.textContent = 'Sending your request securely…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch('/api/deletion-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(input), signal: controller.signal });
      let result;
      try { result = await response.json(); }
      catch { throw new Error('Submission is temporarily unavailable. Please try again later.'); }
      if (!response.ok || result.ok !== true) {
        if (result.errors) for (const name of Object.keys(controls)) showError(name, result.errors[name]);
        throw new Error(result.message || 'Your request could not be sent. Please try again.');
      }
      form.reset();
      updateScope();
      feedback.dataset.state = 'success';
      feedback.textContent = result.message;
    } catch (error) {
      feedback.setAttribute('role', 'alert');
      feedback.dataset.state = 'error';
      feedback.textContent = error.name === 'AbortError' ? 'The request timed out. Please try again. Your entries have been kept.' : error instanceof TypeError ? 'Unable to connect. Please try again. Your entries have been kept.' : error.message;
    } finally {
      clearTimeout(timeout);
      sending = false;
      for (const element of elements) element.disabled = false;
      form.removeAttribute('aria-busy');
      submitButton.textContent = 'Submit deletion request';
      feedback.focus({ preventScroll: true });
      feedback.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  });
}

if (typeof document !== 'undefined') initDeletionForm();
