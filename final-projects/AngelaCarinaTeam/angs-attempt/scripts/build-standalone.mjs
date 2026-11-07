import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
await build({
  absWorkingDir:root,
  entryPoints:['src/main.tsx'],
  bundle:true,
  outfile:'standalone/app.js',
  format:'iife',
  platform:'browser',
  target:['es2020'],
  minify:true,
  legalComments:'eof',
  define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{"BASE_URL":"./public/"}'},
});
console.log('Updated standalone/app.js and app.css for opening index.html directly.');
