import {cp,copyFile,readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
// Vite has just built the unchanged React routes. Keep their exact HTML entry.
await copyFile(resolve(dist,'index.html'),resolve(dist,'legacy.html'));
for(const item of await readdir(resolve(root,'site'),{withFileTypes:true})){
  if(['README.md','ENGINE-ART.md'].includes(item.name))continue;
  await cp(resolve(root,'site',item.name),resolve(dist,item.name),{recursive:item.isDirectory()});
}
const html=await readFile(resolve(dist,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)){
  const file=resolve(dist,match[1]);
  await readFile(file);
}
console.log('Published the Possibility Engine with legacy routes retained in legacy.html.');
