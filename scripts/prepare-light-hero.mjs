// Bake the approved grade once; shipped pages play ordinary, unfiltered video.
import { chromium } from '@playwright/test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const run = promisify(execFile);
const output = resolve('artifacts/light-hero');
await mkdir(output, { recursive: true });
const sourcePath = resolve('public/videos/moki-system-loop.mp4');
const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,duration,nb_frames', '-of', 'json', sourcePath]);
const source = JSON.parse(stdout).streams[0];
if (source.width / source.height !== 16 / 9) throw new Error('Update the grade regions for this artwork composition.');
const [numerator, denominator] = source.r_frame_rate.split('/').map(Number);
const fps = numerator / denominator;
const frameCount = Number(source.nb_frames) || Math.round(Number(source.duration) * fps);

const gradeSource = await readFile('scripts/LightArtworkGrade.tsx', 'utf8');
const { outputText } = ts.transpileModule(gradeSource, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const gradeModule = resolve(output, 'grade.cjs');
await writeFile(gradeModule, outputText);
const Grade = createRequire(import.meta.url)(gradeModule).default;
const defs = renderToStaticMarkup(React.createElement(Grade));
const movie = (await readFile(sourcePath)).toString('base64');
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
let encoder;
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;overflow:hidden;background:white}.media-filter-definitions{position:absolute;width:0;height:0}video{display:block;width:1600px;height:900px;filter:url(#moki-light-artwork)}</style>${defs}<video muted playsinline preload="auto" src="data:video/mp4;base64,${movie}"></video>`);
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
  const options = ['-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-map_metadata', '-1', '-threads', '2'];
  encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(fps), '-i', 'pipe:0', '-map', '0:v', ...options, 'public/videos/moki-system-loop-light.mp4', '-map', '0:v', '-vf', 'scale=960:540', ...options, 'public/videos/moki-system-loop-light-mobile.mp4'], { stdio: ['pipe', 'ignore', 'pipe'] });
  let errors = '';
  encoder.stderr.on('data', data => { errors += data.toString(); });
  const completed = new Promise((yes, no) => { encoder.on('error', no); encoder.on('close', code => code ? no(new Error(errors)) : yes()); });
  completed.catch(() => {});
  for (let frame = 0; frame < frameCount; frame++) {
    await page.locator('video').evaluate((video, time) => new Promise(resolveFrame => {
      video.pause();
      const painted = () => requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
      if (Math.abs(video.currentTime - time) < .0001) { painted(); return; }
      video.addEventListener('seeked', painted, { once: true });
      video.currentTime = time;
    }), frame / fps);
    const png = await page.screenshot({ type: 'png' });
    if (frame === 0) await writeFile(resolve(output, 'first-frame.png'), png);
    await new Promise((yes, no) => encoder.stdin.write(png, error => error ? no(error) : yes()));
    if ((frame + 1) % Math.round(fps) === 0) console.log(`Rendered ${frame + 1}/${frameCount} frames`);
  }
  encoder.stdin.end();
  await completed;
  for (const [suffix, size] of [['', '1600:900'], ['-mobile', '960:540']]) {
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', resolve(output, 'first-frame.png'), '-vf', `scale=${size}`, '-frames:v', '1', '-quality', '88', `public/images/moki-system-light${suffix}.webp`]);
  }
  console.log(`Prepared light hero: ${frameCount} frames at ${fps} fps, desktop and phone videos with matching posters.`);
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill();
  await browser.close();
}
