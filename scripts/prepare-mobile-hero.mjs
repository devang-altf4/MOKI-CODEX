import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';

const run = promisify(execFile);
const probe = async path => JSON.parse((await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,nb_frames,duration', '-show_entries', 'format=size', '-of', 'json', path])).stdout);
await mkdir('public/videos', { recursive: true });
await mkdir('public/images', { recursive: true });

for (const [source, variant] of [['assets-src/hero/moki-system-loop.mp4', ''], ['assets-src/hero/moki-system-loop-light.mp4', '-light-flow']]) {
  const film = `public/videos/moki-system-loop${variant}-mobile.mp4`;
  const poster = `public/images/moki-system${variant}-mobile.webp`;
  // Preserve the supplied motion and colour. Decode 56% fewer pixels on phones.
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-map', '0:v:0', '-an', '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-profile:v', 'main', '-level:v', '3.1', '-preset', 'slow', '-crf', '18', '-g', '48', '-threads', '2', '-pix_fmt', 'yuv420p', '-map_metadata', '-1', '-movflags', '+faststart', film]);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.2', '-i', film, '-frames:v', '1', '-quality', '94', '-threads', '1', poster]);
  const original = await probe(source), output = await probe(film);
  const before = original.streams.find(stream => stream.codec_type === 'video');
  const after = output.streams.find(stream => stream.codec_type === 'video');
  assert.equal(after.width, 1280);
  assert.equal(after.height, 720);
  assert.equal(after.r_frame_rate, before.r_frame_rate);
  assert.equal(after.nb_frames, before.nb_frames);
  assert.ok(Math.abs(Number(after.duration) - Number(before.duration)) < .01);
  assert.ok(!output.streams.some(stream => stream.codec_type === 'audio'));
  console.log(`${variant ? 'Light' : 'Dark'} mobile hero: ${after.width}x${after.height}, ${after.nb_frames} frames at ${after.r_frame_rate} fps, ${output.format.size} bytes, no audio.`);
}
