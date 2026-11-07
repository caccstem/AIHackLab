import test from 'node:test';
import assert from 'node:assert/strict';
import {recipes,itemName,languages,itemIds} from './data.ts';
import {matches,consume,transfer,distribute,record,required,selectWeak,damage,heal,eat,freshSurvival,parseSaved,normalize,stackLimit,stash} from './engine.ts';
const blank=()=>Array(9).fill(null);
function arrange(r,x=0,y=0,mirror=false,alternative=0){const grid=blank();r.pattern.forEach((row,j)=>row.forEach((a,i)=>{if(a)grid[(y+j)*3+x+(mirror?row.length-1-i:i)]={id:a[alternative%a.length],n:3};}));return grid;}
test('all vanilla shaped recipes match every offset, mirror and substitution; reject extra ingredients',()=>{
 let checked=0;
 for(const r of recipes.filter(r=>!r.shapeless))for(let y=0;y<=3-r.pattern.length;y++)for(let x=0;x<=3-r.pattern[0].length;x++)for(const mirror of [false,true])for(let alt=0;alt<Math.max(...r.ingredients.map(i=>i.alternatives.length));alt++){
  const grid=arrange(r,x,y,mirror,alt);assert.ok(matches(grid,r),r.id);checked++;
  const empty=grid.findIndex(s=>!s);if(empty>=0){grid[empty]={id:'ender_pearl',n:1};assert.equal(matches(grid,r),false,r.id+' extra');}
 }
 assert.ok(checked>300);for(const r of recipes)assert.equal(matches(blank(),r),false);
});
test('shapeless order and offsets; quantity is per occupied slot, not stack total',()=>{
 for(const r of recipes.filter(r=>r.shapeless)){const grid=blank();r.pattern.flat().filter(Boolean).reverse().forEach((a,i)=>grid[8-i]={id:a[0],n:64});assert.ok(matches(grid,r),r.id);grid[8]=null;assert.equal(matches(grid,r),false);}
 const table=recipes.find(r=>r.id==='crafting_table');const grid=blank();grid[0]={id:'oak_planks',n:4};assert.equal(matches(grid,table),false);
});
test('left/right stack placement, swapping, capped stacks, split pickup and consumption conserve counts',()=>{
 let r=transfer([{id:'wheat',n:9}],0,null,true);assert.deepEqual(r,{cells:[{id:'wheat',n:4}],held:{id:'wheat',n:5}});
 r=transfer(blank(),4,r.held,true);assert.deepEqual(r.cells[4],{id:'wheat',n:1});assert.equal(r.held.n,4);
 r=transfer([{id:'wheat',n:63}],0,{id:'wheat',n:5});assert.equal(r.cells[0].n,64);assert.equal(r.held.n,4);
 r=transfer([{id:'stick',n:2}],0,{id:'wheat',n:5});assert.equal(r.held.id,'stick');assert.equal(r.cells[0].id,'wheat');
 assert.deepEqual(consume([{id:'wheat',n:2},{id:'wheat',n:1},null]),[{id:'wheat',n:1},null,null]);
 const bread=recipes.find(r=>r.id==='bread');assert.equal(bread.count,1);assert.equal(recipes.find(r=>r.id==='stick').count,4);assert.equal(recipes.find(r=>r.id==='bowl').count,4);assert.equal(recipes.find(r=>r.id==='oak_door').count,3);
});
test('drag distributes evenly or one each; duplicate/full/incompatible slots cannot destroy items',()=>{
 let r=distribute(blank(),[0,1,2],{id:'wheat',n:8});assert.deepEqual(r.cells.slice(0,3).map(s=>s.n),[2,2,2]);assert.equal(r.held.n,2);
 r=distribute(blank(),[0,1,1,2],{id:'wheat',n:8},true);assert.deepEqual(r.cells.slice(0,3).map(s=>s.n),[1,1,1]);assert.equal(r.held.n,5);
 r=distribute([{id:'stick',n:1},{id:'wheat',n:64},null],[0,1,2],{id:'wheat',n:8});assert.equal(r.cells[0].n,1);assert.equal(r.cells[1].n,64);assert.equal(r.cells[2].n,8);assert.equal(r.held,null);
});
test('survival damage, armor, healing costs, bread caps and game over',()=>{
 let s=freshSurvival();s=damage(s);assert.equal(s.health,14);s=heal(s);assert.equal(s.health,16);assert.equal(s.hunger,19);assert.equal(s.saturation,4);
 let armored=damage({...freshSurvival(),armor:{h:'iron_helmet',c:'iron_chestplate',l:'iron_leggings',b:'iron_boots'}});assert.equal(armored.health,16.25);
 assert.equal(heal({...s,hunger:17}).health,16);assert.equal(heal({...s,saturation:0}).health,16);
 assert.equal(eat({...s,hunger:18,saturation:4}).saturation,4);assert.equal(eat({...s,hunger:18,saturation:4}).hunger,19);
 for(let i=0;i<10;i++)s=damage(s);assert.equal(s.health,0);assert.equal(heal(s).health,0);
});
test('review mistakes increase mastery threshold; a later miss returns mastered recipe to pool',()=>{
 let p=record(undefined,false,false);assert.equal(required(p),4);for(let i=0;i<3;i++)p=record(p,true,true);assert.equal(p.mastered,false);p=record(p,true,true);assert.equal(p.mastered,true);assert.equal(p.reviews,4);assert.equal(p.attempts,5);
 p=record(p,false,false);assert.equal(p.mastered,false);assert.equal(p.streak,0);assert.equal(required(p),5);
 for(let i=0;i<10;i++)p=record(p,false,true);assert.equal(required(p),8);
});
test('weak selection is weighted, excludes mastered and avoids back-to-back when possible',()=>{
 const p={a:{attempts:1,mistakes:1,reviews:0,streak:0,mastered:false},b:{attempts:6,mistakes:5,reviews:0,streak:0,mastered:false},c:{attempts:8,mistakes:2,reviews:6,streak:6,mastered:true}};
 assert.equal(selectWeak(['a','b','c'],p,'a',()=>0),'b');assert.equal(selectWeak(['a'],p,'a',()=>0),'a');assert.equal(selectWeak(['c'],p,'',()=>0),null);
 const counts={a:0,b:0};for(let i=0;i<800;i++)counts[selectWeak(['a','b'],p,'',()=>i/800)]++;assert.equal(counts.a,200);assert.equal(counts.b,600);
});
test('persistence handles corruption/version mismatch and retains valid progress',()=>{
 assert.deepEqual(parseSaved('broken').progress,{});assert.equal(parseSaved('{"version":99}').language,'en');
 const v={version:1,language:'no',difficulty:'hard',progress:{a:record(undefined,false,false),b:{attempts:-1}}};const parsed=parseSaved(JSON.stringify(v));assert.equal(parsed.language,'no');assert.equal(parsed.difficulty,'hard');assert.deepEqual(parsed.progress.a,v.progress.a);assert.equal(parsed.progress.b,undefined);
});
test('official names resolve for every item; Norwegian search normalization and terminology',()=>{
 for(const id of itemIds)for(const lang of ['en','no'])assert.ok(languages[lang]['item.minecraft.'+id]||languages[lang]['block.minecraft.'+id],id+' '+lang);
 assert.equal(itemName('ender_eye','no'),'Enderøye');assert.equal(normalize('ENDErØYE'),'enderoye');assert.equal(normalize('ÆØÅ'),'aeoa');
 assert.ok(languages.no['enchantment.minecraft.looting']);assert.ok(languages.no['subtitles.entity.silverfish.ambient']);
});

