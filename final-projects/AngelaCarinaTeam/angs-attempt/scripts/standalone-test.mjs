import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import jsdom from 'jsdom';
const {JSDOM,requestInterceptor}=jsdom;
import {createServer} from 'vite';
import {createServer as httpServer} from 'node:http';

const entry=new URL('../index.html',import.meta.url);
const html=await readFile(entry,'utf8');
assert.match(html,/src="\.\/standalone\/app.js"/);
assert.doesNotMatch(html,/type="module"/);
const dom=await JSDOM.fromFile(fileURLToPath(entry),{
  runScripts:'dangerously',resources:{interceptors:[requestInterceptor(request=>request.url.startsWith('https:')?new Response('',{headers:{'Content-Type':'text/css'}}):undefined)]},pretendToBeVisual:true,
});
async function waitFor(check){
  const deadline=Date.now()+4000;
  while(!check()){if(Date.now()>deadline)throw Error('Timed out waiting for standalone UI');await new Promise(r=>setTimeout(r,10));}
}
try{
  await waitFor(()=>dom.window.document.querySelector('[data-zone="inventory"][data-index="0"].filled'));
  const doc=dom.window.document;
  assert.match(doc.querySelector('.target h2').textContent,/Crafting Table/);
  for(const img of doc.querySelectorAll('img')){
    assert.match(img.src,/file:.*\/public\/assets\//);
    await access(fileURLToPath(img.src));
  }
  const slot=(zone,i)=>doc.querySelector(`[data-zone="${zone}"][data-index="${i}"]`);
  async function enter(el,shift=false){
    const before=el.getAttribute('aria-label');
    el.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',shiftKey:shift,bubbles:true}));
    await waitFor(()=>el.getAttribute('aria-label')!==before);
  }
  await enter(slot('inventory',0));
  for(const i of [0,1,3,4])await enter(slot('grid',i),true);
  assert.match(doc.querySelector('.output').getAttribute('aria-label'),/Crafting Table/);
  [...doc.querySelectorAll('button')].find(b=>b.textContent.includes('Check recipe')).click();
  await waitFor(()=>doc.querySelector('[role="status"]').textContent.includes('Correct'));
  doc.querySelector('[aria-label="Switch item language"]').click();
  await waitFor(()=>doc.querySelector('.target h2').textContent==='Arbeidsbenk');
  console.log('Direct-file checks passed: offline loading, texture paths, crafting, and language switching.');
}finally{dom.window.close();}
const server=await createServer({server:{middlewareMode:true,hmr:{server:httpServer()}},appType:'custom'});
try{
  const transformed=await server.transformIndexHtml('/',html);
  assert.match(transformed,/type="module" src="\/src\/main.tsx"/);
  assert.doesNotMatch(transformed,/standalone\/app.js/);
  console.log('Vite entry check passed: localhost uses live TypeScript source.');
}finally{await server.close();}
