// Decode sequentially: browser seeking can repeat frames at rounded timestamps.
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { createLightHeroGrade } from './lightHeroGrade.mjs';

const run = promisify(execFile), output = resolve('artifacts/light-hero');
await mkdir(output, { recursive: true });
const sourcePath = resolve('public/videos/moki-system-loop.mp4');
const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,duration,nb_frames', '-of', 'json', sourcePath]);
const source = JSON.parse(stdout).streams[0];
if (source.width !== 1920 || source.height !== 1080) throw new Error('Update the grade regions for this source composition.');
const [numerator, denominator] = source.r_frame_rate.split('/').map(Number), fps = numerator / denominator;
const expectedFrames = Number(source.nb_frames) || Math.round(Number(source.duration) * fps);
const grade = createLightHeroGrade(source.width, source.height), frameBytes = source.width * source.height * 3;
const inputFrame = Buffer.allocUnsafe(frameBytes), outputFrame = Buffer.allocUnsafe(frameBytes);
const decoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-threads', '1', '-i', sourcePath, '-map', '0:v:0', '-an', '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-threads', '1', 'pipe:1'], { stdio: ['ignore', 'pipe', 'pipe'] });
const videoOutput = resolve(output, 'movie-hd.mp4'), posterOutput = resolve(output, 'poster-hd.webp');
const encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-video_size', `${source.width}x${source.height}`, '-framerate', String(fps), '-i', 'pipe:0', '-an', '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', '-map_metadata', '-1', '-threads', '2', videoOutput], { stdio: ['pipe', 'ignore', 'pipe'] });
function completion(process) {
  let errors = '';
  process.stderr.on('data', data => { errors += data.toString(); });
  const completed = new Promise((yes, no) => { process.on('error', no); process.on('close', code => code ? no(new Error(errors)) : yes()); });
  completed.catch(() => {});
  return completed;
}
const decoded = completion(decoder), encoded = completion(encoder);
encoder.stdin.on('error', () => {}); // The write callback propagates the error.
let filled = 0, frames = 0;
try {
  for await (const chunk of decoder.stdout) {
    let offset = 0;
    while (offset < chunk.length) {
      const bytes = Math.min(frameBytes - filled, chunk.length - offset);
      chunk.copy(inputFrame, filled, offset, offset + bytes);
      filled += bytes; offset += bytes;
      if (filled !== frameBytes) continue;
      grade(inputFrame, outputFrame);
      if (frames === 0) await writeFile(resolve(output, 'first-frame-hd.rgb'), outputFrame);
      await new Promise((yes, no) => encoder.stdin.write(outputFrame, error => error ? no(error) : yes()));
      filled = 0; frames++;
      if (frames % Math.round(fps) === 0) console.log(`Graded ${frames}/${expectedFrames} original frames`);
    }
  }
  encoder.stdin.end();
  await Promise.all([decoded, encoded]);
  if (filled || frames !== expectedFrames) throw new Error(`Frame mismatch: expected ${expectedFrames}, processed ${frames}.`);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-video_size', `${source.width}x${source.height}`, '-i', resolve(output, 'first-frame-hd.rgb'), '-frames:v', '1', '-quality', '92', posterOutput]);
  await rename(posterOutput, resolve('public/images/moki-system-light-hd.webp'));
  await rename(videoOutput, resolve('public/videos/moki-system-loop-light-hd.mp4'));
  console.log(`Prepared full-resolution light hero: ${frames} sequential source frames at ${fps} fps.`);
} finally {
  if (decoder.exitCode === null) decoder.kill();
  if (encoder.exitCode === null) encoder.kill();
}
