# Onubot responsive website

Goal: translate the supplied 1440px CSS handoff into a complete responsive landing page in this empty local workspace.

Architecture: semantic HTML, mobile-first CSS, and dependency-free browser JavaScript. Recreate absent app screenshots with accessible HTML illustrations. Keep the supplied blue/white palette, typography, section order, and available copy.

Implementation:
- Build the hero, app preview, three capability cards, tools, doctor features, privacy panel, interactive demo, download section, FAQs, and footer.
- Add keyboard-accessible mobile navigation, native FAQ disclosures, a clearly labeled scripted bilingual demo, and informational dialogs.
- Test demo input handling and language behavior with Node's test runner; verify layout and interactions in an available browser.
- Provide a zero-dependency local server, static build, and setup documentation.

Constraints: no original image assets, hero copy, exact Google Play listing, social links, or approved legal policy were supplied. Use original interface illustrations, editorial hero copy, Google Play search links, and truthful local-preview privacy information. Do not claim a real AI service is connected or provide individualized medicine doses.

Review focus: 320px layouts, navigation keyboard state, long unbroken chat input, Bengali text, and missing external assets.

## Supplied media integration

- Use `images1.png` as the main hero visual, with an optimized WebP source.
- Place the patient film in an introductory story section and the doctor film alongside the doctor features.
- Preserve the original media; serve smaller 720p H.264/AAC copies and lightweight posters.
- Add progressive scroll reveals, muted viewport playback, explicit play/pause and sound controls, offscreen pauses, and reduced-motion/data-saving handling.
- Extend the local server with proper media content types and byte-range streaming for video seeking.
- Verify playback state and seeking with five additional tests. Browser visual inspection remains unavailable because no browser or native app host is connected.

## Full-width video parallax

Both films now span the document width, outside content containers, with centered introductions above and constrained captions beneath. The 16:9 frames move vertically inside reserved padding so that the supplied artwork remains visible without cropping or distortion. Motion is updated once per animation frame and disabled for reduced-motion preferences. A geometry test verifies that the motion stays within its reserved space.

## Minimal media refinement

Simplified introductions and captions, removed duplicate controls and overlay labels, softened the hero gradient and framing, and reduced parallax travel. Native video controls provide playback, seeking, sound, and fullscreen. Exponential easing settles motion after scrolling with matching timing at different display refresh rates; two tests cover bounds and timing. Full-width video placement and original media proportions are preserved.

## OCR clarity example

Added the supplied prescription photo and review screenshot in a dedicated section after capabilities. Optimized display images total approximately 62 KB; original files are preserved and accessible by clicking each image. A one-shot, replayable scan/reveal illustration starts when the scene is visible and images are ready. It uses CSS transforms/opacity, native lazy loading, and reduced-motion handling, with no new runtime dependencies. The section explicitly describes a visual example and asks visitors to confirm extracted details with a clinician or pharmacist.

## App screen journey

Added a three-view showcase for sign-in, patient home, and doctor desk between the hero and patient film. Keyboard-accessible tabs bring each layered phone illustration to the foreground and update the explanation. The screens are responsive HTML/CSS recreations of the chat references; the original screenshot locations remain pending. Entry and switching animations use CSS transforms and opacity, respect reduced motion, and require no new runtime dependencies or image downloads.

Correction: the user requires the exact original screenshots. Removed the recreated screen markup and its styling. The app journey is hidden pending local access to those three images; no replacement screenshot assets are fabricated. Preserve the complete original files and animate only their surrounding presentation when they become available.

Resolved: recovered the exact original PNG attachment data from this conversation and saved it unchanged in `assets/app-signin-original.png`, `assets/app-patient-original.png`, and `assets/app-doctor-original.png`. Verified byte equality before recording their SHA-256 digests in `docs/original-app-images.json`. Restored the section with full, uncropped images and animations limited to the frames.

## Onubot connected-care graphic

Replaced the central shield/check illustration with the real Onubot mark extracted from the original sign-in image. Smiling SVG doctor and patient avatars connect through the logo with subtle flowing pulses, a heart, and gentle motion. The graphic pauses offscreen or in hidden tabs and becomes static for reduced-motion preferences. Original full screenshots remain unchanged.

## Chat app card

Replaced chat header and assistant icons with the actual Onubot logo. Simplified scripted replies to short plain text and included a reusable app card in the welcome message and every assistant reply. The card navigates to the download section; all store buttons use the direct Onubot Google Play listing. Reset preserves the initial card. Updated reply tests cover concise plain text, friendly general responses, and existing medicine-dose safeguards.

