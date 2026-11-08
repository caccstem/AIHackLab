import {readFile,writeFile} from 'node:fs/promises';
import {itemIds} from '../src/data.ts';
const audit=JSON.parse(await readFile(new URL('../data/icon-audit.json',import.meta.url),'utf8'));
const ids=[...new Set(itemIds.map(id=>id.split('#')[0]))];
const missing=ids.filter(id=>!audit.rendered[id]).map(id=>({id,reason:audit.fallbacks[id]||'No renderable official item model'}));
await writeFile(new URL('../data/icon-coverage.json',import.meta.url),JSON.stringify({version:'1.16.1',relevantItems:ids.length,rendered:ids.length-missing.length,fallbacks:missing},null,2)+'\n');
console.log(`${ids.length-missing.length}/${ids.length} relevant item IDs have rendered icons; ${missing.length} use explicit fallbacks.`);
