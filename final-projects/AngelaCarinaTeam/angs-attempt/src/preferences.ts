// Adjust weighting here; non-speedrunning recipes always retain positive weight.
export const SELECTION={speedrunningWeight:4,otherWeight:1};
export function isSpeedrunning(id:string):boolean{
 return /^(iron|stone)_(pickaxe|axe|shovel|hoe|sword)$/.test(id)||['golden_pickaxe','golden_axe','shears','stick','bucket','flint_and_steel','bow','respawn_anchor','blaze_powder','ender_eye','golden_helmet','nether_bricks','bread'].includes(id)||/^(iron|gold)_ingot$/.test(id)||id.endsWith('_pressure_plate')||id.endsWith('_door')||id.endsWith('_boat')||id.endsWith('_wool')||id.endsWith('_bed');
}
export const recipeWeight=(output:string)=>isSpeedrunning(output)?SELECTION.speedrunningWeight:SELECTION.otherWeight;
export function weightedPick<T>(pool:T[],weight:(value:T)=>number,random=Math.random):T|null{
 if(!pool.length)return null;let n=random()*pool.reduce((sum,v)=>sum+weight(v),0);return pool.find(v=>(n-=weight(v))<0)||pool.at(-1)!;
}
export function weightedOrder<T>(pool:T[],weight:(value:T)=>number,random=Math.random):T[]{const rest=[...pool],out:T[]=[];while(rest.length){const chosen=weightedPick(rest,weight,random)!;out.push(chosen);rest.splice(rest.indexOf(chosen),1);}return out;}
// Literal, user-approved instructional strings. No translation or name fallback.
export const SEARCH_HINTS:{en:Record<string,string[]>,no:Record<string,string[]>}={
 no:{golden_helmet:['Lh'],golden_pickaxe:['Lh','Lma'],bed:['N/L'],iron_sword:['Nsv'],nether_bricks:['he'],stick:['pi'],bow:['ue'],respawn_anchor:['V/IV'],iron_ingot:['Ba'],wool:['u'],blaze_powder:['LV'],ender_eye:['øY'],iron_axe:['nø']},
 en:{iron_tools:['ro'],bed:['ro'],respawn_anchor:['re'],bow:['ow']},
};
export function searchHints(output:string,language:'en'|'no'):string[]{
 if(!isSpeedrunning(output))return [];
 const key=output.endsWith('_bed')?'bed':output.endsWith('_wool')?'wool':language==='en'&&/^iron_(pickaxe|axe|shovel|hoe|sword)$/.test(output)?'iron_tools':output;
 return SEARCH_HINTS[language][key]||[];
}
// Pairings intentionally match the user's screenshot, including its spelling.
export const VOCABULARY=[
 ['plyndring','looting'],['velende','silk touch'],['silkeberøring','mending'],['effektivitet','efficiency'],
 ['lava pops','lavaen bobler'],['silverfish hisses','sølvkre hveser'],['blaze crackles','flammeskrømt spraker'],['blaze breathes','flammeskrømt puster'],
 ['easy','lett'],['normal','vanlig'],['hard','vanskeli'],
] as const;
