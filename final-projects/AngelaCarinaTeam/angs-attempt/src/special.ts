import type {Cell,Recipe} from './engine';
export const COLORS=['white','orange','magenta','light_blue','yellow','lime','pink','gray','light_gray','cyan','purple','blue','brown','green','red','black'];
const dyes=COLORS.map(c=>c+'_dye'),armor=['leather_helmet','leather_chestplate','leather_leggings','leather_boots','leather_horse_armor'];
const flowers=['dandelion','poppy','blue_orchid','allium','azure_bluet','red_tulip','orange_tulip','white_tulip','pink_tulip','oxeye_daisy','cornflower','lily_of_the_valley','wither_rose'];
const template=(output:string,rows:(string[]|null)[][],note:string,count=1,shapeless=true)=>({output,pattern:rows,note,count,shapeless});
const one=(...ids:string[])=>[ids.map(id=>[id])];
export const SPECIAL={
 armor_dye:template('leather_chestplate',[[armor,dyes]],'Dye one piece of leather armor using one or more dyes. This trainer models the ingredient rule, not the resulting RGB color.'),
 banner_duplicate:template('white_banner#patterned',one('white_banner#patterned','white_banner'),'Copy a patterned banner onto a blank banner of the same base color. The patterned original is retained.'),
 book_cloning:template('written_book#copy',one('written_book#original','writable_book'),'Copy an original or first-generation written book onto one or more writable books. The written original is retained.'),
 firework_rocket:template('firework_rocket',one('paper','gunpowder'),'Use one paper, 1–3 gunpowder in separate slots, and optional firework stars. Produces three rockets.',3),
 firework_star:template('firework_star',one('gunpowder','red_dye'),'Use one gunpowder and at least one dye. Optional: one shape ingredient, one diamond and one glowstone dust.'),
 firework_star_fade:template('firework_star#faded',one('firework_star','red_dye'),'Add one or more dyes to one firework star to set its fade colors.'),
 map_cloning:template('filled_map#copy',one('filled_map#scale0','map'),'Copy one filled map onto one or more empty maps. The output count includes the original.',2),
 map_extending:template('filled_map#scale1',[[['paper'],['paper'],['paper']],[['paper'],['filled_map#scale0','filled_map#scale1','filled_map#scale2','filled_map#scale3'],['paper']],[['paper'],['paper'],['paper']]],'Surround a filled, non-explorer map below scale 4 with eight paper. The scale increases by one.',1,false),
 repair_item:template('wooden_pickaxe',one('wooden_pickaxe#damaged','wooden_pickaxe#damaged'),'Combine two single, identical damageable items. The trainer models compatible ingredients; durability and enchantment math are not simulated.'),
 shield_decoration:template('shield#decorated',one('shield','white_banner#patterned'),'Decorate an undecorated shield with one banner. Banner patterns are represented by a labeled training item.'),
 shulker_box_coloring:template('red_shulker_box',[[['shulker_box',...COLORS.map(c=>c+'_shulker_box')],dyes]],'Dye one shulker box using exactly one dye.'),
 suspicious_stew:template('suspicious_stew',[[['bowl'],['red_mushroom'],['brown_mushroom']],[flowers]],'Use a bowl, one red mushroom, one brown mushroom and one small flower. The flower controls its effect.'),
 tipped_arrow:template('tipped_arrow',[[['arrow'],['arrow'],['arrow']],[['arrow'],['lingering_potion'],['arrow']],[['arrow'],['arrow'],['arrow']]],'Surround one lingering potion with eight arrows. Potion effects are carried conceptually; this is an ingredient-layout exercise.',8,false),
} as const;
const base=(id:string)=>id.split('#')[0];
const damageable=(id:string)=>/_(pickaxe|axe|shovel|hoe|sword|helmet|chestplate|leggings|boots)$/.test(base(id))||['bow','crossbow','fishing_rod','flint_and_steel','shears','shield','elytra','trident','carrot_on_a_stick','warped_fungus_on_a_stick'].includes(base(id));
export function matchSpecial(grid:Cell[],r:Recipe):boolean|null{
 if(!r.special)return null;const ids=grid.filter(Boolean).map(s=>s!.id),count=(id:string)=>ids.filter(v=>v===id).length;
 switch(r.special){
 case 'armor_dye':return ids.filter(v=>armor.includes(base(v))).length===1&&ids.filter(v=>dyes.includes(v)).length>=1&&ids.every(v=>armor.includes(base(v))||dyes.includes(v));
 case 'banner_duplicate':{const patterned=ids.filter(v=>v.endsWith('_banner#patterned'));return ids.length===2&&patterned.length===1&&ids.includes(base(patterned[0]));}
 case 'book_cloning':return ids.length>=2&&ids.filter(v=>['written_book#original','written_book#copy'].includes(v)).length===1&&ids.filter(v=>v==='writable_book').length===ids.length-1;
 case 'firework_rocket':return count('paper')===1&&count('gunpowder')>=1&&count('gunpowder')<=3&&ids.every(v=>['paper','gunpowder','firework_star','firework_star#faded'].includes(v));
 case 'firework_star':{const shapes=['fire_charge','gold_nugget','feather','skeleton_skull','wither_skeleton_skull','creeper_head','player_head','zombie_head','dragon_head'];return count('gunpowder')===1&&ids.some(v=>dyes.includes(v))&&count('diamond')<=1&&count('glowstone_dust')<=1&&ids.filter(v=>shapes.includes(v)).length<=1&&ids.every(v=>dyes.includes(v)||shapes.includes(v)||['gunpowder','diamond','glowstone_dust'].includes(v));}
 case 'firework_star_fade':return ids.filter(v=>base(v)==='firework_star').length===1&&ids.some(v=>dyes.includes(v))&&ids.every(v=>base(v)==='firework_star'||dyes.includes(v));
 case 'map_cloning':return ids.length>=2&&ids.filter(v=>v.startsWith('filled_map#')).length===1&&count('map')===ids.length-1;
 case 'repair_item':return ids.length===2&&base(ids[0])===base(ids[1])&&damageable(ids[0])&&grid.filter(Boolean).every(s=>s!.n===1);
 case 'shield_decoration':return ids.length===2&&count('shield')===1&&ids.some(v=>base(v).endsWith('_banner'));
 case 'shulker_box_coloring':return ids.length===2&&ids.filter(v=>v==='shulker_box'||v.endsWith('_shulker_box')).length===1&&ids.some(v=>dyes.includes(v));
 default:return null; // Shaped arrow/map and flower stew use their explicit ingredient patterns.
 }
}
export function specialResult(grid:Cell[],r:Recipe):{id:string,n:number}{
 const ids=grid.filter(Boolean).map(s=>s!.id);let id=r.output,n=r.count;
 if(r.special==='armor_dye')id=ids.find(v=>armor.includes(base(v)))!.split('#')[0]+'#dyed';
 if(r.special==='banner_duplicate')id=ids.find(v=>v.endsWith('#patterned'))!;
 if(r.special==='book_cloning')n=ids.filter(v=>v==='writable_book').length;
 if(r.special==='map_cloning')n=ids.filter(v=>v==='map').length+1;
 if(r.special==='map_extending')id='filled_map#scale'+(Number(ids[4].split('#scale')[1])+1);
 if(r.special==='repair_item')id=base(ids[0]);
 if(r.special==='shulker_box_coloring')id=ids.find(v=>dyes.includes(v))!.replace('_dye','_shulker_box');
 return {id,n};
}
export function specialRemainder(id:string,r?:Recipe){return r?.special==='banner_duplicate'&&id.endsWith('#patterned')||r?.special==='book_cloning'&&id.startsWith('written_book#');}

export const SPECIAL_ITEMS=['fire_charge','gold_nugget','feather','diamond','glowstone_dust','skeleton_skull','wither_skeleton_skull','creeper_head','player_head','zombie_head','dragon_head',...COLORS.map(c=>c+'_banner#patterned'),'written_book#original','written_book#copy',...Array.from({length:4},(_,i)=>'filled_map#scale'+i)];
