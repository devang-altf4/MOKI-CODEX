# MOKI meeting checklist status

Audited on 2026-10-18 against the current review branch in MOKI-CODEX.
This describes the saved implementation, not a claim that the review has been
merged or deployed to production.

| Meeting requirement | Status | Verified implementation / remaining work |
| --- | --- | --- |
| Consistent original logo and wordmark colours | Partial | Light mode makes shared logos and wordmarks blue. The SVG still uses inherited `currentColor` and opacity; dark mode and some artwork use white/grey variants. Original brand colours are not yet fixed everywhere. |
| MOKI uppercase throughout | Partial | Shared logo text and many headings say MOKI. Chat headings/greetings, body copy, footer copyright, metadata, and AI instructions still include Moki. A complete naming audit remains. |
| Remove oversized footer watermark | Done locally; release pending | The oversized `.footer-word` graphic and its dedicated styles are removed. The ordinary footer logo remains. |
| Default white/light variant | Done | Light is the first-visit default, with white surfaces, charcoal text, blue controls, supplied light artwork, and a remembered theme switch. |
| Sweet, simple, sophisticated visual tone | Partial | Listed hero distractions were removed and contact actions use filled buttons. Large type, cinematic camera movement, 3D chapters, kinetic text, and animated inner-page introductions remain. The full quieter visual direction has not been applied. |
| Keep the AI chatbot for launch | Done | Gemini replies through the existing server endpoint. The inline conversation and floating contact panel share chat history. A live local reply was verified. |
| Request a Demo landing popup with database/Excel capture | Done with MongoDB locally; release pending | A once-per-visit invitation appears after eight seconds and can be reopened with a button. Both it and the contact page save validated enquiries to MongoDB Atlas and retain the optional email draft. A labelled live database save/read-back and duplicate-safe retries were verified. No meeting is booked or email sent automatically. Vercel environment/network configuration and deployed verification remain for the approved release. |
| Future live audio/video calling | Removed from launch | The simulated call screen and both entry points are removed. The prerecorded greeting, AI chat, and team contact remain. Real calling, rep availability, and routing remain future work. |

## Code evidence

- Logo shape, inherited fills, and uppercase wordmark: `src/components/Logo.tsx`.
- Shared light palette and logo treatment: `src/theme.css`; theme persistence:
  `src/components/Theme.tsx` and `index.html`.
- Remaining mixed-case copy: `src/App.tsx`,
  `src/content.ts`, `src/components/Assistant.tsx`, `index.html`, and
  `server/assistant.mjs`.
- Demo invitation and shared enquiry/email flow: `src/components/DemoRequest.tsx`,
  `LeadForm.tsx`, and `ContactPage.tsx`; privacy description: `src/App.tsx`.
- Server routes: `api/chat.mjs`, `api/leads.mjs`, `server/assistant.mjs`,
  `server/leads.mjs`, and `server/leads-store.mjs`.
- Combined welcome, AI, and team contact:
  `src/components/Concierge.tsx` and `src/concierge.css`.
- Retained cinematic motion: `src/components/ScrollMotion.tsx`,
  `Framework.tsx`, `CinematicPages.tsx`, and `SolutionExplorer.tsx`.

## Current checkpoint validation

The production build and diff checks pass. Sixteen server checks passed
with fake providers/stores. Demo and contact test enquiries were saved and read
back in Atlas; replaying the demo request did not duplicate it. The invitation,
email options, theme colours, and 320px phone form were checked in the existing tab. Responsive UI checks reused one existing browser tab,
including small phones, landscape, desktop, both themes, full-screen phone chat,
keyboard close/focus, contact navigation, reduced motion, and
native video looping while scrolling through chapters, inline chat, and footer.
The standalone Playwright suite was not launched; relevant specs were updated
and successfully enumerated. Physical-device/Safari performance is unmeasured.

The latest update removes the footer watermark, adds demo capture, and removes
the simulated call from the launch widget. Release was authorized on 2026-10-18;
Vercel configuration and production verification are pending.
It does not apply the outstanding branding, naming, quieter visual-tone, or
production-calling changes. See `docs/DEMO-CAPTURE.md` for storage and release setup.
