# Onubot website

A responsive landing page built from the supplied CSS design handoff. Use Node.js 20.12+ and run `npm install`; Nodemailer handles server-side delivery of deletion requests.

`assets/typography.css` sets a shared reading scale after the section styles: 15–16px main copy, 12–13px captions and labels, and 16px Bengali chat and form text. It also adjusts spacing for the larger text, keeps app cards compact and footer actions in their requested rows, and switches to the menu at tablet widths. Legal document body text is 16px in `legal.css`. The original app screenshots remain unchanged.

The home-page header spans the viewport and stays fixed at the top. Its shared responsive height controls both the page’s top spacing and anchor offset, keeping navigation destinations visible below it. The mobile menu scrolls within the available screen height.

The home page follows a shorter flow: hero, three benefits, a shared patient/doctor app showcase, OCR comparison, paired videos, chat preview, download, and FAQ/footer. Soft blue, lavender, and mint cards sit alongside white phone presentations. `assets/refresh.css` supplies the final visual layer: a light hero, clearer heading hierarchy, consistent spacing, subtle depth, and responsive layouts.

The patient/doctor showcase keeps all ten original app screenshots available in one section. Tabs, screen buttons, previous/next arrows, keyboard navigation, a mobile selector, and touch swipes change the selected image. Each audience remembers its selected screen. Phones use CSS perspective and shadows with uncropped, proportional screenshots; reduced-motion settings remove transitions. The initial images load lazily, and later selections decode before appearing. `assets/showcase.mjs` contains the screen data and controller. Original image hashes remain recorded in `docs/original-app-images.json`, `docs/capability-images.json`, and `docs/assistant-images.json`.

The chat initially shows both supplied questions with shorter answers, one example doctor, and one compact app link. “Read full” reveals the original full conversation and three example doctors; “Show less” restores the short version without removing later visitor messages. Reset restores the initial four messages. Both modes flow naturally in the page without an inner scrollbar. The chat remains a scripted product preview, with clear sample-doctor labeling and no live AI connection. Main copy is 15–16px, labels are at least 12px, and Bengali text is 16px.

The fixed header keeps anchor destinations visible. Homepage contact actions lead to `contact.html`; the desktop floating contact hides while the chat or footer is visible. Facebook links to the supplied official page, while Instagram remains a labeled placeholder. The footer keeps four legal/contact actions together and Google Play on its own row. Repeated download badges and presentation notes have been removed.

## Contact page

`contact.html` follows the supplied reference: a warm off-white background, four contact cards, social links, an app-feedback shortcut, and a white message form. Scoped styles are in `assets/contact.css`, and the form controller and validation are in `assets/contact.mjs`. The desktop columns stack on mobile; controls support keyboard focus and reduced motion. Only the supplied Facebook profile is active; the other social profiles are labeled placeholders. App feedback focuses and prefills the same form.

Messages post to `/api/contact` and use the existing SMTP configuration below to reach **sifat@anchorblock.vc**, with the visitor's email as Reply-To. `lib/form-handler.mjs` shares body limits, validation, origin checks, honeypot handling, rate limits, and provider-acceptance checks with the deletion endpoint. Success requires mail acceptance; failed submissions retain the visitor's text. Live delivery needs valid SMTP credentials. No external email application opens when submitting the form, and no real email is sent by automated tests.

`delete-account.html` is linked from the footer’s “Delete Account & Data” action. It includes the supplied deletion, retention, identity-verification, and 30-day processing information, plus a validated form for full-account or specific-data requests. Submitting posts JSON to `/api/deletion-request`; the server sends a plain-text email directly to **admin@anchorblock.vc** with the subject “Data deletion request”. The submitted account email is used as Reply-To, and the recipient cannot be overridden by the visitor. The form opens no email application and shows success only after SMTP acceptance. Errors keep the entered fields available for retry. Requests do not delete account data automatically. Original PDF policy text remains intact.

The handlers in `api/deletion-request.mjs` and `api/contact.mjs` work in the local server and as Vercel Node.js functions. They validate requests, limit payload size, reject cross-site submissions, and apply a honeypot plus per-instance rate limiting. SMTP credentials and server code are excluded from the public static build. Form contents and raw SMTP errors are not logged.

