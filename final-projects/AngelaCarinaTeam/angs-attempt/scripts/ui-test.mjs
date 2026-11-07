import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {createServer as httpServer} from 'node:http';
import assert from 'node:assert/strict';
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/'});
for(const key of ['window','document','localStorage','HTMLElement','Event','MouseEvent','KeyboardEvent'])globalThis[key]=dom.window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const server=await createServer({server:{middlewareMode:true,hmr:{server:httpServer()}},appType:'custom'});
const {act}=await import('react');
const button=(text)=>[...document.querySelectorAll('button')].find(e=>e.textContent.trim().includes(text));
async function click(el){assert.ok(el,'element exists');await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));}
async function key(el,shift=false){assert.ok(el);await act(async()=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',shiftKey:shift,bubbles:true})));}
const grid=(i)=>document.querySelector(`[data-zone="grid"][data-index="${i}"]`);
const pointer=async(el,type,button=0,x=0,y=0)=>{await act(async()=>el.dispatchEvent(new MouseEvent(type,{bubbles:true,button,clientX:x,clientY:y})));};
const inv=(i)=>document.querySelector(`[data-zone="inventory"][data-index="${i}"]`);
let checks=0;
try{
 await act(async()=>{await server.ssrLoadModule('/src/main.tsx');});
 assert.match(document.body.textContent,/Crafting Table/);checks++;
 // Exact Easy supply; place one in each cell and explicitly check.
 assert.match(inv(0).getAttribute('aria-label'),/4/);await key(inv(0));for(const i of [0,1,3,4])await key(grid(i),true);
 assert.match(document.querySelector('.output').getAttribute('aria-label'),/Crafting Table/);await click(button('Check recipe'));
 assert.match(document.querySelector('[role="status"]').textContent,/Correct/);assert.equal(grid(0).textContent,'');checks++;
 let saved=JSON.parse(localStorage.getItem('crafting-fieldnotes-v1'));assert.equal(saved.progress.crafting_table.attempts,1);
 await click(button('Check retry'));saved=JSON.parse(localStorage.getItem('crafting-fieldnotes-v1'));assert.equal(saved.progress.crafting_table.attempts,1);checks++;
 // A miss reveals reference, persists weakness and cannot be turned into another scored answer.
 await click(button('Continue'));await click(button('I don’t know'));assert.ok(document.querySelector('[role="dialog"]'));saved=JSON.parse(localStorage.getItem('crafting-fieldnotes-v1'));const weakId=Object.keys(saved.progress).find(id=>saved.progress[id].mistakes);assert.ok(weakId);checks++;
 await click(button('Retry this recipe'));assert.equal(document.querySelector('[role="dialog"]'),null);
 // Language changes the item text while keeping the current target and recorded progress.
 const round=document.querySelector('.target .eyebrow').textContent;await click(document.querySelector('[aria-label="Switch item language"]'));
 assert.equal(document.querySelector('.target .eyebrow').textContent,round);assert.equal(JSON.parse(localStorage.getItem('crafting-fieldnotes-v1')).language,'no');checks++;
 await click([...document.querySelectorAll('.mode-tabs button')].find(e=>e.textContent.includes('Review')));
 assert.match(document.querySelector('.panel-heading').textContent,/REVIEW/);await click(button('I don’t know'));assert.match(document.querySelector('.session-stat strong').textContent,/0\/1/);
 await click(button('Retry this recipe'));await click(button('Check retry'));assert.equal(document.querySelector('.session-stat strong').textContent,'0/1');checks++;
 // Consult the active solution in the book before the first submission: cannot earn review credit.
 await click(button('Continue'));await click(button('Recipe book'));
 const targetName=JSON.parse(localStorage.getItem('crafting-fieldnotes-v1')).language==='no'?true:false;assert.ok(targetName);
 const target=await server.ssrLoadModule('/src/data.ts');const r=target.recipes.find(r=>r.id===weakId);
 const detail=[...document.querySelectorAll('.reference-card')].find(e=>e.querySelector('summary').textContent.includes(target.itemName(r.output,'no')));
 await act(async()=>{detail.open=true;detail.dispatchEvent(new Event('toggle'));});await click(button('The workbench'));await click(button('Check recipe'));assert.equal(document.querySelector('.session-stat strong').textContent,'0/2');checks++;
 // A correct independent review answer improves accuracy exactly once.
 await click(document.querySelector('[aria-label="Close recipe reference"]'));await click(button('Continue'));
 const data=await server.ssrLoadModule('/src/data.ts');
 async function fillEasy(){const name=document.querySelector('.target h2').textContent;const r=data.recipes.find(r=>data.itemName(r.output,'no')===name);assert.ok(r,name);
 for(let j=0;j<r.ingredients.length;j++){await key(inv(j));for(let row=0;row<r.pattern.length;row++)for(let col=0;col<r.pattern[row].length;col++)if(r.pattern[row][col]?.[0]===r.ingredients[j].alternatives[0])await key(grid(row*3+col),true);}}
 await fillEasy();await click(button('Check recipe'));assert.equal(document.querySelector('.session-stat strong').textContent,'1/3');await click(button('Check retry'));assert.equal(document.querySelector('.session-stat strong').textContent,'1/3');checks++;
 for(let n=0;n<7;n++){await click(button('Continue'));await click(button('I don’t know'));await click(document.querySelector('[aria-label="Close recipe reference"]'));}
 await click(button('Continue'));assert.match(document.querySelector('.empty').textContent,/1 \/ 10 correct · 10% accuracy/);checks++;
 // Game score is awarded once; inventory gestures and survival supply crafts do not score.
 await click([...document.querySelectorAll('.mode-tabs button')].find(e=>e.textContent.includes('Game')));
 await fillEasy();await click(button('Check recipe'));assert.equal(document.querySelector('.session-stat strong').textContent,'100');assert.equal(button('Check recipe'),undefined);assert.equal(button('Check retry'),undefined);await click(button('Next recipe'));checks++;
 await click(button('Open free supply chest'));
 // Mouse left pickup and right placement, then drag distribution over the helmet pattern.
 await pointer(inv(0),'pointerdown');await pointer(inv(0),'pointerup');
 await pointer(grid(0),'pointerdown',2);await pointer(grid(0),'pointerup',2);assert.match(grid(0).getAttribute('aria-label'),/× 1/);
 await click(button('Clear grid'));await key(inv(0));
 document.elementFromPoint=()=>grid(0);await pointer(grid(0),'pointerdown',2);
 for(const i of [1,2,3,5]){document.elementFromPoint=()=>grid(i);await pointer(grid(i),'pointermove',2,20+i*10,20);}
 await pointer(grid(5),'pointerup',2,70,20);assert.match(document.querySelector('.output').getAttribute('aria-label'),/Jernhjelm/);
 await click(button('Craft survival supply'));await click(button('Equip'));assert.match(document.querySelector('.session').textContent,/2\/20/);assert.equal(document.querySelector('.session-stat strong').textContent,'100');checks++;
 // Eating crafted bread heals without adding target points.
 await click(button('Return to target'));await click(button('I don’t know'));assert.match(document.querySelector('.hearts').textContent,/14.3/);
 await click(button('Open free supply chest'));await key(inv(1));for(const i of [0,1,2])await key(grid(i),true);await click(button('Craft survival supply'));await click(button('Eat'));assert.match(document.querySelector('.hearts').textContent,/16.3/);assert.equal(document.querySelector('.session-stat strong').textContent,'100');checks++;
 await click(button('Return to target'));await click(button('Next recipe'));
 for(let i=0;i<6&&!document.querySelector('.game-end');i++){await click(button('I don’t know'));if(!document.querySelector('.game-end'))await click(button('Next recipe'));}
 assert.match(document.body.textContent,/Run complete/);assert.match(document.body.textContent,/Final score: 100/);checks++;
 await click(button('Restart run'));assert.equal(document.querySelector('.game-end'),null);assert.match(document.querySelector('.hearts').textContent,/20.0/);checks++;
 // Hard inventory is empty; searching in Norwegian finds official labels.
 const select=document.querySelector('select');await act(async()=>{select.value='hard';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(document.querySelectorAll('[data-zone="inventory"].filled').length,0);
 const input=document.querySelector('input[aria-label="Search creative inventory"]');await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'enderoye');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.equal(document.querySelectorAll('.creative-items button').length,1);assert.match(document.querySelector('.creative-items').textContent,/Enderøye/);checks++;
 console.log(`${checks} UI flow checks passed.`);
}finally{await server.close();dom.window.close();}
