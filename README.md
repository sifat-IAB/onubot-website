# Onubot website

A responsive landing page built from the supplied CSS design handoff. No dependencies or installation required; Node.js 20+ is sufficient.

## Run locally

```sh
npm run dev
```

Open http://localhost:3000. Set `PORT` to use another port.

```sh
npm test
npm run build
```

The build produces a deployable static website in `dist/`. Upload that folder to any static hosting service.

## Deploy on Vercel

Import `sifat-IAB/onubot-website` at https://vercel.com/new. The included `vercel.json` selects the Other framework preset, runs `npm run build`, and publishes `dist/`. Use the repository root as the Root Directory. No environment variables or running Node.js server are required for the deployed static site. JavaScript modules are served with an explicit JavaScript content type, and the legal pages keep their existing `.html` URLs.

After the first deployment, pushes to the connected production branch trigger new deployments. To use `onubot.anchorblock.vc`, add it in the Vercel project's Domains settings and apply the DNS records Vercel provides after verifying the new deployment.

## Included

- Responsive navigation and layouts for phones, tablets, and desktops
- Original HTML/CSS app illustrations in place of missing exported images
- Supplied Bengali app graphic, patient film, and doctor film integrated into the page
- Optimized WebP image, 720p video copies, and lightweight video poster frames
- Scroll reveals and muted in-view playback; offscreen videos pause, and user pauses are respected
- Edge-to-edge patient and doctor films with scroll-linked parallax; the complete 16:9 video stays visible within reserved motion space
- One native video control set for playback, sound, seeking, and fullscreen; automatic playback is disabled for reduced motion and data-saving preferences
- Bilingual scripted conversation preview with quick prompts and reset
- Accessible FAQ disclosures, dialogs, keyboard focus, and reduced-motion support
- Safe text rendering for user messages; no backend, analytics, or stored messages
- Dedicated OCR clarity section with supplied prescription/result images, lazy-loaded WebP copies totaling about 62 KB, and a replayable CSS scan animation
- Interactive app journey using the exact original sign-in, patient home, and doctor desk screenshots; keyboard-accessible tabs and lightweight frame transitions
- Connected-care graphic with the actual Onubot mark, smiling doctor/patient avatars, and gentle SVG connection pulses that pause offscreen
- Complete Terms & Conditions and Privacy Policy pages extracted from the supplied PDFs, with section navigation, original PDF downloads, and footer links

## Before launch

The supplied image and both films are now used on the page. Remaining illustrative feature cards can be replaced with individual screenshots if available. Download buttons point to the Onubot Google Play listing used in the project. The supplied app Terms & Conditions and Privacy Policy are available from the footer, with their original wording and 24 November 2026 update date. Support details use the contact information in those documents.

The conversation is a clearly labeled product preview, not a live AI integration. Its responses are defined in `demo.mjs`. Connecting a real service requires a separate backend; never place API secrets in browser JavaScript.

`index.html` contains page content, `styles.css` contains all layout and responsive rules, and `app.mjs` handles browser interactions. Google Fonts has local fallback fonts if unavailable.

Media layouts live in `media.css`, and playback behavior lives in `media.mjs`. Original files in `assets/` are preserved; the page uses the smaller `onubot-overview.webp`, `patient-web.mp4`, and `doctor-web.mp4` derivatives. The local server supports byte-range video requests for seeking.

Both video figures sit outside the page's reading-width containers. Their introductions and captions remain constrained for readability. Parallax uses passive scroll listeners and one animation frame per update, batches layout reads before style writes, and turns off for reduced-motion preferences.

The media presentation uses light framing, restrained captions, and a muted hero gradient. Parallax has a small travel distance and frame-rate-independent easing, so it settles gently after scrolling. Native controls remain available without JavaScript; redundant custom control rows and overlay labels have been removed.

The OCR section lives in `ocr.css` and `ocr.mjs`. Its animation runs once after the example images are ready and the scene enters view, with a replay button. It uses only CSS transforms/opacity and a small native JavaScript controller; there are no new runtime dependencies or continuously running animation loops. Reduced-motion visitors see the static comparison. Image links open the originals, while the page loads cropped, compressed display copies. The animation illustrates the supplied example and does not run actual OCR in the browser.

`journey.css` and `journey.mjs` implement the three-view app showcase using the three exact PNG attachments saved as `assets/app-signin-original.png`, `assets/app-patient-original.png`, and `assets/app-doctor-original.png`. These are byte-for-byte copies of the attached images, with no cropping, recoloring, or recreated content. The complete status and navigation bars remain visible. Only the surrounding frames animate; the PNG files are unchanged. Images load lazily, and reduced-motion preferences disable frame animation. File sizes, dimensions, and SHA-256 digests are recorded in `docs/original-app-images.json`.

