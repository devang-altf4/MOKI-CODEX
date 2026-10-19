# MOKI video greeting

The active Flow clip is retained as `moki-welcome-woman.mp4` in this directory.
Original: `Woman_waving_and_pointing_downward_20261019142306.mp4`, supplied by the user.
Portrait 1080x1920, H.264, 24 fps, 192 frames, 8 seconds.
The previous male greeting remains as `moki-welcome.mp4` for source history.

Run `npm run prepare:concierge` with FFmpeg installed to prepare a silent,
fast-start 720px `moki-welcome-woman.mp4` and matching WebP poster in
`public/videos/concierge/` and `public/images/concierge/`. The new filenames
avoid reusing a browser-cached male greeting. Preparation preserves the frame timing and
checks that duration, frame count, and frame rate match. No colour filters
or interpolation are used. The same optimized clip appears in the compact
launcher and welcome card.

If video fails to load, a lightweight animated MOKI brand greeting appears.
Only visible media
plays; reduced-motion settings and hidden browser tabs pause playback.

This clip is prerecorded. It must not be presented as a connected team member.
No call preview or simulated connection is offered. Real availability and
calling require a separate approved integration.
