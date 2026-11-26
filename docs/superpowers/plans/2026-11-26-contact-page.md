# Contact Page Implementation Plan

**Goal:** Add the supplied contact-page design with a working, accessible message form.

**Architecture:** A standalone `contact.html` page uses scoped CSS and a small browser module. A contact API uses the existing SMTP transport and shares the deletion endpoint's request protections without changing deletion behavior.

**Tech stack:** Static HTML/CSS, native JavaScript modules, Node.js, Nodemailer, Vercel functions.

**Design:** Match the reference's warm off-white canvas, teal icons, four contact cards, social row, feedback panel, and white form. Use the original Onubot logo, existing type family, and an understated home link. The desktop columns become one column on mobile. Keep unknown social destinations disabled and route feedback into this form rather than inventing a feedback URL. Default to the existing contact mailbox unless the user specifies another.

**Alternatives:** A mailto-only form opens drafts and does not deliver directly. A third-party form service introduces another provider. Reusing the existing SMTP service supports direct delivery within the current deployment.

**Constraints:** No new runtime dependencies; no credential exposure; no automatic real test email; no false delivery confirmation. Preserve original screenshots, legal text, and deletion behavior. Do not publish unless requested.

## Tasks

- [x] Add meaningful failing tests for contact validation, fixed-recipient delivery, unavailable SMTP, rejected mail, request limits, and local routing.
- [x] Implement contact data/browser controller and a shared protected form handler; adapt deletion and add contact endpoint. Keep existing deletion tests green.
- [x] Build `contact.html` and `assets/contact.css` to match the reference; add keyboard, loading, error, and success states with reduced-motion support.
- [x] Connect homepage contact actions, static server, build, site checks, Vercel function configuration, and documentation.
- [x] Verify unit/API tests, build, local links, mobile/desktop visuals, keyboard flow, feedback shortcut, and mocked successful/failed submissions.

## Review focus

- Duplicate submits must send once; failed requests keep form text.
- A visitor cannot override the recipient or inject email headers.
- Success requires provider acceptance; missing SMTP credentials remain an honest failure.
- Small screens retain readable text, visible focus, and complete cards without horizontal scrolling.
- Unknown social profiles remain placeholders; footer/contact links navigate to the new page.

## Verification

All 51 tests pass, including nine new contact tests and the unchanged deletion cases. Site checks cover all five pages; the production build succeeds. Chrome checks covered eight desktop, tablet, mobile, and landscape sizes without horizontal overflow or browser errors. Form validation, focus, feedback prefill, duplicate-submit prevention, mocked success/failure, preserved entries, homepage navigation, and the no-JavaScript email alternative passed. Private server files return 404.

Live SMTP is still unconfigured locally. Delivery is implemented and tested through an injected mail transport; no actual test email was sent. The contact mailbox defaults to the established `sifat@anchorblock.vc` because no alternate recipient was supplied. New changes remain local.