## Transparent download mockup

Saved the latest attached phone mockup unchanged at `assets/onubot-phone-mockup-original.png`. A built-in image-generation background-removal attempt altered fine UI details and was discarded. The final website asset is `assets/onubot-phone-cutout.svg`, a transparent device-silhouette clip embedding the exact original PNG. This removes the outer white area while preserving original screen pixels, logo, and text. Removed the extra CSS phone frame because the supplied mockup already includes one. Rendered the SVG against the site's blue background for asset QA and verified that the embedded PNG matches the original bytes.

## Installation preview

Saved the newly attached installed-app screenshot unchanged at `assets/onubot-installed-original.png`. The download phone automatically loops a short tap/progress/Open sequence inside the existing transparent frame, holds the finished screen for three seconds, and fades back before restarting. The replay control has been removed. The sequence is clearly labeled as an animation preview, cancels its timer offscreen or in a hidden tab, resumes automatically when visible, and shows a still final screen for reduced-motion preferences. Screen readers receive one static preview description instead of repeated phase announcements. The real Google Play link remains available. Four tests verify looping, cancellation during progress and the completed hold, and static completion. Rendered the final screen/frame composition for asset QA.

## Supplied legal documents

Extracted the full five-page Terms & Conditions and six-page Privacy Policy PDFs supplied on 24 November 2026. Saved the text and per-line metadata in `docs/legal/`, and preserved byte-identical PDFs in `assets/legal/` with SHA-256 provenance. Added standalone, responsive, printable HTML documents containing all 17 terms sections and 15 privacy sections, including their references. Layout-only running footers and decorative wordmark spacing are omitted from HTML; wrapped lines are rejoined without rewriting clauses. The original PDF update dates remain unchanged.

Footer links replace the old website privacy placeholder, and support information now uses the supplied contacts. The build and development server include both pages, their small independent stylesheet, and correct PDF content types. Content-fidelity and HTTP-delivery tests cover every extracted character, section/reference counts, PDF integrity, and page/download availability. No browser runtime dependency was added.

## Original images in healthcare journey cards

Replaced the three illustrative capability screens with the exact images supplied on 25 November 2026: prescription after consultation, patient profile, and doctor list. Saved unchanged attachment PNG bytes with image dimensions and SHA-256 provenance. Updated each card's text and labels to match its screen. Complete matching phone frames use proportional containment and link to the original images, without cropping their contents.

Motion reuses the existing one-time visibility observer, adding short CSS entrance sequences and hover/focus transitions. Reduced-motion preferences show static phones; no animation library or production JavaScript was added. Headless Chrome checks verified loaded original images, frame containment, no horizontal overflow, and no runtime errors at 320, 390, 768, 960, and 1440px. Inspected desktop and mobile renderings and verified reduced-motion behavior and opening the original image. All 19 existing tests, structure checks, and the production build passed. Build and localhost image bytes match the recorded source hashes.

## Dimensional healthcare journey

Added perspective phone orientations, extruded frame shadows, raised elliptical display bases, and small floating feature icons. A short native pointer controller batches geometry reads and transform updates into animation frames only when the pointer moves. It bounds additional tilt to four degrees vertically and six horizontally; resets on pointer exit, cancellation, scrolling, blur, visibility changes, and input/motion preference changes; and ignores touch pointers. Keyboard focus lifts the phone with a visible focus ring. Reduced motion shows static phones. All original screenshots and original-image links remain intact.

Chrome checks covered responsive frame containment at five widths, plus both tilt axes and all pointer extremes on each phone, pointer-exit cleanup, live reduced-motion changes, and touch fallback. Inspected desktop rendering of the platforms and frames. All 19 existing tests, structural checks, and production build passed.

## Open white presentation

Removed each healthcare journey background card, colored panel, decorative background rings, raised display base, and full-image view link. The phones and their captions now sit directly on a white section background. Preserved the original screenshots, dimensional frames, subtle shadows, floating feature icons, one-time reveals, and bounded pointer tilt. The phone presentations are noninteractive containers rather than links, and visibility reveals now use `data-reveal`.

Browser checks at 320, 390, 768, 960, and 1440px confirmed transparent surrounding containers, a white section background, no card borders/shadows or image links, no clipping or horizontal overflow, and static reduced-motion behavior. Pointer checks confirmed the 3D interaction, bounds, reset, and touch fallback still work. Inspected the desktop rendering after removing the frames and links.

