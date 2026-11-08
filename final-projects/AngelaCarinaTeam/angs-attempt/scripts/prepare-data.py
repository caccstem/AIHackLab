"""Make a small UI dataset while retaining untouched source JSON for audit."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
v=json.loads((root/'data/vanilla.json').read_text())
items=set();used_tags=set()
def ingredient(i):
    if isinstance(i,list):
        for option in i:ingredient(option)
        return
    if 'item' in i:items.add(i['item'].split(':')[-1])
    if 'tag' in i:
        tag=i['tag'].split(':')[-1]
        if tag in used_tags:return
        used_tags.add(tag)
        for value in v['tags'][tag]:ingredient({'tag':value[1:]} if value.startswith('#') else {'item':value})
for r in v['recipes'].values():

    if 'result' not in r:continue
    items.add(r['result']['item'].split(':')[-1])
    for i in list(r.get('key',{}).values())+r.get('ingredients',[]):ingredient(i)
keys={'enchantment.minecraft.looting','subtitles.block.lava.ambient','subtitles.block.lava.extinguish','subtitles.entity.silverfish.ambient','subtitles.entity.silverfish.hurt','subtitles.entity.silverfish.death','container.crafting','itemGroup.search'}
keys.update(k for k in v['languages']['en'] if k.startswith(('item.minecraft.','block.minecraft.')))
items.update(k.split('.',2)[2] for k in keys if k.startswith(('item.minecraft.','block.minecraft.')))
small={**v,'tags':{k:v['tags'][k] for k in used_tags},'languages':{lang:{k:val for k,val in values.items() if k in keys} for lang,values in v['languages'].items()}}
(root/'data/trainer.json').write_text(json.dumps(small,ensure_ascii=False))
# Never use raw block textures as inventory icons. Reuse only audited renders.
audit_path=root/'data/icon-audit.json'
audit=json.loads(audit_path.read_text()) if audit_path.exists() else {}
textures={id:'icons/'+id+'.png' for id in audit.get('rendered',{}) if (root/'public/assets/icons'/(id+'.png')).exists()} if audit.get('sha1')==v['source']['sha1'] else {}
(root/'data/textures.json').write_text(json.dumps(textures,sort_keys=True))
print('Prepared',len(items),'items and',len(used_tags),'ingredient tags; using',len(textures),'audited inventory renders.')
