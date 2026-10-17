// Keep the supplied Flow frames intact. Only remove audio and move the MP4
// index to the front for playback; there is no colour conversion or re-encode.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';

const run = promisify(execFile);
const sourcePath = resolve('assets-src/hero/moki-system-loop-light.mp4');
const temporary = resolve('artifacts/light-hero');
await mkdir(temporary, { recursive: true });
const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,duration,nb_frames', '-of', 'json', sourcePath]);
const source = JSON.parse(stdout).streams[0];
assert.equal(source.codec_name, 'h264', 'The supplied clip must support native H.264 playback.');
assert.equal(source.width, 1920);
assert.equal(source.height, 1080);

const film = resolve(temporary, 'flow-light.mp4'), poster = resolve(temporary, 'flow-light.webp');
await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', sourcePath, '-map', '0:v:0', '-c:v', 'copy', '-an', '-map_metadata', '-1', '-movflags', '+faststart', film]);
await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-threads', '1', '-i', film, '-frames:v', '1', '-quality', '95', '-threads', '1', poster]);
await rename(poster, resolve('public/images/moki-system-light-flow.webp'));
await rename(film, resolve('public/videos/moki-system-loop-light-flow.mp4'));
console.log(`Prepared supplied Flow artwork: ${source.width}x${source.height}, ${source.r_frame_rate} fps, ${source.nb_frames} original frames. No re-encoding or colour filters.`);