## Patient and doctor assistant conversations

Saved the four newly supplied screenshots as unchanged PNG assets, with audience groups, native dimensions, and SHA-256 hashes in `docs/assistant-images.json`. Added a patient group after the everyday tools (health conversation first, visit summary second) and a doctor group after the doctor film and feature list (patient history first, schedule confirmation second). Both reuse the 3D phone presentation on white, with no background cards or preview links. Matching captions explain each screen. The two-column layout stacks below 700px, and the existing reveal and pointer controllers handle the new phones without additional JavaScript or runtime dependencies.

Browser checks confirmed exact image order and grouping, source-byte integrity, successful loading, complete image containment, dimensional transforms, no card backgrounds or links, no horizontal overflow or runtime errors at 320, 390, 768, 960, and 1440px, and static reduced-motion views. Inspected desktop and mobile renders. Pointer checks covered all seven phones. All 19 existing tests, structure checks, and the production build passed.

## Company attribution

Added the supplied Anchorblock AVIF logo and the exact company name, Anchorblock Technology Ltd., in a restrained footer attribution reading “Built by”. Preserved the source asset bytes and proportions, recorded its SHA-256 provenance, and added AVIF image MIME support to the development server. The logo is lazy-loaded and needs no new JavaScript. The credit sits beneath the Onubot brand description with a light separator and adapts for small mobile widths. The supplied legal document text remains the source for the legal pages.

Chrome checks confirmed logo loading, natural and displayed proportions, exact company text, no horizontal overflow, and no browser errors at 320, 390, and 1440px. Inspected desktop and mobile footer renders. Verified the original logo bytes and correct AVIF content type on a fresh preview server. All 19 tests, structure checks, and the production build passed.

## Email contact option

Added a floating “Chat with us” action and a footer contact link addressed to `sifat@anchorblock.vc`, with the subject “Onubot enquiry”. Both are native email links, so they work without JavaScript and open a configured email composer. The footer displays the address. Added keyboard focus styling, touch targets, safe-area positioning, reduced-motion handling, and footer clearance for the floating button.

Chrome checks at 320, 390, 768, and 1440px verified the recipient and subject, pointer and keyboard activation, accessible button dimensions, no footer obstruction or page overflow, and no runtime errors. Intercepted email-link activation during verification so no email application opened and no message was sent. Verified the same links with JavaScript disabled, inspected desktop/mobile screenshots, and passed structure checks and the production build.

## Compact video players

Changed the patient and doctor films from edge-to-edge presentations to centered players capped at 880px wide, with responsive gutters and a maximum video height of 62svh. Reduced surrounding introduction/caption spacing and motion allowance to 8px on desktop and 5px on mobile. Softly rounded player edges keep the presentation minimal. Preserved complete 16:9 artwork, all native video controls, existing in-view playback behavior, and reduced-motion/data-saving support. No video files or JavaScript behavior changed.

Chrome verified both players at 1440×900, 1280×720, 768×1024, 390×844, 320×568, and 844×390: full players fit the viewport, video proportions and containment are correct, play/pause works, and there is no horizontal overflow or runtime error. Reduced motion keeps videos paused and removes scroll transforms. Inspected desktop and mobile player screenshots. All 19 tests, structure checks, and the production build passed.

## Shared video section

Moved the existing doctor film alongside the patient film in one compact section at `#patient-story`, preserving the original anchor used by the hero. A shared heading and a two-column grid reduce duplication and page length; below 641px the films stack with a small gap. The 1040px-wide group retains responsive gutters, bounded player heights, original 16:9 artwork, and native video controls. The later doctor introduction and features remain, with no duplicate film or empty video space.

Added a direction setting to the existing parallax scene state so the two frames move subtly in opposite directions within their reserved padding. The controller still batches reads/writes, settles using the existing frame-rate-independent easing, and respects reduced motion. No new animation library or media download was added.

Chrome checks passed at six desktop, tablet, phone, and landscape sizes: exactly two films share the section, desktop columns and mobile stacking are correct, 16:9 frames remain fully visible, playback controls work, opposing scroll offsets stay within bounds, and there is no page overflow or runtime error. Reduced motion disables scrolling transforms and automatic playback. Inspected desktop/mobile renders and verified the built files match localhost. All 19 existing tests and the production build passed.
