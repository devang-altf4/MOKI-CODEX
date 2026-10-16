import { mkdir, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const names = ['c1-map', 'c2-optimize', 'c3-kit', 'c4-integrate'];
const sourceRoot = 'assets-src/method';
const outputRoot = 'public/videos/method';
const posterRoot = 'public/images/method';
await Promise.all([sourceRoot, outputRoot, posterRoot].map(path => mkdir(path, { recursive: true })));
if (process.argv[2]) for (const name of names) await copyFile(join(process.argv[2], `${name}.mp4`), join(sourceRoot, `${name}.mp4`));
function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let error = '';
    process.stderr.on('data', data => { error += data.toString(); });
    process.on('error', reject);
    process.on('close', code => code ? reject(new Error(error)) : resolve());
  });
}
for (const [index, name] of names.entries()) {
  const source = join(sourceRoot, `${name}.mp4`);
  const center = index < 2 ? .63 : .5, endCenter = index === 0 ? .63 : .5;
  const crop = `crop=w=ih:h=ih:x='max(0,min(iw-ow,(${center}+${endCenter - center}*n/239)*iw-ow/2))':y=0,scale=720:720`;
  const options = ['-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-map_metadata', '-1', '-threads', '3'];
  await Promise.all([
    ffmpeg(['-i', source, '-vf', 'scale=1440:810', ...options, join(outputRoot, `${name}.mp4`)]),
    ffmpeg(['-i', source, '-vf', crop, ...options, join(outputRoot, `${name}-mobile.mp4`)]),
  ]);
  await Promise.all([
    ffmpeg(['-i', source, '-frames:v', '1', '-vf', 'scale=1440:810', '-quality', '80', join(posterRoot, `${name}.webp`)]),
    ffmpeg(['-i', source, '-frames:v', '1', '-vf', crop, '-quality', '80', join(posterRoot, `${name}-mobile.webp`)]),
    ffmpeg(['-ss', '9.95', '-i', source, '-frames:v', '1', '-vf', 'scale=1440:810', '-quality', '80', join(posterRoot, `${name}-end.webp`)]),
  ]);
  console.log(`Prepared ${name}: full 24 fps, desktop/mobile video and stills.`);
}
