import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// One compressed download; the browser only decodes the frames near the playhead.
for (const kind of ['desktop', 'mobile']) {
  const root = join('public', 'film');
  const names = (await readdir(join(root, kind))).filter(name => name.endsWith('.webp')).sort();
  const buffers = await Promise.all(names.map(name => readFile(join(root, kind, name))));
  let offset = 0;
  const frames = buffers.map(buffer => { const frame = { offset, length: buffer.length }; offset += buffer.length; return frame; });
  await writeFile(join(root, `${kind}.frames`), Buffer.concat(buffers));
  await writeFile(join(root, `${kind}.frames.json`), JSON.stringify({ frames }));
  console.log(`${kind}: ${frames.length} compressed frames in ${(offset / 1024 / 1024).toFixed(2)} MB`);
}
