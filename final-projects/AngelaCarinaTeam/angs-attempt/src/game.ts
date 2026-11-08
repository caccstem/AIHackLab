import rawFoods from '../data/foods.json' with {type:'json'};
import {freshSurvival,damage,heal,CONFIG} from './engine.ts';
import type {Survival} from './engine.ts';
export type Food={nutrition:number,saturationModifier:number,saturation:number,remainder:string|null,note:string,edible:boolean};
export const FOODS=rawFoods as Record<string,Food>;
export const foodData=(id:string)=>FOODS[id.split('#')[0]];
export type Reward={id:string,n:number};
export type Game={sessionId:string,completed:number,resolved:Record<string,true>,survival:Survival,foods:Record<string,number>,pending:Record<string,Reward>,remainders:Record<string,number>};
export const freshGame=(sessionId:string):Game=>({sessionId,completed:0,resolved:{},survival:freshSurvival(),foods:{},pending:{},remainders:{}});
export function bounded(s:Survival):Survival{const hunger=Math.max(0,Math.min(CONFIG.maxHunger,s.hunger));return {...s,hunger,saturation:Math.max(0,Math.min(hunger,s.saturation))};}
export function resolveGame(g:Game,questionId:string,correct:boolean,revealed:boolean,result:Reward):Game{
 if(g.resolved[questionId]||!questionId.startsWith(g.sessionId+':')||g.survival.health<=0)return g;
 const completed=g.completed+1;let survival=correct?heal(g.survival):damage(g.survival);
 // Custom direct drain. Saturation never absorbs this five-question threshold.
 if(completed%5===0)survival={...survival,hunger:survival.hunger-1};survival=bounded(survival);
 const pending={...g.pending};if(correct&&!revealed&&foodData(result.id)&&result.n>0)pending[questionId]={...result};
 return {...g,completed,resolved:{...g.resolved,[questionId]:true},survival,pending};
}
export function canEat(g:Game,id:string):boolean{return g.survival.health>0&&g.survival.hunger<CONFIG.maxHunger&&foodData(id)?.edible===true;}
export function eatReason(g:Game,id:string):string{if(g.survival.health<=0)return 'The run has ended.';if(!foodData(id)?.edible)return foodData(id)?.note||'This item is not edible.';if(g.survival.hunger>=CONFIG.maxHunger)return 'Hunger is full (20/20). Store this food for later.';return '';}
export function restoreFood(s:Survival,id:string):Survival{
 const f=foodData(id);if(!f?.edible||s.hunger>=CONFIG.maxHunger||s.health<=0)return s;
 const hunger=Math.min(CONFIG.maxHunger,s.hunger+f.nutrition);
 // Always use the BASE food nutrition, even when recovery is capped at 20.
 const restored=Number((f.nutrition*f.saturationModifier*2).toFixed(6));
 const saturation=Math.min(hunger,Number((s.saturation+restored).toFixed(6)));
 return bounded({...s,hunger,saturation});
}
function applyEating(g:Game,id:string):Game{
 const f=foodData(id)!;const survival=heal(restoreFood(g.survival,id));
 return {...g,survival,remainders:f.remainder?{...g.remainders,[f.remainder]:(g.remainders[f.remainder]||0)+1}:g.remainders};
}
export function storeReward(g:Game,key:string):Game{
 const reward=g.pending[key];if(!reward)return g;const pending={...g.pending};delete pending[key];return {...g,pending,foods:{...g.foods,[reward.id]:(g.foods[reward.id]||0)+reward.n}};
}
export function eatReward(g:Game,key:string):Game{
 const reward=g.pending[key];if(!reward||!canEat(g,reward.id))return g;let next=applyEating(g,reward.id);const pending={...g.pending};if(reward.n===1)delete pending[key];else pending[key]={...reward,n:reward.n-1};return {...next,pending};
}
export function eatStored(g:Game,id:string):Game{
 if(!(g.foods[id]>0)||!canEat(g,id))return g;const next=applyEating(g,id),foods={...g.foods,[id]:g.foods[id]-1};if(!foods[id])delete foods[id];return {...next,foods};
}
