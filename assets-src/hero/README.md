# Moki hero media

The approved light-mode Flow clip supplied on 17 October 2026 is saved as `moki-system-loop-light.mp4`. Its original download was `Make_light_mode_color_version_20261017193204.mp4`.

Run `npm run prepare:light-hero` to copy its video stream into the public light-mode MP4 without re-encoding or colour conversion, remove audio, enable fast-start playback, and create a matching WebP poster. Run `npm run verify:light-hero` to check that every decoded public frame exactly matches this source. The dark media below remains separate.

## Phone hero variants

Run `npm run prepare:mobile-hero` to prepare separate 1280x720 H.264 clips and
matching posters for both themes. The source files above remain intact. The
smaller clips preserve all 240 frames, 24 fps, and the ten-second duration;
they remove audio and need no runtime colour filters. Decoding uses 56% fewer
pixels than 1920x1080. Desktop and About keep the full-HD media.

The phone hero uses translation with a small scale change, static edge fades,
and normal video compositing. The next 3D scene loads closer to its entrance
so its setup does not compete with the opening transition.

## Original dark artwork prompts

The website is being built with existing assets and live 3D. These new media are optional; you do not need to wait for them to preview the website.

Save your approved image here as `moki-system-still.png`.
Save the matching Flow video here as `moki-system-loop.mp4`.

Full save location: `D:\coding\MOKI-CODEX\assets-src\hero\`

Use the existing image `D:\coding\MOKI\assets-src\keyframes\img5.png` as the shape and blue material reference. Keep this new artwork separate from the supplied brand logo.

## Image prompt — ChatGPT Images or Antigravity

Create one premium cinematic 3D brand illustration, landscape 16:9, at least 1920 × 1080. Use the attached blue Moki M image as the exact silhouette and colour reference for the central object.

A large sculptural M made from satin cobalt aluminium floats at the centre of a near-black graphite void. Preserve the M's angular silhouette and central fold exactly. Its front left face is rich electric cobalt, its right face deep navy, with precise subtly bevelled edges. A thin brushed silver elliptical orbital ring passes behind the M, tilted diagonally. Five small graphite ceramic business objects float around it at different depths: an envelope, a calendar tile, a document, a chat bubble, and a miniature bar chart. Each object has shallow geometric embossed details. Fine restrained blue paths connect them into one purposeful coordinated system. This should feel like luxury industrial product photography, tactile and physically lit, not a futuristic interface.

Lighting: a large softbox above camera left, a narrow cool rim light, soft realistic shadows, a restrained cobalt reflection on the surrounding objects. Composition: all objects in the central 65 percent of the frame, comfortable dark breathing room around them; clean pure dark background (#080a0f), no horizon or floor. Camera: 70 mm product lens, slight three-quarter view, mostly sharp with a little foreground depth. Crisp materials, sophisticated contrast, subtle film grain.

No words, typography, numbers, UI panels, watermarks, other logos, people, robots, brains, office scenes, rainbow gradients, lens flares, or excessive glow. The M must remain recognizably the supplied Moki mark.

## Google Flow prompt — use the approved image as reference

Animate this exact supplied image into an 8-second seamless silent product film. Keep the exact M geometry, graphite objects, blue materials, lighting, background, composition and camera perspective. The M slowly rotates through just 5 degrees then returns to its original orientation. The thin silver ring makes a slow subtle orbital movement. The five business objects drift with tiny deliberate motion, never crossing or morphing into the M. A gentle blue pulse travels once along the existing connections. Nearly locked camera with only a very slight breathing push-in, returning to the starting composition at the end. Quiet, premium, physical, precise. First and last frames must match for a seamless loop. No added elements, cuts, text, shape changes, sparks, exaggerated glow, or audio.

Export the original 16:9 file at 1080p or higher; do not add captions. Share the save location after the files are ready, and they can be reviewed and integrated.
