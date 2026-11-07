"""Extract the selected recipes, translations and textures from Mojang's 1.16.1 client."""
import subprocess,json,zipfile,io,hashlib,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
def get(url):
    return subprocess.check_output(['curl','-LsSf',url])
def js(url):return json.loads(get(url))
manifest=js('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json')
meta=js(next(v['url'] for v in manifest['versions'] if v['id']=='1.16.1'))
b=get(meta['downloads']['client']['url'])
assert hashlib.sha1(b).hexdigest()==meta['downloads']['client']['sha1']
z=zipfile.ZipFile(io.BytesIO(b)); assets=js(meta['assetIndex']['url'])
langs={'en':json.loads(z.read('assets/minecraft/lang/en_us.json'))}
obj=assets['objects']['minecraft/lang/no_no.json']; raw=get('https://resources.download.minecraft.net/'+obj['hash'][:2]+'/'+obj['hash'])
assert hashlib.sha1(raw).hexdigest()==obj['hash'];langs['no']=json.loads(raw)
ids=['crafting_table','stick','furnace','bowl','bucket','shield','bread','gold_ingot_from_nuggets','gold_block','ender_eye','blaze_powder','flint_and_steel']
for mat in ['wooden','stone','iron']:
    ids += [mat+'_'+t for t in ['pickaxe','axe','shovel','hoe','sword']]
ids += ['iron_'+a for a in ['helmet','chestplate','leggings','boots']]
for wood in ['oak','spruce','birch','jungle','acacia','dark_oak']:ids += [wood+'_boat',wood+'_door']
recipes={i:json.loads(z.read('data/minecraft/recipes/'+i+'.json')) for i in ids}
tags={}
for name in z.namelist():
    if name.startswith('data/minecraft/tags/items/') and name.endswith('.json'):tags[name.split('/')[-1][:-5]]=json.loads(z.read(name))['values']
(root/'data/vanilla.json').write_text(json.dumps({'version':'1.16.1','recipes':recipes,'tags':tags,'languages':langs,'source':meta['downloads']['client']},ensure_ascii=False))
for name in z.namelist():
    if name.startswith(('assets/minecraft/textures/item/','assets/minecraft/textures/block/')) and name.endswith('.png'):
        p=root/'public/assets'/name.split('textures/')[1];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
print('Verified SHA-1; extracted',len(recipes),'recipes, official languages and textures.')

subprocess.run(['python3',str(root/'scripts/prepare-data.py')],check=True)
