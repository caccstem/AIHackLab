"""Render 1.16.1 item models with their GUI transforms and square animation frames.
Requires Pillow. Reads the hash-verified official client; no substitute texture guesses.
"""
import json,zipfile,hashlib,io,math,pathlib
from PIL import Image,ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[1]
raw=(ROOT/'data/client.jar').read_bytes()
assert hashlib.sha1(raw).hexdigest()==json.loads((ROOT/'data/vanilla.json').read_text())['source']['sha1']
z=zipfile.ZipFile(io.BytesIO(raw));names=set(z.namelist());cache={};frames={};source_info={};N=64
out=ROOT/'public/assets/icons';out.mkdir(parents=True,exist_ok=True)
def model(name,chain=()):
 name=name.replace('minecraft:','')
 if name in cache:return cache[name]
 if name in chain:raise ValueError('Cyclic model')
 raw=json.loads(z.read('assets/minecraft/models/'+name+'.json'))
 parent=raw.get('parent','')
 result={'textures':{},'display':{},'elements':[]}
 if parent and not parent.startswith('builtin/'):
  result=model(parent,chain+(name,)).copy()
  result['textures']=dict(result.get('textures',{}));result['display']=dict(result.get('display',{}))
 elif parent:result['builtin']=parent
 for k,v in raw.items():
  if k in ['textures','display']:result[k]={**result.get(k,{}),**v}
  elif k!='parent':result[k]=v
 cache[name]=result;return result
def texture(ref,m):
 seen=set()
 while ref.startswith('#'):
  if ref in seen:raise ValueError('Cyclic texture')
  seen.add(ref);ref=m['textures'][ref[1:]]
 ref=ref.replace('minecraft:','')
 if ref in frames:return frames[ref]
 path='assets/minecraft/textures/'+ref+'.png';im=Image.open(io.BytesIO(z.read(path))).convert('RGBA')
 meta=json.loads(z.read(path+'.mcmeta')) if path+'.mcmeta' in names else {}
 source_info[ref]={'sourceSize':list(im.size),'animated':'animation' in meta}
 if 'animation' in meta:
  anim=meta['animation'];w=anim.get('width',im.width);h=anim.get('height',w);first=anim.get('frames',[0])[0];first=first.get('index',0) if isinstance(first,dict) else first
  columns=im.width//w;x=(first%columns)*w;y=(first//columns)*h;im=im.crop((x,y,x+w,y+h))
 if im.width!=im.height:raise ValueError('Non-square texture without animation metadata: '+ref)
 source_info[ref]['frameSize']=list(im.size)
 frames[ref]=im;return im
def rotate(p,angles):
 p=list(p)
 for axis in [2,1,0]:
  a=math.radians(angles[axis]);c,s=math.cos(a),math.sin(a);x,y,v=p
  if axis==0:p=[x,y*c-v*s,y*s+v*c]
  elif axis==1:p=[x*c+v*s,y,-x*s+v*c]
  else:p=[x*c-y*s,x*s+y*c,v]
 return p
