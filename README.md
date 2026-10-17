# Moki Systems

A cinematic business website with scroll-driven 3D scenes, expressive typography, an interactive solutions walkthrough, and a Gemini assistant.

## Run locally

Requires Node.js 22 or newer.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Add your Gemini key to `.env.local` before starting. Open **http://127.0.0.1:4173/** and scroll from the top. `.env.local` is ignored by Git. Never place the API key in a `VITE_` variable or frontend code.

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

The `/api/chat` handler runs on the server in both the development server and `npm run preview`. The browser sends messages to this same-origin endpoint; the handler calls Google using a server-side credential. The assistant uses the verified Moki company brief, keeps recent conversation context, and links to relevant services. It cannot book meetings or send enquiries.

## Experience

- Scroll holds the opening scene in place, enlarges and rotates it, and reveals “One connected business.”
- The full-screen MOKI method is a live 3D transformation. Tools organize into a grid, connect, and reveal the Moki mark during one continuous camera journey: right to center, center to left, left to right, then right to center. Longer scroll travel, damping, and a maximum animation speed keep wheel and touch jumps from skipping immediately to the next pose. Text reveals and the camera reverse with scrolling. Tapping a tab enters its chapter directly. Drawing stops when the pose settles or the section is offscreen. A CSS 3D fallback follows the same poses if WebGL cannot load.
- Solutions, Our method, Industries, and About each open with an animated 3D film, expressive type, floating details, and scroll parallax. Service rows, industry workflows, method promises, and company values move into place as visitors explore.
- Oversized type moves in opposite directions with scrolling.
- On desktop, the solutions section stays in view while its scenarios and workflow cards change with scrolling. Phone layouts use normal document flow, bounded moving cards, and manual scenario tabs so every example remains accessible on short screens.
- The conversation section brings expressive type, moving orbital details, and an animated Gemini console into view. A shared chat dialog is available throughout the site.
- Reduced-motion preferences provide compact sections, still visuals, and manual controls.
- The opening keeps one film without presentation-mode controls or extra helper captions. Contact and discovery-call actions use filled buttons.
- First visits use a white-and-blue light theme. The sun/moon button in the navigation switches themes and remembers the choice locally. It also works when browser storage is blocked. Theme changes update the existing method scene in place without resetting its scroll position or rebuilding WebGL.
- Phone layouts reserve separate space for chapter headings, 3D scenes, copy, and tabs. Larger body text and touch targets, stacked inner-page introductions, a compact chat launcher, and landscape layouts keep content and controls accessible.

The selected type direction is **A — Bold + expressive**: Barlow Condensed headlines and Cormorant Garamond italic accents, with DM Sans body text. `/type-study` retains the visual comparison.

## Content and source

- Routes: `/`, `/solutions`, `/how-it-works`, `/industries`, `/about`, `/contact`, `/privacy`.
- Company content and nine services: `src/content.ts`.
- Assistant UI and shared conversation: `src/components/Assistant.tsx`.
- Theme preference and palette: `src/components/Theme.tsx`, `src/theme.css`; `index.html` applies the saved choice before the page paints.
- Gemini endpoint, company grounding, validation, request limits, and timeouts: `server/assistant.mjs`.
- Scroll scenes: `src/components/ScrollMotion.tsx`, `Framework.tsx`, `MethodScene.tsx`, `MethodStage.tsx`, `methodMotion.ts`, `CinematicPages.tsx`, and `SolutionExplorer.tsx`.
- Original supplied hero media: `assets-src/hero/`. Optimized public copies: `public/images/` and `public/videos/`.
- Footage used on the inner-page introductions: `assets-src/method/`. Full-rate, optimized desktop/mobile videos: `public/videos/method/`; still fallbacks: `public/images/method/`. Run `npm run prepare:chapters` with FFmpeg installed to regenerate these assets. The old sampled frames in `public/film/` are retained as reference; the website no longer downloads or renders them.
- Reference business brief: `docs/client-brief.txt`. Client screenshot updates add website development, SEO, and the public contact email.

## Verify

```powershell
npm run build
npm run test:server
npm test
```

Browser tests start the local server automatically or reuse one already running. Windows tests use installed Chrome when available. Run `npx playwright install ffmpeg` once to enable the recorded scrolling preview. On other systems, run `npx playwright install chromium ffmpeg` first; `PLAYWRIGHT_CHROME_PATH` can point to another installed Chrome binary.

The suite covers navigation, services, enquiry drafts, responsive layouts, reduced motion, chapter selection in both directions, actual 3D pixel changes, restoration of the same pose on reverse scrolling, directional camera travel, large scroll jumps, continuous-scroll performance, CSS fallback motion, all four animated inner pages, the moving solutions/conversation sections, chat history, retry behavior, and modal navigation. Phone checks include text/scene/control separation, tap targets, persistent manual solution selection, inner pages, forms, chat, and landscape. Server tests use a fake provider; browser chat tests mock the endpoint. Neither spends Gemini quota. A separate live request was verified locally with the configured Gemini key.

Generated screenshots and reports stay local in ignored `artifacts/` and `playwright-report/` folders.

## Public launch

### Vercel client demo

Import the private GitHub repository using Vercel's **Vite** preset. `vercel.json` supplies the build settings and SPA route fallback; `api/chat.mjs` exposes the server-side Gemini handler. See [Vercel's Vite guide](https://vercel.com/docs/frameworks/frontend/vite) and [Node function runtime](https://vercel.com/docs/functions/runtimes/node-js).

Add `GEMINI_API_KEY` to the Vercel project's environment variables before deploying; `.env.local` is intentionally absent from GitHub. Optionally set `GEMINI_MODEL=gemini-2.5-flash`. For a fixed production domain, set `PUBLIC_ORIGIN` to its exact HTTPS origin, without a trailing slash. For varying preview domains, leave `PUBLIC_ORIGIN` unset to use same-host validation. After deployment, verify direct visits to `/solutions` and `/about` and send a test chat message. These hosting checks require a real Vercel deployment and have not been performed locally.

The consultation form prepares an email draft for the visitor to send. Email delivery, a booking calendar, and CRM integrations still need the client's configuration. No analytics or tracking is installed.

Chat messages are sent to Google Gemini; the website does not persist transcripts. Request limits are held in process memory and are not shared across serverless instances. Configure provider budget controls and shared rate limits appropriate to the public hosting/proxy setup. A static-file-only host cannot run the Gemini endpoint. Vite preview is for checking the built site locally.

Search indexing is disabled for this preview in `index.html` and `public/robots.txt`. Configure the real domain, social metadata, indexing, and hosting route fallbacks before an approved public release.

This project was built independently in `D:\coding\MOKI-CODEX`; the original `D:\coding\MOKI` source was preserved.
