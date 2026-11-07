export type Stack={id:string,n:number};
export type Cell=Stack|null;
export type Recipe={id:string,output:string,count:number,names:Record<'en'|'no',string>,searchTerms:Record<'en'|'no',string[]>,pattern:(string[]|null)[][],shapeless:boolean,difficulty:number,ingredients:{alternatives:string[],quantity:number}[]};
export type Learning={attempts:number,mistakes:number,reviews:number,streak:number,mastered:boolean};
export const CONFIG={maxHealth:20,maxHunger:20,maxSaturation:5,damage:6,armorReductionPerPoint:.025,heal:2,healThresholdHunger:18,healHunger:1,healSaturation:1,foodHunger:5,foodSaturation:3,reviewBase:3,reviewMistakeCap:5,reviewQuestions:10};
export function matches(grid:Cell[],r:Recipe):boolean{
 const occupied=grid.filter((s):s is Stack=>!!s&&s.n>0);
 if(r.shapeless){const needs=r.pattern.flat().filter((x):x is string[]=>!!x);if(needs.length!==occupied.length)return false;
  const assign=(i:number,used:Set<number>):boolean=>i===needs.length||occupied.some((s,j)=>!used.has(j)&&needs[i].includes(s.id)&&assign(i+1,new Set([...used,j])));return assign(0,new Set());}
 const h=r.pattern.length,w=r.pattern[0].length;
 for(let y=0;y<=3-h;y++)for(let x=0;x<=3-w;x++)for(const mirror of [false,true]){
  if(grid.every((s,i)=>{let row=Math.floor(i/3)-y,col=i%3-x;let allowed=row>=0&&row<h&&col>=0&&col<w?r.pattern[row][mirror?w-1-col:col]:null;return allowed?!!s&&s.n>0&&allowed.includes(s.id):!s;}))return true;
 }return false;
}
export function consume(grid:Cell[]):Cell[]{return grid.map(s=>s&&s.n>1?{...s,n:s.n-1}:null);}
export function stackLimit(id:string):number{return /_(pickaxe|axe|shovel|hoe|sword|helmet|chestplate|leggings|boots|boat)$/.test(id)||id==='shield'||id==='flint_and_steel'?1:['bucket','ender_pearl'].includes(id)?16:64;}
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
export const emptyLearning=():Learning=>({attempts:0,mistakes:0,reviews:0,streak:0,mastered:false});
export function required(p:Learning){return CONFIG.reviewBase+Math.min(p.mistakes,CONFIG.reviewMistakeCap);}
export function record(p:Learning|undefined,correct:boolean,review:boolean):Learning{
 const n={...(p||emptyLearning())};n.attempts++;if(!correct){n.mistakes++;n.streak=0;n.mastered=false;}else if(review){n.reviews++;n.streak++;n.mastered=n.streak>=required(n);}return n;
}
export function selectWeak(ids:string[],progress:Record<string,Learning>,last:string,random=Math.random){
 let pool=ids.filter(id=>progress[id]?.mistakes>0&&!progress[id].mastered);if(pool.length>1)pool=pool.filter(id=>id!==last);if(!pool.length)return null;
 let cursor=random()*pool.reduce((s,id)=>s+1+progress[id].mistakes,0);return pool.find(id=>(cursor-=1+progress[id].mistakes)<0)||pool.at(-1)!;
}
export type Survival={health:number,hunger:number,saturation:number,armor:Record<string,string>};
export const freshSurvival=():Survival=>({health:CONFIG.maxHealth,hunger:CONFIG.maxHunger,saturation:CONFIG.maxSaturation,armor:{}});
export const armorPoints:Record<string,number>={iron_helmet:2,iron_chestplate:6,iron_leggings:5,iron_boots:2};
export function damage(s:Survival):Survival{const points=Object.values(s.armor).reduce((n,id)=>n+(armorPoints[id]||0),0);return {...s,health:Math.max(0,s.health-CONFIG.damage*(1-points*CONFIG.armorReductionPerPoint))};}
export function heal(s:Survival):Survival{return s.health>0&&s.health<CONFIG.maxHealth&&s.hunger>=CONFIG.healThresholdHunger&&s.saturation>=CONFIG.healSaturation?{...s,health:Math.min(CONFIG.maxHealth,s.health+CONFIG.heal),hunger:s.hunger-CONFIG.healHunger,saturation:s.saturation-CONFIG.healSaturation}:s;}
export function eat(s:Survival):Survival{return heal({...s,hunger:Math.min(CONFIG.maxHunger,s.hunger+CONFIG.foodHunger),saturation:Math.min(CONFIG.maxSaturation,s.saturation+CONFIG.foodSaturation)});}
export const normalize=(s:string)=>s.toLocaleLowerCase('nb-NO').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').replace(/ø/g,'o').replace(/å/g,'a');
export type Saved={version:1,language:'en'|'no',difficulty:'easy'|'hard',progress:Record<string,Learning>};
export function parseSaved(raw:string|null):Saved{
 const fallback:Saved={version:1,language:'en',difficulty:'easy',progress:{}};
 try{const v=JSON.parse(raw||'null');if(!v||v.version!==1)return fallback;fallback.language=v.language==='no'?'no':'en';fallback.difficulty=v.difficulty==='hard'?'hard':'easy';
 for(const [id,p] of Object.entries(v.progress||{})){const n=p as Learning;if(n&&['attempts','mistakes','reviews','streak'].every(k=>Number.isSafeInteger(n[k as keyof Learning])&&Number(n[k as keyof Learning])>=0)&&typeof n.mastered==='boolean')fallback.progress[id]=n;}return fallback;}catch{return fallback;}
}
export function stash(inventory:Cell[],sources:Cell[]):Cell[]{
 const out=inventory.map(s=>s?{...s}:null);
 for(const source of sources){if(!source)continue;let n=source.n;for(const s of out){if(s?.id===source.id){const amount=Math.min(stackLimit(s.id)-s.n,n);s.n+=amount;n-=amount;}}
 while(n){const amount=Math.min(stackLimit(source.id),n),empty=out.findIndex(s=>!s);if(empty>=0)out[empty]={id:source.id,n:amount};else out.push({id:source.id,n:amount});n-=amount;}}
 return out;
}