### Mail configuration

Google Workspace SMTP defaults for the supplied domain are in `.env.example`. The local server reads `.env.local` on startup; restart it after changing that file. Set these same server-side environment variables in the Vercel project before deploying:

- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `465`
- `SMTP_USER`: `admin@anchorblock.vc`
- `SMTP_FROM`: `Onubot <admin@anchorblock.vc>`
- `SMTP_PASS`: the mailbox’s app password or the authenticated SMTP provider’s password

The password is deliberately blank in the template and local setup. Delivery is unavailable until valid mail credentials are configured; the form reports a failure rather than confirming an unsent request. Keep credentials out of browser code and Git. Another SMTP provider can be used by changing these values. See [Nodemailer SMTP configuration](https://nodemailer.com/smtp) and [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js).

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Set `PORT` to use another port.

```sh
npm test
npm run build
```

The build produces the public website in `dist/`. The deletion form also requires the server endpoint; uploading only `dist/` to a static-only host will not enable email submission.

## Deploy on Vercel

Import `sifat-IAB/onubot-website` at https://vercel.com/new. The included `vercel.json` selects the Other framework preset, runs `npm run build`, and publishes `dist/`. Use the repository root as the Root Directory so Vercel also builds `api/deletion-request.mjs`. Configure the SMTP environment variables above for direct email delivery. Vercel runs the server function; a separate persistent Node.js server is unnecessary. JavaScript modules are served with an explicit JavaScript content type, and the legal pages keep their existing `.html` URLs.

After the first deployment, pushes to the connected production branch trigger new deployments. To use `onubot.anchorblock.vc`, add it in the Vercel project's Domains settings and apply the DNS records Vercel provides after verifying the new deployment.

## Media and interactions


- The supplied overview image and two films are preserved, with optimized WebP, 720p video copies, and lightweight posters used for display.
- Both complete 16:9 videos appear once in `#patient-story`, side by side on larger screens and stacked on phones. Native controls support playback, sound, seeking, and fullscreen. Gentle opposing parallax is bounded to 8px on desktop and 5px on mobile. Playback pauses offscreen; reduced-motion and data-saving preferences disable automatic playback.
- The dedicated OCR comparison uses the supplied prescription/result assets with a small CSS scan animation and replay control. It illustrates the example rather than performing OCR in the browser. Reduced-motion visitors see a still comparison.
- The connected-care graphic uses the real Onubot mark and smiling doctor/patient illustrations. Its lightweight connection pulses pause offscreen and when the tab is hidden.
- The download section uses the original phone cutout and installed-app screen with glass, depth, and soft shadows. Its automatic install preview loops while visible, has no replay button, and holds a still completed screen for reduced motion. Google Play links open the actual app listing.
- Menu controls, gallery controls, FAQ disclosures, and forms support keyboard focus. All user chat content is rendered with `textContent`; demo messages stay in the page.

## Legal content and attribution

Terms & Conditions and Privacy Policy pages contain the full text extracted from the supplied PDFs, with section navigation and original PDF downloads. Independent responsive and print styles live in `legal.css`. The extraction is in `docs/legal/` and source PDFs in `assets/legal/`. Tests compare the policy text with the extraction and verify the source hashes. `npm run legal:generate` regenerates the pages.

The footer displays the supplied Anchorblock logo and “Built by Anchorblock Technology Ltd.” The original company AVIF remains unchanged; `docs/company-logo.json` records its hash. “Chat with us” and footer contact links open the contact page, which also offers a direct email link. The account-deletion form uses the separate server endpoint described above.

## Project structure and validation

`index.html` contains page content; `styles.css` and section styles establish the base layout. `assets/typography.css` and `assets/refresh.css` supply the final reading scale and visual refinements. `app.mjs` coordinates browser interactions, `demo.mjs` defines sample replies, and the media/OCR/install modules control their respective previews. Legacy `journey.css` and `journey.mjs` remain in the repository but are no longer loaded by the homepage.

Run `npm run check` for local links, anchors, and page structure; `npm test` covers conversation modes, gallery grouping and original image hashes, video/install behavior, legal documents, deletion validation, and the server endpoint. `npm run build` produces the public assets. Google Fonts has local fallback fonts if unavailable.
