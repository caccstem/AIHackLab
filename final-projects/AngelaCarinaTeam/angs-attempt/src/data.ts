import vanilla from '../data/trainer.json' with {type:'json'};
import type {Recipe} from './engine';
type Ingredient={item?:string,tag?:string};
type RawRecipe={type:string,pattern?:string[],key?:Record<string,Ingredient>,ingredients?:Ingredient[],result:{item:string,count?:number}};
const strip=(s:string)=>s.replace('minecraft:','');
const tags=vanilla.tags as Record<string,string[]>;
function expand(i:Ingredient):string[]{if(i.item)return [strip(i.item)];return (tags[strip(i.tag||'')]||[]).flatMap(v=>v.startsWith('#')?expand({tag:v.slice(1)}):[strip(v)]);}
export type Lang='en'|'no';
export const languages=vanilla.languages as Record<Lang,Record<string,string>>;
export function itemName(id:string,lang:Lang):string{return languages[lang]['item.minecraft.'+id]||languages[lang]['block.minecraft.'+id]||id.replaceAll('_',' ');}
export const recipes:Recipe[]=Object.entries(vanilla.recipes).map(([id,raw])=>{
 const r=raw as RawRecipe;const shapeless=r.type.endsWith('shapeless');
 const pattern=shapeless?[(r.ingredients||[]).map(expand)]:(r.pattern||[]).map(row=>[...row].map(c=>r.key?.[c]?expand(r.key[c]):null));
 const ingredients:{alternatives:string[],quantity:number}[]=[];for(const a of pattern.flat()){if(!a)continue;const found=ingredients.find(i=>i.alternatives.join()===a.join());if(found)found.quantity++;else ingredients.push({alternatives:a,quantity:1});}
 const output=strip(r.result.item);return {id,output,count:r.result.count||1,names:{en:itemName(output,'en'),no:itemName(output,'no')},searchTerms:{en:[itemName(output,'en'),...ingredients.flatMap(i=>i.alternatives.map(id=>itemName(id,'en')))],no:[itemName(output,'no'),...ingredients.flatMap(i=>i.alternatives.map(id=>itemName(id,'no')))]},pattern,shapeless,ingredients,difficulty:/iron_|shield|gold_block/.test(output)?3:/stone_|boat|door|ender_eye|bucket/.test(output)?2:1};
});
export const itemIds=[...new Set(recipes.flatMap(r=>[r.output,...r.ingredients.flatMap(i=>i.alternatives)]))].sort();
export const terms=[
 ['enchantment.minecraft.looting','Enchantment','Looting III'],
 ['subtitles.block.lava.ambient','Sound subtitle',''],
 ['subtitles.block.lava.extinguish','Sound subtitle',''],
 ['subtitles.entity.silverfish.ambient','Sound subtitle',''],
 ['subtitles.entity.silverfish.hurt','Sound subtitle',''],
 ['subtitles.entity.silverfish.death','Sound subtitle',''],
 ['debug.localDifficulty','World vocabulary',''],
];
export function texture(id:string){const blocks=['crafting_table','furnace','gold_block','cobblestone','blackstone','oak_planks','spruce_planks','birch_planks','jungle_planks','acacia_planks','dark_oak_planks','crimson_planks','warped_planks'];let file=id==='crafting_table'?'crafting_table_front':id==='furnace'?'furnace_front':id;return `${import.meta.env?.BASE_URL||'./'}assets/${blocks.includes(id)?'block':'item'}/${file}.png`;}
