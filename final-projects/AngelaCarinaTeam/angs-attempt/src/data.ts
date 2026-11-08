import vanilla from '../data/trainer.json' with {type:'json'};
import textureMap from '../data/textures.json' with {type:'json'};
import type {Recipe} from './engine';
import {SPECIAL,SPECIAL_ITEMS} from './special.ts';
import {isSpeedrunning} from './preferences.ts';
type Ingredient={item?:string,tag?:string}|{item?:string,tag?:string}[];
type RawRecipe={type:string,pattern?:string[],key?:Record<string,Ingredient>,ingredients?:Ingredient[],result?:{item:string,count?:number}};
const strip=(s:string)=>s.replace('minecraft:','');
const tags=vanilla.tags as Record<string,string[]>;
function expand(i:Ingredient):string[]{if(Array.isArray(i))return [...new Set(i.flatMap(expand))];if(i.item)return [strip(i.item)];return (tags[strip(i.tag||'')]||[]).flatMap(v=>v.startsWith('#')?expand({tag:v.slice(1)}):[strip(v)]);}
export type Lang='en'|'no';
export const languages=vanilla.languages as Record<Lang,Record<string,string>>;
export function itemName(id:string,lang:Lang):string{const [base,variant]=id.split('#');const name=languages[lang]['item.minecraft.'+base]||languages[lang]['block.minecraft.'+base]||base.replaceAll('_',' ');return name+(variant?' ('+variant.replaceAll('_',' ')+')':'');}
export const recipes:Recipe[]=Object.entries(vanilla.recipes).map(([id,raw])=>{
 const r=raw as RawRecipe,special=!r.result?id:undefined,example=special?SPECIAL[special as keyof typeof SPECIAL]:null;
 if(special&&!example)throw Error('Missing special recipe support: '+id);
 const shapeless=example?example.shapeless:r.type.endsWith('shapeless');
 const list=(r.ingredients||[]).map(expand);
 const pattern:(string[]|null)[][]=example?JSON.parse(JSON.stringify(example.pattern)):shapeless?Array.from({length:Math.ceil(list.length/3)},(_,i)=>list.slice(i*3,i*3+3)):(r.pattern||[]).map(row=>[...row].map(c=>r.key?.[c]?expand(r.key[c]):null));
 const ingredients:{alternatives:string[],quantity:number}[]=[];for(const a of pattern.flat()){if(!a)continue;const found=ingredients.find(i=>i.alternatives.join()===a.join());if(found)found.quantity++;else ingredients.push({alternatives:a,quantity:1});}
 const output=example?.output||strip(r.result!.item);
 return {id,output,count:example?.count||r.result?.count||1,special,note:example?.note,speedrunning:isSpeedrunning(output),names:{en:itemName(output,'en'),no:itemName(output,'no')},pattern,shapeless,ingredients,difficulty:Math.min(3,Math.max(1,Math.ceil(pattern.flat().filter(Boolean).length/3)))};
});
export const itemIds=[...new Set([...SPECIAL_ITEMS,...recipes.flatMap(r=>[r.output,...r.ingredients.flatMap(i=>i.alternatives)])])].sort();
export function texture(id:string){const base=id.split('#')[0];const file=(textureMap as Record<string,string>)[base];return file?`${import.meta.env?.BASE_URL||'./'}assets/${file}`:'';}