The connected-care panel uses `assets/onubot-mark.png`, extracted from the original sign-in screenshot without changing that screenshot. Its doctor and patient illustrations are inline SVG, animated with small CSS connection pulses and gentle movement. Animation pauses while the panel is offscreen or the browser tab is hidden, and reduced-motion preferences show a still graphic. No animation library, video, or new runtime dependency is required.

The chat preview uses the Onubot logo in its header and assistant avatars. Replies are short, scripted plain text in English or Bengali. The welcome message and every assistant reply include an app card linking to `#download`, where the Google Play button opens the direct app listing. Reset restores the welcome message and its card; messages are rendered as text, not HTML.

The download section now uses the latest supplied phone mockup, with its outer white background removed. `assets/onubot-phone-cutout.svg` embeds the unchanged `assets/onubot-phone-mockup-original.png` and clips only the area outside the device silhouette. This preserves the original logo, UI text, and screen colors without generative reconstruction. The mockup links directly to the app listing, and the two descriptive lines beneath the heading remain removed. The earlier Google Play screenshot is retained as an unused original asset.

`install.mjs` and `install.css` add a one-time install preview: a tap, lightweight progress animation, and transition to the exact supplied `assets/onubot-installed-original.png` screen inside the same transparent device frame. A replay button is provided. The sequence cancels when it leaves view, stops in hidden tabs, and shows the final still screen for reduced-motion preferences. It is explicitly labeled as a preview and does not install software. Both original image files remain unchanged, and no animation library is used.

Legal content lives in `terms-and-conditions.html` and `privacy-policy.html`, with independent responsive and print styles in `legal.css`. These pages work without JavaScript. The full PDF text and line metadata are saved in `docs/legal/`; unchanged source PDFs are in `assets/legal/`. `npm run legal:generate` rebuilds the pages from the extracted JSON. Tests compare every document character (ignoring layout whitespace) with the extraction, verify the source PDF hashes, and check that both pages and downloads are served correctly.

The healthcare journey section shows the exact supplied consultation prescription, patient profile, and doctor list images, in that order. Complete phone frames preserve every image's proportions with `object-fit: contain`. The phones stand directly on a white section background, with no surrounding cards, colored panels, display bases, or preview links. Captions remain beneath each phone. One-time entrance animations and gentle pointer movement live in `media.css` and `app.mjs`, with lazy-loaded images and a static reduced-motion view. `docs/capability-images.json` records the original image dimensions and SHA-256 digests. Chrome checks covered 320, 390, 768, 960, and 1440px widths, transparent phone surroundings, absence of links, overflow, and reduced-motion behavior.

The phones use CSS perspective, visible frame depth, soft shadows, and floating feature icons. Mouse movement adds bounded tilt through a small controller in `app.mjs`, scheduled only after pointer events. Touch devices retain native scrolling. Leaving a phone presentation, scrolling, hiding the tab, losing focus, or changing motion preferences clears interactive tilt. No 3D library or extra image assets are needed. Browser checks verified pointer movement in both axes, image containment at tilt extremes, reset behavior, and live reduced-motion changes.

`#patient-assistant` adds the two supplied patient conversation screenshots (Bangla health conversation, then previous-visit summary). `#doctor-assistant` adds the two doctor conversation screenshots (patient history, then schedule confirmation). Both groups reuse the open white background, complete 3D phone frames, soft reveals, bounded pointer tilt, and reduced-motion handling. They display two phones side by side on wider screens and stack below 700px, without background cards or preview links. All four original PNGs are unchanged; `docs/assistant-images.json` records their audience, dimensions, and SHA-256 digests. Chrome checks covered image grouping and order, loading, containment, no horizontal overflow or browser errors at five viewport widths, and reduced-motion behavior.

The footer includes the supplied Anchorblock logo and the attribution “Built by Anchorblock Technology Ltd.” at `#company`. The original AVIF is preserved unchanged in `assets/anchorblock-logo-main.avif`; its dimensions and source hash are recorded in `docs/company-logo.json`. The development server serves AVIF with its correct image content type. The attribution is responsive and uses the original logo proportions.

A floating “Chat with us” button and a matching footer contact open `mailto:sifat@anchorblock.vc?subject=Onubot%20enquiry`. They use the visitor's configured email application, work without JavaScript, and do not send a message automatically. The footer also displays the email address. The floating button has a visible keyboard focus state, mobile safe-area spacing, and at least a 44px touch target; extra footer spacing keeps it clear of footer links. Browser checks covered pointer and keyboard activation, recipient and subject, and layout at 320, 390, 768, and 1440px without launching an external email program.
