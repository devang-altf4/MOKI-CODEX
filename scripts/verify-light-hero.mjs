import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const run = promisify(execFile);
await mkdir('artifacts/light-hero', { recursive: true });
const files = ['public/videos/moki-system-loop.mp4', 'public/videos/moki-system-loop-light-hd.mp4'];
const streams = [], differences = [];
for (const [index, file] of files.entries()) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,duration,nb_frames', '-of', 'json', file]);
  streams.push(JSON.parse(stdout).streams[0]);
  const stats = `artifacts/light-hero/frame-differences-${index}.txt`;
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-threads', '1', '-i', file, '-vf', `scale=320:180,signalstats,metadata=print:file=${stats}`, '-an', '-threads', '1', '-f', 'null', '-']);
  differences.push([...((await readFile(stats, 'utf8')).matchAll(/lavfi.signalstats.YDIF=([0-9.]+)/g))].map(match => Number(match[1])));
}
for (const field of ['width', 'height', 'r_frame_rate', 'duration', 'nb_frames']) assert.equal(streams[1][field], streams[0][field], `${field} must match the dark original`);
assert.equal(differences[1].length, Number(streams[0].nb_frames));
const repeatedFrames = [];
// Browser-seek captures previously froze every third frame while keeping 24fps
// container metadata. Compare real picture changes, not just playback counters.
for (let frame = 1; frame < differences[0].length; frame++) if (differences[0][frame] >= .03 && differences[1][frame] < .03) repeatedFrames.push(frame);
assert.deepEqual(repeatedFrames, [], 'Light export contains nearly frozen frames absent from the source');
const result = { source: streams[0], light: streams[1], nearlyRepeatedFrames: repeatedFrames.length };
await writeFile('artifacts/light-hero/verification.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
