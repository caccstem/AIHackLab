"""Make a small UI dataset while retaining untouched source JSON for audit."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
v=json.loads((root/'data/vanilla.json').read_text())
items=set();used_tags=set()
def ingredient(i):
    if 'item' in i:items.add(i['item'].split(':')[-1])
    if 'tag' in i:
        tag=i['tag'].split(':')[-1]
        if tag in used_tags:return
        used_tags.add(tag)
        for value in v['tags'][tag]:ingredient({'tag':value[1:]} if value.startswith('#') else {'item':value})
for r in v['recipes'].values():
    items.add(r['result']['item'].split(':')[-1])
    for i in list(r.get('key',{}).values())+r.get('ingredients',[]):ingredient(i)
keys={'enchantment.minecraft.looting','subtitles.block.lava.ambient','subtitles.block.lava.extinguish','subtitles.entity.silverfish.ambient','subtitles.entity.silverfish.hurt','subtitles.entity.silverfish.death','container.crafting','itemGroup.search'}
keys.update(kind+'.minecraft.'+i for i in items for kind in ['item','block'])
small={**v,'tags':{k:v['tags'][k] for k in used_tags},'languages':{lang:{k:val for k,val in values.items() if k in keys} for lang,values in v['languages'].items()}}
(root/'data/trainer.json').write_text(json.dumps(small,ensure_ascii=False))
# Include only used vanilla textures, rather than the complete resource pack.
blocks={'crafting_table':'crafting_table_front','furnace':'furnace_front','gold_block':'gold_block','cobblestone':'cobblestone','blackstone':'blackstone',**{wood+'_planks':wood+'_planks' for wood in ['oak','spruce','birch','jungle','acacia','dark_oak','crimson','warped']}}
keep={('block' if i in blocks else 'item')+'/'+blocks.get(i,i)+'.png' for i in items}
for p in (root/'public/assets').rglob('*.png'):
    if p.relative_to(root/'public/assets').as_posix() not in keep:p.unlink()
print('Prepared',len(items),'items and',len(used_tags),'ingredient tags.')
