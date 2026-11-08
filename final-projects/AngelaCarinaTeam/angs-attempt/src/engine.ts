import {matchSpecial,specialRemainder} from './special.ts';
export type Stack={id:string,n:number};
export type Cell=Stack|null;
export type Recipe={id:string,output:string,count:number,special?:string,note?:string,speedrunning:boolean,names:Record<'en'|'no',string>,pattern:(string[]|null)[][],shapeless:boolean,difficulty:number,ingredients:{alternatives:string[],quantity:number}[]};
export const CONFIG={maxHealth:20,maxHunger:20,maxSaturation:20,startingSaturation:5,damage:6,armorReductionPerPoint:.025,heal:2,healThresholdHunger:18,healHunger:0,healSaturation:1};
export function matches(grid:Cell[],r:Recipe):boolean{
 const special=matchSpecial(grid,r);if(special!==null)return special;
 const occupied=grid.filter((s):s is Stack=>!!s&&s.n>0);
 if(r.shapeless){const needs=r.pattern.flat().filter((x):x is string[]=>!!x);if(needs.length!==occupied.length)return false;
  const owners=Array(occupied.length).fill(-1);
  const assign=(i:number,seen:Set<number>):boolean=>occupied.some((s,j)=>{if(seen.has(j)||!needs[i].includes(s.id))return false;seen.add(j);if(owners[j]===-1||assign(owners[j],seen)){owners[j]=i;return true;}return false;});
  return needs.every((_,i)=>assign(i,new Set()));}
 const h=r.pattern.length,w=r.pattern[0].length;
 for(let y=0;y<=3-h;y++)for(let x=0;x<=3-w;x++)for(const mirror of [false,true]){
  if(grid.every((s,i)=>{let row=Math.floor(i/3)-y,col=i%3-x;let allowed=row>=0&&row<h&&col>=0&&col<w?r.pattern[row][mirror?w-1-col:col]:null;return allowed?!!s&&s.n>0&&allowed.includes(s.id):!s;}))return true;
 }return false;
}
export function consume(grid:Cell[],r?:Recipe):Cell[]{return grid.map(s=>{if(!s)return null;if(specialRemainder(s.id,r))return {...s};if(s.n>1)return {...s,n:s.n-1};const remainder:Record<string,string>={milk_bucket:'bucket',water_bucket:'bucket',lava_bucket:'bucket',honey_bottle:'glass_bottle'};return remainder[s.id]?{id:remainder[s.id],n:1}:null;});}
export function stackLimit(id:string):number{
 id=id.split('#')[0];if(/_(pickaxe|axe|shovel|hoe|sword|helmet|chestplate|leggings|boots|boat|bed|shulker_box|horse_armor)$/.test(id)||['shield','milk_bucket','water_bucket','lava_bucket','flint_and_steel','shulker_box','elytra','trident','bow','crossbow','fishing_rod','carrot_on_a_stick','warped_fungus_on_a_stick','potion','splash_potion','lingering_potion','mushroom_stew','rabbit_stew','beetroot_soup','suspicious_stew','cake','writable_book','saddle'].includes(id)||id.endsWith('_bucket')||id.endsWith('_minecart')||id==='minecart'||id.startsWith('music_disc_'))return 1;
 return ['bucket','ender_pearl','snowball','egg','honey_bottle','armor_stand','written_book'].includes(id)||id.endsWith('_banner')||id.endsWith('_sign')?16:64;
}
export function transfer(cells:Cell[],index:number,held:Cell,one=false):{cells:Cell[],held:Cell}{
 const out=cells.map(s=>s?{...s}:null),s=out[index];let hand=held?{...held}:null;
 if(!hand){if(s){let n=one?Math.ceil(s.n/2):s.n;hand={id:s.id,n};s.n-=n;if(!s.n)out[index]=null;}}
 else if(!s||s.id===hand.id){let n=Math.min(one?1:hand.n,stackLimit(hand.id)-(s?.n||0));out[index]={id:hand.id,n:(s?.n||0)+n};hand.n-=n;if(!hand.n)hand=null;}
 else if(!one){out[index]=hand;hand=s;}
 return {cells:out,held:hand};
}
export function distribute(cells:Cell[],indices:number[],held:Cell,one=false){
 let out=cells.map(s=>s?{...s}:null),hand=held?{...held}:null;if(!hand)return {cells:out,held:hand};
 const eligible=[...new Set(indices)].filter(i=>i>=0&&i<out.length&&(!out[i]||out[i]!.id===hand!.id)&&((out[i]?.n||0)<stackLimit(hand!.id)));
 const each=one?1:Math.floor(hand.n/Math.max(1,eligible.length));
 for(const i of eligible){const n=Math.min(each,hand.n,stackLimit(hand.id)-(out[i]?.n||0));if(n){out[i]={id:hand.id,n:(out[i]?.n||0)+n};hand.n-=n;}}
 return {cells:out,held:hand.n?hand:null};
}
export type Survival={health:number,hunger:number,saturation:number,armor:Record<string,string>};
export const freshSurvival=():Survival=>({health:CONFIG.maxHealth,hunger:CONFIG.maxHunger,saturation:CONFIG.startingSaturation,armor:{}});
export const armorPoints:Record<string,number>={iron_helmet:2,iron_chestplate:6,iron_leggings:5,iron_boots:2};
export function damage(s:Survival):Survival{const points=Object.values(s.armor).reduce((n,id)=>n+(armorPoints[id]||0),0);return {...s,health:Math.max(0,s.health-CONFIG.damage*(1-points*CONFIG.armorReductionPerPoint))};}
export function heal(s:Survival):Survival{return s.health>0&&s.health<CONFIG.maxHealth&&s.hunger>=CONFIG.healThresholdHunger&&s.saturation>=CONFIG.healSaturation?{...s,health:Math.min(CONFIG.maxHealth,s.health+CONFIG.heal),hunger:s.hunger-CONFIG.healHunger,saturation:s.saturation-CONFIG.healSaturation}:s;}
export const normalize=(s:string)=>s.toLocaleLowerCase('nb-NO').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').replace(/ø/g,'o').replace(/å/g,'a');
export function stash(inventory:Cell[],sources:Cell[]):Cell[]{
 const out=inventory.map(s=>s?{...s}:null);
 for(const source of sources){if(!source)continue;let n=source.n;for(const s of out){if(s?.id===source.id){const amount=Math.min(stackLimit(s.id)-s.n,n);s.n+=amount;n-=amount;}}
 while(n){const amount=Math.min(stackLimit(source.id),n),empty=out.findIndex(s=>!s);if(empty>=0)out[empty]={id:source.id,n:amount};else out.push({id:source.id,n:amount});n-=amount;}}
 return out;
}
