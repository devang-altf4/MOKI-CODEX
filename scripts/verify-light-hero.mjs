import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';

const run = promisify(execFile);
const sourcePath = 'assets-src/hero/moki-system-loop-light.mp4';
const outputPath = 'public/videos/moki-system-loop-light-flow.mp4';
const media = [], hashes = [];
for (const file of [sourcePath, outputPath]) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,duration,nb_frames', '-of', 'json', file]);
  media.push(JSON.parse(stdout).streams);
  // Compare decoded pictures, not just the MP4's stated frame rate. This catches
  // added repeats, skipped frames, scaling, colour changes, and re-encoding.
  const decoded = await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-threads', '1', '-i', file, '-map', '0:v:0', '-an', '-pix_fmt', 'rgb24', '-threads', '1', '-f', 'framemd5', '-']);
  hashes.push(decoded.stdout.split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => line.split(',').at(-1).trim()));
}
const source = media[0].find(stream => stream.codec_type === 'video');
const light = media[1].find(stream => stream.codec_type === 'video');
for (const field of ['codec_name', 'width', 'height', 'r_frame_rate', 'duration', 'nb_frames']) assert.equal(light[field], source[field], `${field} must match the supplied Flow video`);
assert.equal(light.width, 1920);
assert.equal(light.height, 1080);
assert.equal(media[1].some(stream => stream.codec_type === 'audio'), false, 'The background video must have no audio track.');
assert.equal(hashes[1].length, Number(source.nb_frames));
assert.deepEqual(hashes[1], hashes[0], 'Every decoded light-mode frame must exactly match the supplied Flow video, in order.');
const result = { sourcePath, outputPath, source, light, identicalDecodedFrames: hashes[1].length, introducedRepeatedFrames: 0, audioTracks: 0 };
await mkdir('artifacts/light-hero', { recursive: true });
await writeFile('artifacts/light-hero/verification.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
