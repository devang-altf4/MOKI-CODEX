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
- Four full-screen MOKI chapters turn scattered tasks into a connected system. Scrolling selects a chapter, then its full 24 fps video plays naturally for ten seconds. The last frame holds until the next chapter. Pause, resume, and replay controls let visitors take their time. Scrolling never seeks the video clock; offscreen and hidden scenes pause.
- Solutions, Our method, Industries, and About each open with an animated 3D film, expressive type, floating details, and scroll parallax. Service rows, industry workflows, method promises, and company values move into place as visitors explore.
- Oversized type moves in opposite directions with scrolling.
- The solutions section stays in view while its business scenarios and floating workflow cards change with the scroll. Buttons and arrow keys also select scenarios.
- The conversation section brings expressive type, moving orbital details, and an animated Gemini console into view. A shared chat dialog is available throughout the site.
- Reduced-motion preferences provide compact sections, still visuals, and manual controls.
- The optional live Three.js scene lets visitors compare scattered and connected systems.

The selected type direction is **A — Bold + expressive**: Barlow Condensed headlines and Cormorant Garamond italic accents, with DM Sans body text. `/type-study` retains the visual comparison.

## Content and source

- Routes: `/`, `/solutions`, `/how-it-works`, `/industries`, `/about`, `/contact`, `/privacy`.
- Company content and nine services: `src/content.ts`.
- Assistant UI and shared conversation: `src/components/Assistant.tsx`.
- Gemini endpoint, company grounding, validation, request limits, and timeouts: `server/assistant.mjs`.
- Scroll scenes: `src/components/ScrollMotion.tsx`, `Framework.tsx`, `MethodFilm.tsx`, `CinematicPages.tsx`, and `SolutionExplorer.tsx`.
- Original supplied hero media: `assets-src/hero/`. Optimized public copies: `public/images/` and `public/videos/`.
- Original method footage: `assets-src/method/`. Full-rate, optimized desktop/mobile videos: `public/videos/method/`; still fallbacks: `public/images/method/`. Run `npm run prepare:chapters` with FFmpeg installed to regenerate these assets. The old sampled frames in `public/film/` are retained as reference; the website no longer downloads or renders them.
- Reference business brief: `docs/client-brief.txt`. Client screenshot updates add website development, SEO, and the public contact email.

## Verify

```powershell
npm run build
npm run test:server
npm test
```

Browser tests start the local server automatically or reuse one already running. Windows tests use installed Chrome when available. On other systems, run `npx playwright install chromium` first; `PLAYWRIGHT_CHROME_PATH` can point to another installed Chrome binary.

The suite covers navigation, services, enquiry drafts, responsive layouts, reduced motion, chapter selection in both directions, actual video frame cadence, playback controls, all four animated inner pages, the moving solutions/conversation sections, chat history, retry behavior, and modal navigation. Server tests cover raw Node requests and Vercel parsed bodies, use a fake provider, and do not spend Gemini quota. Browser chat tests mock the endpoint. A separate live request was verified locally with the configured Gemini key.

Generated screenshots and reports stay local in ignored `artifacts/` and `playwright-report/` folders.

## Public launch

### Vercel client demo

Import the private GitHub repository using Vercel's **Vite** preset. `vercel.json` supplies the build settings and SPA route fallback; `api/chat.mjs` exposes the server-side Gemini handler. See [Vercel's Vite guide](https://vercel.com/docs/frameworks/frontend/vite) and [Node function runtime](https://vercel.com/docs/functions/runtimes/node-js).

Add `GEMINI_API_KEY` to the Vercel project's environment variables before deploying; `.env.local` is intentionally absent from GitHub. Optionally set `GEMINI_MODEL=gemini-2.5-flash`. For a fixed production domain, set `PUBLIC_ORIGIN` to its exact HTTPS origin, without a trailing slash. For varying preview domains, leave `PUBLIC_ORIGIN` unset to use same-host validation. After deployment, verify direct visits to `/solutions` and `/about` and send a test chat message. These hosting checks require a real Vercel deployment and have not been performed locally.

The consultation form prepares an email draft for the visitor to send. Email delivery, a booking calendar, and CRM integrations still need the client's configuration. No analytics or tracking is installed.

Chat messages are sent to Google Gemini; the website does not persist transcripts. Request limits are held in process memory and are not shared across serverless instances. Configure provider budget controls and shared rate limits appropriate to the public hosting/proxy setup. A static-file-only host cannot run the Gemini endpoint. Vite preview is for checking the built site locally.

Search indexing is disabled for this preview in `index.html` and `public/robots.txt`. Configure the real domain, social metadata, indexing, and hosting route fallbacks before an approved public release.

This project was built independently in `D:\coding\MOKI-CODEX`; the original `D:\coding\MOKI` source was preserved.
