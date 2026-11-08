import test from 'node:test';import assert from 'node:assert/strict';
import {freshGame,resolveGame,FOODS,restoreFood,storeReward,eatReward,eatStored,canEat} from './game.ts';
const answer=(g,n,correct=true,id='stick',count=4,revealed=false)=>resolveGame(g,g.sessionId+':'+n,correct,revealed,{id,n:count});
test('four completions do not drain hunger; five and ten drain once regardless of saturation',()=>{
 let g=freshGame('s');g.survival.saturation=20;
 for(let i=1;i<=4;i++)g=answer(g,i);assert.equal(g.survival.hunger,20);assert.equal(g.completed,4);
 g=answer(g,5,false);assert.equal(g.survival.hunger,19);assert.equal(g.survival.saturation,19);assert.equal(g.completed,5);
 const duplicate=answer(g,5);assert.equal(duplicate,g);assert.equal(duplicate.survival.hunger,19);
 // Keep this hunger assertion independent of the trainer's healing saturation cost.
 g={...g,survival:{...g.survival,health:20}};for(let i=6;i<=9;i++)g=answer(g,i);assert.equal(g.survival.hunger,19);g=answer(g,10);assert.equal(g.survival.hunger,18);assert.equal(g.completed,10);
});
test('depletion clamps zero and saturation, and a fresh session resets counters, rewards and food',()=>{
 let g=freshGame('s');g={...g,completed:4,survival:{...g.survival,hunger:0,saturation:5}};g=answer(g,5);assert.equal(g.survival.hunger,0);assert.equal(g.survival.saturation,0);
 assert.equal(resolveGame(g,'other:1',true,false,{id:'bread',n:1}),g);assert.deepEqual(freshGame('new').foods,{});assert.equal(freshGame('new').completed,0);
});
test('verified food values distinguish modifiers and restored points; wheat and glistering melon are not food',()=>{
 assert.deepEqual([FOODS.bread.nutrition,FOODS.bread.saturationModifier,FOODS.bread.saturation],[5,.6,6]);assert.equal(FOODS.cookie.nutrition,2);assert.equal(FOODS.cookie.saturation,.4);assert.equal(FOODS.golden_carrot.saturation,14.4);assert.equal(FOODS.honey_bottle.saturation,1.2);assert.equal(FOODS.rabbit_stew.saturation,12);assert.equal(FOODS.wheat,undefined);assert.equal(FOODS.glistering_melon_slice,undefined);
});
test('first-attempt food rewards use actual output counts once; failed/revealed answers and retries cannot award',()=>{
 let g=answer(freshGame('s'),1,true,'cookie',8);assert.equal(g.pending['s:1'].n,8);assert.equal(answer(g,1,true,'cookie',8),g);
 g=answer(g,2,false,'bread',1);assert.equal(g.pending['s:2'],undefined);assert.equal(answer(g,2,true,'bread',1),g);
 g=answer(g,3,true,'bread',1,true);assert.equal(g.pending['s:3'],undefined);g=answer(g,4,true,'wheat',3);assert.equal(g.pending['s:4'],undefined);
});
test('food uses base nutrition for saturation after capped hunger; full hunger is blocked',()=>{
 const s={...freshGame('s').survival,hunger:19,saturation:0};const restored=restoreFood(s,'golden_carrot');assert.equal(restored.hunger,20);assert.equal(restored.saturation,14.4);
 assert.equal(restoreFood({...s,hunger:20},'bread').hunger,20);assert.equal(restoreFood({...s,hunger:20},'bread').saturation,0);
 const capped=restoreFood({...s,hunger:19,saturation:19},'golden_carrot');assert.equal(capped.saturation,20);
});
test('Eat now and Store food share exactly one awarded stack; one eating action consumes one',()=>{
 let g=answer(freshGame('s'),1,true,'cookie',8);assert.equal(canEat(g,'cookie'),false);assert.equal(eatReward(g,'s:1'),g);
 g={...g,survival:{...g.survival,hunger:10,saturation:0}};g=eatReward(g,'s:1');assert.equal(g.pending['s:1'].n,7);assert.equal(g.survival.hunger,12);assert.equal(g.survival.saturation,.4);g=storeReward(g,'s:1');assert.equal(g.foods.cookie,7);assert.equal(g.pending['s:1'],undefined);assert.equal(storeReward(g,'s:1'),g);assert.equal(eatReward(g,'s:1'),g);
 g=eatStored(g,'cookie');assert.equal(g.foods.cookie,6);assert.equal(g.survival.hunger,14);assert.equal(g.survival.saturation,.8);
});
test('container remainders are retained; status effects and placed cake limitations are explicit',()=>{
 let g=answer(freshGame('s'),1,true,'mushroom_stew',1);g={...g,survival:{...g.survival,hunger:10}};g=eatReward(g,'s:1');assert.equal(g.remainders.bowl,1);assert.equal(g.pending['s:1'],undefined);
 g=answer(g,2,true,'honey_bottle',4);g={...g,survival:{...g.survival,hunger:10}};g=eatReward(g,'s:2');assert.equal(g.remainders.glass_bottle,1);assert.equal(g.pending['s:2'].n,3);assert.match(FOODS.golden_apple.note,/not simulated/);assert.match(FOODS.suspicious_stew.note,/not simulated/);
 g=answer(g,3,true,'cake',1);assert.ok(g.pending['s:3']);assert.equal(canEat(g,'cake'),false);assert.match(FOODS.cake.note,/not simulated/);
});