test('Minecraft stack limits for ingredients and creative inventory tools',()=>{
 assert.equal(stackLimit('ender_pearl'),16);assert.equal(stackLimit('bucket'),16);assert.equal(stackLimit('iron_pickaxe'),1);assert.equal(stackLimit('oak_boat'),1);assert.equal(stackLimit('iron_ingot'),64);
 const r=transfer([{id:'ender_pearl',n:15}],0,{id:'ender_pearl',n:5});assert.equal(r.cells[0].n,16);assert.equal(r.held.n,4);
});

test('clearing returns items to empty inventory slots and respects stack limits without loss',()=>{
 assert.deepEqual(stash([null,{id:'wheat',n:9}],[{id:'iron_ingot',n:1},{id:'iron_ingot',n:23}]),[{id:'iron_ingot',n:24},{id:'wheat',n:9}]);
 const out=stash([{id:'ender_pearl',n:15},null],[{id:'ender_pearl',n:4}]);assert.deepEqual(out,[{id:'ender_pearl',n:16},{id:'ender_pearl',n:3}]);
});

test('each recipe has stable localized names, search terms and accurate ingredient quantities',()=>{
 assert.equal(new Set(recipes.map(r=>r.id)).size,43);
 for(const r of recipes){assert.equal(r.names.en,itemName(r.output,'en'));assert.equal(r.names.no,itemName(r.output,'no'));assert.ok(r.searchTerms.en.includes(r.names.en));assert.ok(r.searchTerms.no.includes(r.names.no));assert.equal(r.ingredients.reduce((n,i)=>n+i.quantity,0),r.pattern.flat().filter(Boolean).length);}
});
