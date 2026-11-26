import { getContactErrors, buildContactEmail, CONTACT_EMAIL } from '../assets/contact.mjs';
import { createFormHandler } from '../lib/form-handler.mjs';

export function createContactHandler(options = {}) {
  return createFormHandler({
    ...options,
    getErrors: getContactErrors,
    buildEmail: buildContactEmail,
    successMessage: 'Thanks for getting in touch. Your message has been sent to the Onubot team. We’ll reply by email within two business days.',
    unavailableMessage: `The form is temporarily unavailable. Your message has been kept. Please try again later or email ${CONTACT_EMAIL}.`
  });
}
export default createContactHandler();
