# MOKI video greeting

The supplied Flow clip is retained as `moki-welcome.mp4` in this directory.
Original: `Man_waving_and_pointing_downward_20261018164354.mp4`, supplied by the user.
Portrait 1080x1920, H.264, 24 fps, 163 frames, approximately 6.79 seconds.

Run `npm run prepare:concierge` with FFmpeg installed to prepare a silent,
fast-start 720px MP4 and matching WebP poster in `public/videos/concierge/`
and `public/images/concierge/`. It preserves the original frame timing and
checks that duration, frame count, and frame rate match. No colour filters
or interpolation are used. The same optimized clip appears in the compact
launcher, welcome card, and explicitly labelled demo call.

If video fails to load, a lightweight animated MOKI brand greeting appears.
Only visible media
plays; reduced-motion settings and hidden browser tabs pause playback.

This clip is prerecorded. It must not be presented as a connected team member.
The demo call accesses no devices and connects to no person or call service.
Real availability and calling require a separate approved integration.
