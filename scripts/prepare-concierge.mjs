import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';

const run = promisify(execFile);
const source = 'assets-src/concierge/moki-welcome.mp4';
const film = 'public/videos/concierge/moki-welcome.mp4';
const poster = 'public/images/concierge/moki-welcome.webp';
await mkdir('public/videos/concierge', { recursive: true });
await mkdir('public/images/concierge', { recursive: true });
// A small card needs no more than 720px. Keep the source frame timing and colour;
// remove the audio so a decorative greeting cannot play unexpected sound.
await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-map', '0:v:0', '-an', '-vf', 'scale=min(720\\,iw):-2:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-threads', '2', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', film]);
await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.2', '-i', film, '-frames:v', '1', '-quality', '92', '-threads', '1', poster]);
const probe = async path => JSON.parse((await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,nb_frames,duration', '-show_entries', 'format=size', '-of', 'json', path])).stdout);
const original = await probe(source), output = await probe(film);
const before = original.streams.find(stream => stream.codec_type === 'video');
const after = output.streams.find(stream => stream.codec_type === 'video');
if (before.nb_frames !== after.nb_frames || before.r_frame_rate !== after.r_frame_rate || Math.abs(Number(before.duration) - Number(after.duration)) > .01 || output.streams.some(stream => stream.codec_type === 'audio')) throw Error('The greeting frame timing or audio validation failed.');
console.log(`Greeting prepared: ${after.width}x${after.height}, ${after.nb_frames} frames at ${after.r_frame_rate} fps, ${output.format.size} bytes, no audio. Original retained.`);