def render(m):
 if m.get('builtin')=='builtin/entity':raise ValueError('Built-in entity model requires Minecraft entity renderer')
 if not m.get('elements'):
  layers=[k for k in m['textures'] if k.startswith('layer')]
  if not layers:raise ValueError('No renderable model geometry or item layers')
  # Tint-indexed item layers require their item-specific colors, not an arbitrary color.
  canvas=Image.new('RGBA',(N,N))
  for key in sorted(layers):canvas.alpha_composite(texture(m['textures'][key],m).resize((N,N),Image.Resampling.NEAREST))
  return canvas,'generated'
 gui=m.get('display',{}).get('gui',{});angles=gui.get('rotation',[0,0,0]);scale=gui.get('scale',[1,1,1]);translation=gui.get('translation',[0,0,0])
 canvas=Image.new('RGBA',(N,N));pixels=canvas.load();depth=[-1e9]*(N*N)
 for el in m['elements']:
  x0,y0,z0=el['from'];x1,y1,z1=el['to']
  verts={
   'north':[(x1,y1,z0),(x0,y1,z0),(x0,y0,z0),(x1,y0,z0)],
   'south':[(x0,y1,z1),(x1,y1,z1),(x1,y0,z1),(x0,y0,z1)],
   'west':[(x0,y1,z0),(x0,y1,z1),(x0,y0,z1),(x0,y0,z0)],
   'east':[(x1,y1,z1),(x1,y1,z0),(x1,y0,z0),(x1,y0,z1)],
   'up':[(x0,y1,z0),(x1,y1,z0),(x1,y1,z1),(x0,y1,z1)],
   'down':[(x0,y0,z1),(x1,y0,z1),(x1,y0,z0),(x0,y0,z0)]}
  defaults={'north':[16-x1,16-y1,16-x0,16-y0],'south':[x0,16-y1,x1,16-y0],'west':[z0,16-y1,z1,16-y0],'east':[16-z1,16-y1,16-z0,16-y0],'up':[x0,z0,x1,z1],'down':[x0,16-z1,x1,16-z0]}
  for face,info in el['faces'].items():
   # Item biome tint is not derivable from model texture alone. Explicitly report it.
   if 'tintindex' in info:raise ValueError('Tinted block model needs a verified item color provider')
   tex=texture(info['texture'],m);pts=[]
   for vertex in verts[face]:
    v=list(vertex)
    if 'rotation' in el:
     rot=el['rotation'];origin=rot.get('origin',[8,8,8]);axis='xyz'.index(rot['axis']);a=[0,0,0];a[axis]=rot['angle'];v=rotate([v[i]-origin[i] for i in range(3)],a)
     if rot.get('rescale'):
      for j in range(3):
       if j!=axis:v[j]/=math.cos(math.radians(rot['angle']))
     v=[v[i]+origin[i] for i in range(3)]
    v=rotate([(v[i]-8)*scale[i] for i in range(3)],angles);v=[v[i]+translation[i] for i in range(3)];pts.append((N/2+v[0]*N/16,N/2-v[1]*N/16,v[2]))
   u0,v0,u1,v1=info.get('uv',defaults[face]);uv=[(u0,v0),(u1,v0),(u1,v1),(u0,v1)];r=(info.get('rotation',0)//90)%4;uv=uv[r:]+uv[:r]
   shade=1 if face=='up' else .8 if face in ['north','south'] else .65 if face in ['east','west'] else .5
   if not el.get('shade',True):shade=1
   for indices in [(0,1,2),(0,2,3)]:
    a,b,c=[pts[i] for i in indices];ta,tb,tc=[uv[i] for i in indices];den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(den)<1e-6:continue
    for y in range(max(0,int(min(a[1],b[1],c[1]))),min(N,int(max(a[1],b[1],c[1]))+1)):
     for x in range(max(0,int(min(a[0],b[0],c[0]))),min(N,int(max(a[0],b[0],c[0]))+1)):
      xx,yy=x+.5,y+.5;w0=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;w1=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;w2=1-w0-w1
      if min(w0,w1,w2)<-1e-6:continue
      zz=w0*a[2]+w1*b[2]+w2*c[2];i=y*N+x
      if zz<depth[i]-1e-6:continue
      u=(w0*ta[0]+w1*tb[0]+w2*tc[0])/16;v=(w0*ta[1]+w1*tb[1]+w2*tc[1])/16;rgba=tex.getpixel((min(tex.width-1,max(0,int(u*tex.width))),min(tex.height-1,max(0,int(v*tex.height)))))
      if rgba[3]==0:continue
      pixels[x,y]=tuple(int(channel*shade) for channel in rgba[:3])+(rgba[3],);depth[i]=zz
 if not canvas.getbbox():raise ValueError('Empty projection')
 return canvas,'block-model'
manifest={};audit={};missing={}
for path in sorted(names):
 if not path.startswith('assets/minecraft/models/item/') or not path.endswith('.json'):continue
 id=path.split('/')[-1][:-5]
 try:
  m=model('item/'+id)
  # Potion/arrow colors and spawn eggs depend on item tint providers. Do not invent them.
  if id in ['firework_star','potion','splash_potion','lingering_potion','tipped_arrow','leather_helmet','leather_chestplate','leather_leggings','leather_boots','leather_horse_armor','filled_map'] or id.endswith('_spawn_egg'):
   raise ValueError('Item-specific tint/provider requires explicit fallback')
  im,kind=render(m);im.save(out/(id+'.png'));manifest[id]='icons/'+id+'.png';bbox=im.getbbox();audit[id]={'model':'item/'+id,'kind':kind,'size':[N,N],'bounds':bbox}
 except (ValueError,KeyError) as e:missing[id]=str(e)
(ROOT/'data/textures.json').write_text(json.dumps(manifest,sort_keys=True))
(ROOT/'data/icon-audit.json').write_text(json.dumps({'version':'1.16.1','sha1':hashlib.sha1(raw).hexdigest(),'rendered':audit,'fallbacks':missing,'sourceTextures':source_info},indent=2))
# Contact sheet for the affected wood families, not a replacement asset.
ids=[i for i in manifest if any(t in i for t in ['_stem','hyphae','_log','_wood','_planks']) and not any(t in i for t in ['button','plate','slab','stairs'])]
width=640;sheet=Image.new('RGBA',(width,110*math.ceil(len(ids)/6)),(30,40,32,255));draw=ImageDraw.Draw(sheet)
for i,id in enumerate(ids):
 x=(i%6)*106;y=(i//6)*110;sheet.alpha_composite(Image.open(out/(id+'.png')),(x+20,y));label=id.replace('stripped_','str. ');draw.text((x+2,y+67),label[:17],fill='white');draw.text((x+2,y+80),label[17:],fill='white')
sheet.save(ROOT/'data/wood-icon-audit.png')
print('Rendered',len(manifest),'official inventory models;',len(missing),'explicit fallbacks. Wood audit:',len(ids),'icons.')
