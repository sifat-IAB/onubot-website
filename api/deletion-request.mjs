import { getDeletionErrors, buildDeletionEmail } from '../assets/deletion.mjs';
import { createFormHandler } from '../lib/form-handler.mjs';

export function createDeletionHandler(options = {}) {
  return createFormHandler({
    ...options,
    getErrors: getDeletionErrors,
    buildEmail: buildDeletionEmail,
    successMessage: 'Your deletion request has been sent to admin@anchorblock.vc. Our team will verify account ownership before processing it and will email you when it is complete.',
    unavailableMessage: 'Submission is temporarily unavailable. Please try again later or contact admin@anchorblock.vc.'
  });
}
export default createDeletionHandler();
