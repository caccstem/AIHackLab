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
(root/'data/client.jar').write_bytes(b)
z=zipfile.ZipFile(io.BytesIO(b)); assets=js(meta['assetIndex']['url'])
langs={'en':json.loads(z.read('assets/minecraft/lang/en_us.json'))}
obj=assets['objects']['minecraft/lang/no_no.json']; raw=get('https://resources.download.minecraft.net/'+obj['hash'][:2]+'/'+obj['hash'])
assert hashlib.sha1(raw).hexdigest()==obj['hash'];langs['no']=json.loads(raw)
recipes={}
for name in z.namelist():
    if name.startswith('data/minecraft/recipes/') and name.endswith('.json'):
        recipe=json.loads(z.read(name))
        if recipe['type'].startswith('minecraft:crafting_'):
            recipes[name.split('/')[-1][:-5]]=recipe
tags={}
for name in z.namelist():
    if name.startswith('data/minecraft/tags/items/') and name.endswith('.json'):tags[name.split('/')[-1][:-5]]=json.loads(z.read(name))['values']
(root/'data/vanilla.json').write_text(json.dumps({'version':'1.16.1','recipes':recipes,'tags':tags,'languages':langs,'source':meta['downloads']['client']},ensure_ascii=False))
for name in z.namelist():
    if name.startswith(('assets/minecraft/textures/item/','assets/minecraft/textures/block/')) and name.endswith('.png'):
        p=root/'public/assets'/name.split('textures/')[1];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
(root/'data/client-mappings.txt').write_bytes(get(meta['downloads']['client_mappings']['url']))
print('Verified SHA-1; extracted',len(recipes),'recipes, official languages and textures.')

subprocess.run(['python3',str(root/'scripts/prepare-data.py')],check=True)
