"""Record the official special crafting implementation used to check trainer rules.
Run after import-minecraft.py. Requires the JDK javap utility; never runs the client.
"""
import pathlib,re,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
mappings=(root/'data/client-mappings.txt').read_text()
names=['ArmorDyeRecipe','BannerDuplicateRecipe','BookCloningRecipe','FireworkRocketRecipe','FireworkStarFadeRecipe','FireworkStarRecipe','MapCloningRecipe','MapExtendingRecipe','RepairItemRecipe','ShieldDecorationRecipe','ShulkerBoxColoring','SuspiciousStewRecipe','TippedArrowRecipe']
parts=[]
for name in names:
    match=re.search(r'^net\.minecraft\.world\.item\.crafting\.'+name+r' -> (\w+):',mappings,re.M)
    if not match:raise ValueError(name)
    result=subprocess.check_output(['javap','-c','-p','-classpath',str(root/'data/client.jar'),match[1]],text=True)
    parts.append(name+'\n'+result)
(root/'data/special-disassembly.txt').write_text('\n'.join(parts))
print('Disassembled all 13 official special crafting implementations for ingredient-rule verification.')
