import test from 'node:test';import assert from 'node:assert/strict';
import {SEARCH_HINTS,VOCABULARY,searchHints,isSpeedrunning,weightedPick,weightedOrder,recipeWeight} from './preferences.ts';
import {recipes} from './data.ts';import {matches,consume} from './engine.ts';import {specialResult} from './special.ts';
const canonical=r=>Array.from({length:9},(_,i)=>{const a=r.pattern[Math.floor(i/3)]?.[i%3];return a?{id:a[0],n:1}:null;});
test('all 647 catalog tasks have valid canonical grids, including 13 special families',()=>{
 assert.equal(recipes.length,647);assert.equal(recipes.filter(r=>r.special).length,13);for(const r of recipes){assert.ok(matches(canonical(r),r),r.id);assert.ok(specialResult(canonical(r),r).n>0);}
 assert.ok(recipes.some(r=>r.id==='acacia_stairs'&&!r.speedrunning));assert.ok(!recipes.some(r=>r.id==='iron_ingot_from_smelting'));
});
test('special rules enforce constraints, dynamic quantities and retained ingredients',()=>{
 const by=id=>recipes.find(r=>r.id===id),g=(...ids)=>Array.from({length:9},(_,i)=>ids[i]?{id:ids[i],n:1}:null);
 assert.equal(matches(g('paper','gunpowder','gunpowder','gunpowder'),by('firework_rocket')),true);assert.equal(matches(g('paper','gunpowder','gunpowder','gunpowder','gunpowder'),by('firework_rocket')),false);
 assert.equal(matches(g('gunpowder','red_dye','diamond','diamond'),by('firework_star')),false);
 assert.equal(matches(g('white_banner#patterned','red_banner'),by('banner_duplicate')),false);
 assert.equal(matches(g('written_book#copy_of_copy','writable_book'),by('book_cloning')),false);
 const books=g('written_book#original','writable_book','writable_book');assert.equal(matches(books,by('book_cloning')),true);assert.equal(specialResult(books,by('book_cloning')).n,2);assert.deepEqual(consume(books,by('book_cloning'))[0],books[0]);
 assert.equal(matches(g('shield#decorated','white_banner'),by('shield_decoration')),false);
 assert.equal(specialResult(g('shulker_box','blue_dye'),by('shulker_box_coloring')).id,'blue_shulker_box');
 assert.deepEqual(consume(g('milk_bucket','honey_bottle')) .slice(0,2),[{id:'bucket',n:1},{id:'glass_bottle',n:1}]);
});
test('approved search hints are exact, language-specific and confined to speedrunning outputs',()=>{
 assert.deepEqual(SEARCH_HINTS.no,{golden_helmet:['Lh'],golden_pickaxe:['Lh','Lma'],bed:['N/L'],iron_sword:['Nsv'],nether_bricks:['he'],stick:['pi'],bow:['ue'],respawn_anchor:['V/IV'],iron_ingot:['Ba'],wool:['u'],blaze_powder:['LV'],ender_eye:['øY'],iron_axe:['nø']});
 assert.deepEqual(SEARCH_HINTS.en,{iron_tools:['ro'],bed:['ro'],respawn_anchor:['re'],bow:['ow']});
 assert.deepEqual(searchHints('golden_pickaxe','no'),['Lh','Lma']);assert.deepEqual(searchHints('iron_hoe','en'),['ro']);assert.deepEqual(searchHints('red_bed','no'),['N/L']);assert.deepEqual(searchHints('stick','en'),[]);assert.deepEqual(searchHints('stone_axe','no'),[]);assert.deepEqual(searchHints('acacia_stairs','en'),[]);
 for(const r of recipes)if(!r.speedrunning)assert.deepEqual(searchHints(r.output,'no'),[]);
});
test('vocabulary contains exactly the eleven user-supplied pairings',()=>{
 assert.deepEqual(VOCABULARY,[['plyndring','looting'],['velende','silk touch'],['silkeberøring','mending'],['effektivitet','efficiency'],['lava pops','lavaen bobler'],['silverfish hisses','sølvkre hveser'],['blaze crackles','flammeskrømt spraker'],['blaze breathes','flammeskrømt puster'],['easy','lett'],['normal','vanlig'],['hard','vanskeli']]);
});
test('speedrunning preference remains configurable and never excludes non-speedrunning items',()=>{
 for(const id of ['iron_axe','stone_hoe','golden_pickaxe','golden_axe','shears','stick','iron_ingot','gold_ingot','oak_pressure_plate','heavy_weighted_pressure_plate','bucket','iron_door','birch_boat','flint_and_steel','red_wool','red_bed','bow','respawn_anchor','blaze_powder','ender_eye','golden_helmet','nether_bricks','bread'])assert.equal(isSpeedrunning(id),true,id);
 const pool=['iron_axe','acacia_stairs'];let counts={iron_axe:0,acacia_stairs:0};for(let i=0;i<100;i++)counts[weightedPick(pool,recipeWeight,()=>i/100)]++;assert.deepEqual(counts,{iron_axe:80,acacia_stairs:20});assert.equal(new Set(weightedOrder(pool,recipeWeight)).size,2);
});
