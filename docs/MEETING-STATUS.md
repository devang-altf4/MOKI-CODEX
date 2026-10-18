# MOKI meeting checklist status

Audited on 2026-10-18 against the current review branch in MOKI-CODEX.
This describes the saved implementation, not a claim that the review has been
merged or deployed to production.

| Meeting requirement | Status | Verified implementation / remaining work |
| --- | --- | --- |
| Consistent original logo and wordmark colours | Partial | Light mode makes shared logos and wordmarks blue. The SVG still uses inherited `currentColor` and opacity; dark mode and some artwork use white/grey variants. Original brand colours are not yet fixed everywhere. |
| MOKI uppercase throughout | Partial | Shared logo text and many headings say MOKI. Chat headings/greetings, body copy, footer copyright, metadata, and AI instructions still include Moki; the large footer watermark says moki. A complete naming audit remains. |
| Remove oversized footer watermark | Pending | `Footer` still renders the large `.footer-word` graphic. |
| Default white/light variant | Done | Light is the first-visit default, with white surfaces, charcoal text, blue controls, supplied light artwork, and a remembered theme switch. |
| Sweet, simple, sophisticated visual tone | Partial | Listed hero distractions were removed and contact actions use filled buttons. Large type, cinematic camera movement, 3D chapters, kinetic text, and animated inner-page introductions remain. The full quieter visual direction has not been applied. |
| Keep the AI chatbot for launch | Done | Gemini replies through the existing server endpoint. The inline conversation and floating contact panel share chat history. A live local reply was verified. |
| Request a Demo landing popup with database/Excel capture | Pending | There is no automatic demo-capture popup or lead-storage endpoint. The contact page validates details and prepares an email draft for the visitor to send. It does not save leads or book a meeting. |
| Future live audio/video calling | Frontend demo only | The supplied prerecorded greeting loops in a fixed launcher. Phones use a 64px bubble and full-screen panel. The demo simulates connecting, call controls, ending, and replay. It accesses no devices and connects no person; real calling, rep availability, and routing remain future work. |

## Code evidence

- Logo shape, inherited fills, and uppercase wordmark: `src/components/Logo.tsx`.
- Shared light palette and logo treatment: `src/theme.css`; theme persistence:
  `src/components/Theme.tsx` and `index.html`.
- Remaining mixed-case copy and footer watermark: `src/App.tsx`,
  `src/content.ts`, `src/components/Assistant.tsx`, `index.html`, and
  `server/assistant.mjs`.
- Consultation email draft and privacy description: `ContactPage` and
  `PrivacyPage` in `src/App.tsx`.
- Current server routes: `api/chat.mjs` and `server/assistant.mjs`.
- Combined welcome, AI, team contact, and simulated call:
  `src/components/Concierge.tsx` and `src/concierge.css`.
- Retained cinematic motion: `src/components/ScrollMotion.tsx`,
  `Framework.tsx`, `CinematicPages.tsx`, and `SolutionExplorer.tsx`.

## Current checkpoint validation

The production build and diff checks pass. Eight assistant-server checks passed
with a fake provider. Responsive UI checks reused one existing browser tab,
including small phones, landscape, desktop, both themes, full-screen phone chat,
keyboard close/focus, contact navigation, demo controls, reduced motion, and
native video looping while scrolling through chapters, inline chat, and footer.
The standalone Playwright suite was not launched; relevant specs were updated
and successfully enumerated. Physical-device/Safari performance is unmeasured.

The audit records outstanding work only. It does not apply additional branding,
footer, visual-tone, lead-storage, or production-calling changes.
