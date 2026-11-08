import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {recipes,itemIds,itemName,texture} from './data.ts';
const audit=JSON.parse(readFileSync(new URL('../data/icon-audit.json',import.meta.url),'utf8'));
test('crimson planks retain the official stem/hyphae recipe and names, with square inventory renders',()=>{
 const r=recipes.find(r=>r.id==='crimson_planks');assert.equal(r.count,4);assert.deepEqual(r.ingredients[0].alternatives,['crimson_stem','stripped_crimson_stem','crimson_hyphae','stripped_crimson_hyphae']);assert.equal(itemName('crimson_stem','en'),'Crimson Stem');assert.notEqual(itemName('crimson_stem','en'),'Crimson Log');
 for(const id of ['crimson_stem','stripped_crimson_stem','crimson_hyphae','stripped_crimson_hyphae','crimson_planks','warped_stem','stripped_warped_hyphae']){const a=audit.rendered[id];assert.equal(a.kind,'block-model');assert.deepEqual(a.size,[64,64]);const [x0,y0,x1,y1]=a.bounds;assert.ok((y1-y0)/(x1-x0)<1.5,id);assert.match(texture(id),/icons\//);}
 const source=audit.sourceTextures['block/crimson_stem'];assert.equal(source.animated,true);assert.ok(source.sourceSize[1]>source.sourceSize[0]);assert.deepEqual(source.frameSize,[16,16]);
});
test('all ordinary wood/log/stem/hypha/plank families use official model icons, not raw texture strips',()=>{
 for(const wood of ['oak','spruce','birch','jungle','acacia','dark_oak'])for(const id of [wood+'_planks',wood+'_log',wood+'_wood','stripped_'+wood+'_log','stripped_'+wood+'_wood'])assert.equal(audit.rendered[id].kind,'block-model',id);
 for(const wood of ['crimson','warped'])for(const id of [wood+'_planks',wood+'_stem',wood+'_hyphae','stripped_'+wood+'_stem','stripped_'+wood+'_hyphae'])assert.equal(audit.rendered[id].kind,'block-model',id);
});
test('every available icon has a real square PNG; missing icons resolve explicitly to fallback',()=>{
 for(const id of itemIds){const src=texture(id);if(!src){assert.ok(audit.fallbacks[id.split('#')[0]]||!audit.rendered[id.split('#')[0]]);continue;}assert.match(src,/assets\/icons\//);const path=new URL('../public/assets/'+src.split('/assets/')[1],import.meta.url);assert.ok(existsSync(path),id);const bytes=readFileSync(path);assert.equal(bytes.readUInt32BE(16),64,id);assert.equal(bytes.readUInt32BE(20),64,id);}
 assert.equal(texture('not_a_minecraft_item'),'');assert.equal(texture('white_bed'),'');
});
