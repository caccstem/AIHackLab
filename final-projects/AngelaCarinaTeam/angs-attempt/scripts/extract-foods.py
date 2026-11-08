"""Extract food nutrition/modifiers from Mojang's 1.16.1 bytecode and mappings."""
import pathlib,re,json,subprocess,hashlib
root=pathlib.Path(__file__).resolve().parents[1];raw=(root/'data/client.jar').read_bytes()
assert hashlib.sha1(raw).hexdigest()==json.loads((root/'data/vanilla.json').read_text())['source']['sha1']
mappings=(root/'data/client-mappings.txt').read_text();section=mappings.split('net.minecraft.world.food.Foods -> ')[1];cls=section.split(':')[0]
props=re.search(r'^net\.minecraft\.world\.food\.FoodProperties -> (\w+):',mappings,re.M)[1]
fields={ob:name.lower() for name,ob in re.findall(r'FoodProperties (\w+) -> (\w+)',section.split('net.minecraft.world.food.package-info')[0])}
code=subprocess.check_output(['javap','-c','-p','-classpath',str(root/'data/client.jar'),cls],text=True);(root/'data/foods-disassembly.txt').write_text(code)
static=code.split('static {};')[1];foods={};start=0
notes={
 'golden_apple':'Regeneration II (5 seconds) and Absorption I (2 minutes) are not simulated; only nutrition is applied.',
 'enchanted_golden_apple':'Regeneration II, Absorption IV, Resistance and Fire Resistance effects are not simulated.',
 'suspicious_stew':'Flower-dependent status effects are not simulated; only base nutrition is applied.',
 'chorus_fruit':'Random teleportation is not simulated.',
 'chicken':'30% Hunger effect is not simulated.',
 'rotten_flesh':'80% Hunger effect is not simulated.',
 'poisonous_potato':'60% Poison effect is not simulated.',
 'pufferfish':'Poison, Hunger and Nausea effects are not simulated.',
 'spider_eye':'Poison effect is not simulated.',
 'honey_bottle':'Returns a glass bottle. Poison removal has no effect in this trainer, which does not simulate poison.',
}
for end in re.finditer(r'putstatic[^\n]+// Field (\w+):L'+props+r';',static):
 part=static[start:end.start()];start=end.end();field=end[1]
 if field not in fields:continue
 id=fields[field]
 ints=re.findall(r'(?:iconst_(\d)|bipush\s+(\d+)|sipush\s+(\d+))\s*\n[^\n]+(?:invokevirtual[^\n]+\.a:\(I\)|invokestatic[^\n]+a:\(I\))',part)
 if not ints:raise ValueError('Nutrition missing '+id)
 nutrition=int(next(v for v in ints[0] if v))
 mods=re.findall(r'// float ([0-9.]+)f\s*\n[^\n]+invokevirtual[^\n]+\.a:\(F\)',part)
 if mods:modifier=float(mods[0])
 elif 'invokestatic' in part:modifier=.6 # Foods.stew(int), verified above the static initializer.
 else:raise ValueError('Modifier missing '+id)
 remainder='bowl' if id.endswith('_stew') or id=='beetroot_soup' else 'glass_bottle' if id=='honey_bottle' else None
 foods[id]={'nutrition':nutrition,'saturationModifier':modifier,'saturation':round(nutrition*modifier*2,4),'remainder':remainder,'note':notes.get(id,''),'edible':True}
assert len(foods)==39,len(foods)
# Verify CakeBlock's placed-food behavior too; never pretend its item is an ordinary food.
cake_cls=re.search(r'^net\.minecraft\.world\.level\.block\.CakeBlock -> (\w+):',mappings,re.M)[1]
cake_code=subprocess.check_output(['javap','-c','-p','-classpath',str(root/'data/client.jar'),cake_cls],text=True)
(root/'data/cake-disassembly.txt').write_text(cake_code)
assert re.search(r'iconst_2\s*\n[^\n]+ldc[^\n]+float 0\.1f\s*\n[^\n]+invokevirtual[^\n]+\(IF\)V',cake_code), 'Cake nutrition must be rechecked'

foods['cake']={'nutrition':2,'saturationModifier':.1,'saturation':.4,'remainder':None,'note':'Cake must be placed and eaten in seven separate bites. Placed-block eating is not simulated; earned cakes can be stored but cannot be eaten here. Values shown are per bite.','edible':False}
(root/'data/foods.json').write_text(json.dumps(foods,indent=2,sort_keys=True))
print('Extracted 39 verified food values plus the explicitly unsupported placed-cake case.')
