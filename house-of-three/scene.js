/* Hand-built interior geometry and a textured, near-plane-clipped 3D renderer. */
const surfaceCache=new Map();
function materialTexture(type){
 if(surfaceCache.has(type))return surfaceCache.get(type);
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');let seed=37;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 g.clearRect(0,0,128,128);
 if(type==='wood'){for(let i=0;i<160;i++){g.strokeStyle=`rgba(35,19,8,${.04+random()*.13})`;g.lineWidth=.4+random();g.beginPath();const y=random()*128;g.moveTo(0,y);g.bezierCurveTo(40,y+random()*7,80,y-random()*7,128,y+random()*3);g.stroke();}}
 else if(type==='stone'){for(let i=0;i<18;i++){g.strokeStyle=`rgba(70,80,78,${random()*.13})`;g.lineWidth=random()*1.3;g.beginPath();let x=random()*128;g.moveTo(x,0);for(let y=0;y<=128;y+=12){x+=(random()-.5)*30;g.lineTo(x,y);}g.stroke();}}
 else if(type==='fabric'){for(let i=0;i<128;i+=3){g.fillStyle='rgba(255,255,255,.08)';g.fillRect(i,0,1,128);g.fillStyle='rgba(0,0,0,.10)';g.fillRect(0,i,128,1);}}
 for(let i=0;i<1800;i++){g.fillStyle=random()>.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.045)';g.fillRect(random()*128,random()*128,1,1);}
 surfaceCache.set(type,c);return c;
}
function decorateRoom(room,box,objects){
 // Material assignments are deterministic and are baked once per room.
 for(const o of objects)o.material=['#745138','#493e31','#816846','#7b695d','#554737','#7c634c'].includes(o.color)?'wood':['#d8dcd1','#e1e4d6','#ddd4b8'].includes(o.color)?'stone':['#9f8d65','#b19c73','#777c91','#bbb1b8'].includes(o.color)?'fabric':null;
 function detail(x,y,z,w,h,d,color,material){box(x,y,z,w,h,d,color);objects[objects.length-1].material=material;}
 // Individually laid oak boards or honed limestone tiles.
 for(let x=-5.5;x<6;x+=1)for(let z=0;z<10;z+=room===0?1:2){detail(x,-.003,z+.45,.98,.035,room===0?.98:1.98,room===0?['#9a9d91','#b4b5a7','#a7aa9d'][(Math.round(x+5.5)+z)%3]:['#80705a','#8b775d','#968267'][(Math.round(x+5.5)+z)%3],room===0?'stone':'wood');}
 // Baseboards, cornice, recessed door panels, brass lock hardware.
 box(0,.15,-.2,12,.28,.12,'#cec7b3');box(0,4.6,-.2,12,.18,.17,'#c4bfad');
 for(const x of [-5.8,5.8])box(x,.15,4.5,.15,.28,10,'#b4b09e');
 for(const y of [.8,2.1]){detail(5.05,y,-.085,1.05,.95,.1,'#304945','wood');box(5.05,y,-.02,.88,.78,.035,'#273c38');}
 box(5.54,1.5,.045,.17,.37,.035,'#b8965b');box(5.42,1.52,.1,.3,.055,.09,'#dec18a');
 // Tall window: misty glass, mullions, sill and folded drapes.
 box(-4,3.3,-.22,2.5,2.1,.12,'#d7d0b8');box(-4,3.3,-.13,2.28,1.87,.06,'#a6bab6');
 box(-4,3.3,-.06,.065,1.9,.05,'#e0d9c4');box(-4,3.3,-.06,2.3,.065,.05,'#e0d9c4');box(-4,2.23,-.05,2.75,.12,.36,'#d0c8b2');
 for(const side of [-1,1])for(let i=0;i<5;i++)detail(-4+side*(1.3+i*.065),3.12,.02,.075,2.6,.15,i%2?'#918c76':'#ada58b','fabric');
 // Code paper has visible ink lines.
 for(let i=0;i<7;i++)box(-1.8,2.8-i*.115,-.02,.72-(i%3)*.11,.019,.012,'#766b51');
 const furnitureStart=objects.length;
 if(room===0){
  // Hollow bath with a raised porcelain rim and inset water.
  box(-3.8,1.4,2,2.7,.15,1.9,'#e4e3d8');box(-3.8,1.485,2,2.25,.025,1.43,'#7faaa6');
  for(let i=0;i<7;i++)box(-3.8,1.501,1.45+i*.18,1.9,.008,.012,'#a4c1b9');
  box(-4.6,1.65,1.3,.07,.55,.07,'#bfa777');box(-4.43,1.9,1.3,.4,.06,.07,'#e0cb9e');
  // Cabinet above the bath and apothecary bottles.
  detail(-3.65,2.1,1.05,1.25,.55,.5,'#71624e','wood');for(let i=0;i<3;i++){box(-4+i*.34,2.48,1.05,.19,.3,.18,['#7c9476','#a38a71','#c2b28c'][i]);box(-4+i*.34,2.65,1.05,.2,.045,.2,'#c7b99b');}
  box(0,1.46,.8,1.35,.12,.75,'#b1b8ab');box(0,1.535,.8,1.05,.015,.53,'#657b75');box(0,1.7,.35,.08,.48,.08,'#c6b27d');box(0,1.93,.49,.08,.07,.35,'#d6c291');
  for(let y=2;y<3.6;y+=.12)box(.02,y,-.03,1.55,.015,.01,'#b6ccc6');
  for(let i=0;i<3;i++)detail(3.6,1.7+i*.10,2,1,.09,.65,i%2?'#b8beb0':'#e2dcc8','fabric');
  for(let y=.5;y<1.5;y+=.5){detail(3.6,y,2.565,1.2,.43,.03,'#8f7657','wood');box(3.6,y,2.61,.24,.04,.07,'#c5ad74');}
  // Wall grout grid beneath the dado.
  for(let x=-5.8;x<5.8;x+=.48)box(x,1,-.275,.015,1.7,.01,'#8b9d90');for(let y=.3;y<1.9;y+=.35)box(0,y,-.268,11.7,.015,.01,'#8b9d90');
 }else if(room===1){
  for(let i=0;i<3;i++){detail(-4.52+i*.91,1.02,2.28,.86,.22,1.15,'#b1a181','fabric');detail(-4.52+i*.91,1.5,1.85,.83,.65,.23,'#a39375','fabric');}
  detail(-4.6,1.35,2.25,.5,.5,.28,'#63746b','fabric');detail(-2.7,1.35,2.25,.5,.5,.28,'#c0b191','fabric');
  for(let x=0;x<8;x++)for(let z=0;z<8;z++)box(-.4375+x*.125,.808,1.5625+z*.125,.124,.014,.124,(x+z)%2?'#423e32':'#e0cfaa');
  for(let i=0;i<8;i++)box(-.4375+i*.125,.88,1.69,.06,.14,.06,'#b99c69');
  for(let i=0;i<3;i++){box(2.3+i*.75,3.2,-.18,.66,.92,.13,'#ba9f69');box(2.3+i*.75,3.2,-.1,.52,.78,.03,['#626e65','#887663','#65787a'][i]);box(2.3+i*.75,3.3,-.075,.17,.23,.025,'#c2ab8b');box(2.3+i*.75,3.02,-.075,.32,.27,.025,'#414e48');}
  detail(0,.55,.5,.8,1.1,.6,'#615341','wood');detail(0,1.2,.5,.7,.16,.5,'#80624e','wood');
 }else if(room===2){
  detail(-2.2,1.4,2.4,.55,.3,.45,'#80624e','wood');box(-2.2,1.4,2.64,.1,.08,.03,'#d3b778');
  detail(-3,1.15,.83,3.95,1.5,.18,'#695b4b','wood');for(let i=0;i<8;i++)box(-4.65+i*.47,1.2,.94,.035,1.32,.04,'#aa9476');
  for(let i=0;i<19;i++)detail(-4.75+i*.195,1.245,3.7,.025,.02,2.75,i%2?'#8e91a1':'#696f83','fabric');
  for(const x of [-3.85,-2.2])detail(x,1.36,1.6,1.35,.24,.7,'#ddd4c4','fabric');
  box(.4,1.73,.6,.045,.65,.045,'#c5a66d');box(.4,2.12,.6,.7,.45,.55,'#e4cba0');box(.4,1.4,.6,.4,.04,.4,'#b59661');
  box(-.25,1.55,1.25,.42,.3,.13,'#b9a577');box(-.25,1.56,1.33,.32,.2,.02,'#eee0bd');box(-.25,1.59,1.35,.02,.1,.01,'#403c31');
  for(const x of [3.2,4]){detail(x,1.55,2.285,.69,2.5,.05,'#8c7a68','wood');box(x+(x<3.5?.2:-.2),1.5,2.34,.035,.24,.05,'#d3b778');}
 }else{
  for(let x=-3.8;x<4.5;x+=1.5){box(x,.86,1.4,1.29,1.25,.07,'#a9ae98');box(x,1.3,1.46,.4,.045,.07,'#c6b07c');}
  for(const x of [-4,-3.25,3.25,4]){box(x,2.4,.85,.67,.93,.06,'#9ca58f');box(x,2.12,.9,.2,.035,.06,'#c6b07c');}
  box(0,2.65,.35,2,.18,1,'#8e9690');box(0,3.15,.05,.8,.9,.4,'#919d94');
  box(0,.9,1.47,1.4,.9,.08,'#343e3b');box(0,.87,1.53,1.1,.6,.02,'#52625d');box(0,1.32,1.58,1,.06,.08,'#c4c7b5');
  for(let i=0;i<4;i++){box(-.47+i*.31,1.51,1.55,.09,.09,.06,'#bbc0ae');}
  detail(-2.1,1.78,.9,1.1,.08,.6,'#b29769','wood');box(-2.1,1.91,.9,.45,.2,.3,'#9a8362');
  for(let i=0;i<3;i++){box(-3.9+i*.35,1.94,.6,.23,.5,.23,'#9eac99');box(-3.9+i*.35,2.2,.6,.25,.045,.25,'#9b835e');}
 }
 for(let i=furnitureStart;i<objects.length;i++)if(objects[i].color!=='#8b9d90')objects[i].group='furniture';
 // Light fixture in every room.
 box(1.7,3.1,-.04,.08,.5,.2,'#b59b69');box(1.7,3.37,.08,.46,.36,.35,'#e8d3ab');
}
function drawCanvasRoom(ctx,canvas,objects,camera,room,playing,time){
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#263332';ctx.fillRect(0,0,w,h);
 const f=Math.min(w*.85,h*1.05),c=Math.cos(camera.a),s=Math.sin(camera.a);
 const view=p=>{const dx=p[0]-camera.x,dz=camera.z-p[2];const y=p[1]-camera.y,z=dz*c+dx*s,cp=Math.cos(camera.pitch||0),sp=Math.sin(camera.pitch||0);return{x:dx*c-dz*s,y:y*cp-z*sp,z:z*cp+y*sp};};
 const project=p=>({x:w/2+p.x*f/p.z,y:h*.53-p.y*f/p.z});
 const clip=points=>{const result=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if(a.z>=.12)result.push(a);if((a.z>=.12)!==(b.z>=.12)){const t=(.12-a.z)/(b.z-a.z);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:.12});}}return result;};
 const faces=[];
 for(const b of objects){const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x,y,z])=>view([b.x+x*b.w/2,b.y+y*b.h/2,b.z+z*b.d/2]));
 for(const [ids,light] of [[[0,1,2,3],.67],[[4,5,6,7],.96],[[0,4,7,3],.73],[[1,5,6,2],.82],[[3,2,6,7],1.13],[[0,1,5,4],.55]]){const raw=ids.map(i=>v[i]),points=clip(raw);if(points.length<3)continue;const p=points.map(project);if(p.every(p=>p.x<0)||p.every(p=>p.x>w)||p.every(p=>p.y<0)||p.every(p=>p.y>h))continue;faces.push({p,layer:b.y<-.1?-3:b.y<=.02?-2:0,z:raw.reduce((a,b)=>a+b.z,0)/4,color:b.color,light,material:b.material});}}
 faces.sort((a,b)=>a.layer-b.layer||b.z-a.z);
 function path(p){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();}
 for(const face of faces){const n=parseInt(face.color.slice(1),16),warm=face.light;path(face.p);ctx.fillStyle=`rgb(${[n>>16,(n>>8)&255,n&255].map((v,i)=>Math.min(255,Math.round(v*warm*(i===2?.94:1)))).join(',')})`;ctx.fill();
 if(face.material&&face.p.length===4){const p=face.p,area=Math.abs((p[1].x-p[0].x)*(p[3].y-p[0].y)-(p[3].x-p[0].x)*(p[1].y-p[0].y));if(area>120){ctx.save();path(p);ctx.clip();const tex=materialTexture(face.material);ctx.transform((p[1].x-p[0].x)/128,(p[1].y-p[0].y)/128,(p[3].x-p[0].x)/128,(p[3].y-p[0].y)/128,p[0].x,p[0].y);ctx.drawImage(tex,0,0);ctx.restore();}}
 }
 // Soft illumination and edge falloff tie the materials together.
 const lamp=view([-3.8,3.2,.2]);const light=lamp.z>.15?project(lamp):{x:w/2,y:h/2};const glow=ctx.createRadialGradient(light.x,light.y,5,light.x,light.y,Math.max(w,h)*.65);glow.addColorStop(0,'rgba(247,228,183,.14)');glow.addColorStop(1,'rgba(247,228,183,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 const shade=ctx.createRadialGradient(w*.5,h*.46,h*.15,w*.5,h*.46,Math.max(w,h)*.72);shade.addColorStop(0,'rgba(5,15,18,0)');shade.addColorStop(1,'rgba(5,15,18,.66)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
}

// The HUD and GPU use exactly the same camera projection.
function projectRoomPoint(p,camera,w,h){
 const dx=p[0]-camera.x,dz=camera.z-p[2],c=Math.cos(camera.a),s=Math.sin(camera.a),cp=Math.cos(camera.pitch||0),sp=Math.sin(camera.pitch||0);
 const x=dx*c-dz*s,forward=dz*c+dx*s,dy=p[1]-camera.y,z=forward*cp+dy*sp,y=dy*cp-forward*sp,f=Math.min(w*.85,h*1.05);
 return {x:w/2+x*f/z,y:h*.53-y*f/z,z};
}
function createRoomRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true});
 if(!gl)return {fallback:canvas.getContext('2d'),dirty:true};
 const renderer={gl,dirty:true,scene:null,lost:false};
 const vertex=`attribute vec3 position;attribute vec3 color;attribute vec2 uv;attribute float material;
 uniform vec3 camera;uniform vec2 angles;uniform vec2 scale;
 varying vec3 vColor;varying vec2 vUv;varying float vMaterial;varying float vDepth;
 void main(){float dx=position.x-camera.x;float dz=camera.z-position.z;float dy=position.y-camera.y;
 float x=dx*cos(angles.x)-dz*sin(angles.x);float z=dz*cos(angles.x)+dx*sin(angles.x);
 float yy=dy*cos(angles.y)-z*sin(angles.y);float zz=z*cos(angles.y)+dy*sin(angles.y);
 gl_Position=vec4(x*scale.x,yy*scale.y-0.06*zz,1.002002*zz-0.2002002,zz);
 vColor=color;vUv=uv;vMaterial=material;vDepth=zz;}`;
 const fragment=`precision mediump float;uniform sampler2D atlas;uniform vec2 viewport;
 varying vec3 vColor;varying vec2 vUv;varying float vMaterial;varying float vDepth;
 void main(){vec3 c=vColor;
 if(vMaterial>=0.0){vec2 t=fract(vUv)*0.98+0.01;vec4 grain=texture2D(atlas,vec2((vMaterial+t.x)/4.0,t.y));c=mix(c,grain.rgb,grain.a);}
 vec2 screen=gl_FragCoord.xy/viewport;float edge=smoothstep(0.2,0.8,length((screen-vec2(0.5,0.54))*vec2(1.0,0.8)));
 c*=1.0-edge*0.30;c=mix(c,vec3(0.07,0.12,0.12),min(0.20,max(0.0,vDepth-5.0)*0.015));gl_FragColor=vec4(c,1.0);}`;
 function init(){
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  renderer.program=program;renderer.buffer=gl.createBuffer();renderer.uniforms=Object.fromEntries(['camera','angles','scale','viewport','atlas'].map(n=>[n,gl.getUniformLocation(program,n)]));renderer.attributes=Object.fromEntries(['position','color','uv','material'].map(n=>[n,gl.getAttribLocation(program,n)]));
  const atlas=document.createElement('canvas');atlas.width=512;atlas.height=128;const g=atlas.getContext('2d');['wood','stone','fabric'].forEach((t,i)=>g.drawImage(materialTexture(t),i*128,0));
  renderer.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,renderer.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);renderer.scene=null;renderer.dirty=true;
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.lost=true;});
 canvas.addEventListener('webglcontextrestored',()=>{renderer.lost=false;init();});init();return renderer;
}
function drawRoom(renderer,canvas,objects,camera,room,playing,time){
 if(renderer.fallback){drawCanvasRoom(renderer.fallback,canvas,objects,camera,room,playing,time);renderer.dirty=false;return;}
 if(renderer.lost)return;
 const gl=renderer.gl,w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.1,.15,.15,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(renderer.program);gl.bindBuffer(gl.ARRAY_BUFFER,renderer.buffer);
 if(renderer.scene!==objects){
  const data=[],faces=[[[0,1,2,3],.67],[[4,5,6,7],.96],[[0,4,7,3],.73],[[1,5,6,2],.82],[[3,2,6,7],1.13],[[0,1,5,4],.55]];
  for(const b of objects){const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x,y,z])=>[b.x+x*b.w/2,b.y+y*b.h/2,b.z+z*b.d/2]);const n=parseInt(b.color.slice(1),16),rgb=[n>>16,(n>>8)&255,n&255].map(v=>v/255),mat=['wood','stone','fabric'].indexOf(b.material);
   for(const [ids,light] of faces){const a=vertices[ids[0]],u=vertices[ids[1]],v=vertices[ids[3]],uw=Math.hypot(...u.map((x,i)=>x-a[i])),vh=Math.hypot(...v.map((x,i)=>x-a[i])),uv=[[0,0],[uw,0],[uw,vh],[0,vh]];
    for(const i of [0,1,2,0,2,3])data.push(...vertices[ids[i]],...rgb.map((c,i)=>Math.min(1,c*light*(i===2?.94:1))),...uv[i],mat);
   }
  }
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);renderer.count=data.length/9;renderer.scene=objects;
 }
 const {attributes:a,uniforms:u}=renderer;for(const [name,size,offset] of [['position',3,0],['color',3,12],['uv',2,24],['material',1,32]]){gl.enableVertexAttribArray(a[name]);gl.vertexAttribPointer(a[name],size,gl.FLOAT,false,36,offset);}
 const focal=Math.min(w*.85,h*1.05);gl.uniform3f(u.camera,camera.x,camera.y,camera.z);gl.uniform2f(u.angles,camera.a,camera.pitch||0);gl.uniform2f(u.scale,2*focal/w,2*focal/h);gl.uniform2f(u.viewport,canvas.width,canvas.height);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,renderer.texture);gl.uniform1i(u.atlas,0);gl.drawArrays(gl.TRIANGLES,0,renderer.count);renderer.dirty=false;
}

function decorateMansionInterior(room,box,objects){
 const stone='#c4baa2',gold='#af9360',wood='#73604b';
 function detail(x,y,z,w,h,d,color,material='stone'){box(x,y,z,w,h,d,color);objects[objects.length-1].material=material;}
 // Extend the original floor into a much larger room without overlapping tiles.
 for(let x=-9.5;x<10;x++)for(let z=0;z<18;z++)if(x<-6||x>6||z>=10)detail(x,-.003,z+.45,.98,.035,.98,room===0?'#abae9e':((Math.round(x)+z)%2?'#8b775d':'#80705a'),room===0?'stone':'wood');
 for(const y of [.17,3.8,7.65]){box(0,y,-.15,20,.18,.18,stone);box(0,y,17.8,20,.18,.18,stone);for(const x of [-9.8,9.8])box(x,y,8.8,.18,.18,18,stone);}
 // Fluted pilasters and capitals give the double-height walls their scale.
 for(const x of [-8,-6,6,8]){detail(x,3.8,-.12,.36,7.5,.34,stone);box(x,7.35,-.04,.7,.28,.5,gold);box(x,.3,-.02,.65,.6,.5,stone);for(const dx of [-.1,0,.1])box(x+dx,3.8,.065,.025,6.4,.015,'#8f8c78');}
 for(const side of [-1,1])for(const z of [4,9,14]){
  // Tall side windows with inset glass and stone surrounds.
  box(side*9.84,4.6,z,.12,4.5,2.6,stone);box(side*9.75,4.6,z,.08,4.15,2.3,'#829e9b');box(side*9.68,4.6,z,.05,4.2,.065,stone);box(side*9.68,4.6,z,.05,.07,2.3,stone);box(side*9.6,2.3,z,.5,.18,2.9,stone);
 }
 // Coffered ceiling, central chandelier, and a broad runner.
 for(const z of [4,9,14])box(0,7.85,z,20,.25,.22,stone);
 for(const x of [-6,0,6])box(x,7.85,8.5,.22,.25,19,stone);
 box(0,6.9,7,.055,1.8,.055,gold);box(0,6.05,7,2.5,.1,.12,gold);box(0,6.05,7,.12,.1,2.5,gold);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*1.2,z=7+Math.sin(a)*1.2;box(x,6.12,z,.12,.4,.12,gold);box(x,6.4,z,.18,.18,.18,'#f5df9e');}
 detail(0,.035,12,3.7,.025,6,room===2?'#78758a':'#7a6557','fabric');
 // A monumental fireplace in the far wall, with a framed ancestral portrait.
 detail(0,1.6,17.35,4,3.2,.65,stone);box(0,1.25,16.99,2.7,2.25,.04,'#253030');box(0,3.3,17.25,4.6,.24,1,stone);box(0,.15,16.7,4.7,.2,1.7,stone);
 box(0,5.1,17.5,2.8,2.6,.2,gold);box(0,5.1,17.36,2.5,2.3,.04,'#4b5550');box(0,5.5,17.3,.65,.8,.05,'#ad9474');box(0,4.7,17.3,1.35,.85,.05,'#303c39');
 // Seating areas and cabinets in the mansion's wider side bays.
 for(const x of [-7.8,7.8]){
  detail(x,.5,11,1.8,1,1.6,room===0?'#b6b8a5':'#8b7e6b','fabric');detail(x,1.1,11.65,1.8,1.3,.28,'#8e846f','fabric');
  detail(x,.85,6,1.9,1.7,.85,wood,'wood');box(x,1.75,6,2.05,.12,1,stone);box(x,2.05,6,.35,.5,.35,'#b49766');
 }
}
function createMansionExterior(){
 const objects=[];const add=(x,y,z,w,h,d,color,material)=>objects.push({x,y,z,w,h,d,color,material});
 // An expansive, three-storey estate with projecting wings and corner towers.
 add(0,-.25,0,75,.4,65,'#344c40');add(0,.03,16,6,.12,32,'#a39d88','stone');
 add(0,5.6,-2,18,11.2,8,'#a9a28c','stone');
 for(const x of [-12,12]){add(x,4.7,1,8,9.4,14,'#9a9783','stone');add(x,9.5,1,8.7,.35,14.7,'#444e4e');add(x,10,1,7.6,.7,13.6,'#394549');}
 for(const x of [-16.5,16.5]){add(x,6,6,3.6,12,4,'#929380','stone');add(x,12.15,6,4.2,.35,4.6,'#3d4948');add(x,12.6,6,3.4,.65,3.8,'#354145');add(x,13.15,6,2.4,.45,2.8,'#354145');}
 for(const y of [.4,4,7.6,11.2])add(0,y,2.12,18.6,.2,.35,'#c4bba0');
 for(const x of [-12,12])for(const y of [.4,4,7.6,9.3])add(x,y,8.1,8.4,.2,.3,'#c4bba0');
 for(const x of [-6,-3,0,3,6])for(const y of [2.2,5.7,9]){
  if(x===0&&y===2.2)continue;add(x,y,2.1,1.8,2.5,.22,'#d0c4a7');add(x,y,2.24,1.45,2.17,.08,'#5b7477');add(x,y,2.3,.06,2.2,.04,'#b5b49e');add(x,y,2.3,1.45,.06,.04,'#b5b49e');
 }
 for(const x of [-14,-11,-9,9,11,14])for(const y of [2.2,5.7,8]){add(x,y,8.12,1.2,1.8,.16,'#c4baa0');add(x,y,8.23,.95,1.5,.06,y===5.7?'#c8b985':'#536d70');}
 // Slate roof stepped toward its ridge, with tall chimneys.
 for(let i=0;i<5;i++)add(0,11.55+i*.42,-2,19-i*1.8,.5,9-i*1.05,'#38474a');
 for(const x of [-5,5])add(x,13,-3,.85,2.8,1.1,'#8b8977','stone');
 // Double entrance, four-column portico and broad stone steps.
 add(0,1.8,2.3,2.7,3.6,.24,'#283c37','wood');add(0,1.8,2.46,.06,3.5,.05,'#b29b65');for(const x of [-.2,.2])add(x,1.6,2.5,.07,.28,.07,'#d2b777');
 for(const x of [-3.2,-2.5,2.5,3.2]){add(x,2.1,4,.28,4.2,.35,'#c6bea7','stone');add(x,.25,4,.6,.5,.6,'#bcb59e');add(x,4.05,4,.6,.3,.6,'#c6bea7');}
 add(0,4.35,3.6,7.7,.4,4,'#c6bea7');for(let i=0;i<4;i++)add(0,4.65+i*.25,3.6,7.4-i*1.5,.3,3.8,'#b1aa92');
 for(let i=0;i<5;i++)add(0,.15+i*.12,5.2-i*.45,8-i*.25,.3,1.1,'#b8b19c','stone');
 // Formal grounds, hedges, fountain, lamps and iron boundary gates.
 for(const x of [-7,7]){add(x,.55,16,3,1.1,13,'#304936');for(const z of [10,16,22]){add(x,1.4,z,1.8,1.8,1.8,'#3e5840');}}
 add(0,.4,17,3.5,.65,3.5,'#858e82','stone');add(0,.76,17,3.05,.08,3.05,'#718f8b');add(0,1.35,17,.35,1.2,.35,'#a6a58e');add(0,1.95,17,1.4,.17,1.4,'#aaa78f');
 for(const x of [-4.5,4.5])for(const z of [10,23]){add(x,1.3,z,.09,2.6,.09,'#34403a');add(x,2.75,z,.45,.5,.45,'#d4bd85');}
 for(const x of [-20,20])for(const z of [-8,1,12]){add(x,2,z,.6,4,.6,'#625941');add(x,5,z,4.5,5,4.5,'#293f32');}
 return objects;
}

function spreadRoomFurniture(room,objects){
 for(const b of objects){if(b.group!=='furniture')continue;
  let dx=0,dz=0;
  if(room===0){
   if(b.x<-2){if(b.y>1.95){dx=-3.35;dz=1.75;}else{dx=-2;dz=4;}}
   else if(b.x>2){dx=3;dz=5;}else dx=1.5;
  }else if(room===1){
   if(b.x<-2){dx=-1.8;dz=6;}
   else if(b.x>2&&b.y<2.6){dx=3;dz=8;}
   else if(Math.abs(b.x)<2){if(b.z>1.1){dx=-1.4;dz=5.5;}else{dx=6;dz=3;}}
  }else if(room===2){if(b.x<1){dx=-1;dz=3;}else{dx=3;dz=6;}}
  else if(room===3){
   if(b.x<-3.2&&b.y>1.7&&b.y<2.3){dx=-3.1;dz=3.5;}
   else if(b.x>-2.8&&b.x<-1.4&&b.y>1.7){dx=1.1;dz=6;}
  }
  b.x+=dx;b.z+=dz;
 }
}
function furnishRoomZones(room,box,objects){
 const ivory='#deddd0',brass='#c6b07c',oak='#80694d',dark='#3c514d';
 function detail(x,y,z,w,h,d,c,m='wood'){box(x,y,z,w,h,d,c);objects[objects.length-1].material=m;}
 function table(x,z,w=2.4,d=1.4,y=1.1){detail(x,y,z,w,.16,d,oak);for(const a of [-1,1])for(const b of [-1,1])detail(x+a*(w/2-.15),y/2,z+b*(d/2-.15),.13,y,.13,'#665440');}
 function chair(x,z,back=1){detail(x,.62,z,.9,.18,.85,'#aa9c7e','fabric');detail(x,1.05,z+back*.36,.9,.9,.15,'#8f8065','fabric');for(const a of [-.34,.34])for(const b of [-.3,.3])detail(x+a,.28,z+b,.09,.56,.09,oak);}
 function rug(x,z,w,d,c){detail(x,.057,z,w,.025,d,c,'fabric');}
 function plant(x,z){box(x,.38,z,.55,.72,.55,'#998b70');box(x,1.1,z,.06,.9,.06,'#657d56');for(const [dx,dz,y] of [[-.25,0,1],[.25,0,1.3],[0,.25,1.15],[0,-.2,1.55]])box(x+dx,y,z+dz,.45,.2,.4,'#536f50');}
 function cabinet(x,z,w=1.8,h=1.8){detail(x,h/2,z,w,h,.9,oak);for(let y=.35;y<h;y+=.55){detail(x,y,z+.47,w-.14,.45,.05,'#987e5e');box(x,y,z+.52,.28,.045,.08,brass);}}
 function lamp(x,z){box(x,.06,z,.5,.08,.5,brass);box(x,1.05,z,.045,2,.045,brass);box(x,2.15,z,.8,.55,.65,'#d4c09b');}
 if(room===0){
  // West bathing area, central washstand, east linen storage, rear toilet.
  cabinet(-7,2.8,1.55,1.8);rug(-5.2,8,2.9,1.7,'#afbeb5');
  // A separate porcelain toilet with tank, pedestal, hollow seat, and flush lever.
  const x=-7,z=11;
  box(x,.2,z,.65,.4,.85,ivory);box(x,.53,z,.83,.38,1.1,ivory);
  box(x,.76,z-.48,1,.12,.18,ivory);box(x,.76,z+.48,1,.12,.18,ivory);
  for(const dx of [-.44,.44])box(x+dx,.76,z,.14,.12,.9,ivory);
  box(x,.64,z,.64,.04,.65,'#839d96');box(x,1.13,z-.68,1.05,.9,.38,ivory);box(x,1.62,z-.68,1.12,.1,.45,ivory);box(x+.39,1.34,z-.46,.18,.07,.06,brass);
  // Toilet roll holder and a low privacy divider, with room to walk around it.
  box(-8.05,1,11,.12,.45,.35,ivory);box(-8.05,1,11,.32,.04,.43,brass);
  detail(-5.6,.8,10.7,.12,1.6,2.6,'#a9b4a7','stone');
  // Second sink and vanity, well away from the bathtub.
  cabinet(4,2,1.9,1.3);detail(4,1.4,2,2.05,.16,1.2,ivory,'stone');box(4,1.5,2,1.2,.08,.75,'#a9b7ad');box(4,1.545,2,.95,.02,.53,'#607c76');box(4,1.75,1.63,.07,.5,.07,brass);box(4,2,1.8,.07,.07,.4,brass);
  // Walk-in shower in the opposite corner; rails and clear openings avoid blocking the view.
  detail(7.5,.09,3,2.8,.15,2.8,'#c0c9bc','stone');
  for(const sx of [6.15,8.85])for(const sz of [1.65,4.35])box(sx,1.65,sz,.055,3.25,.055,brass);
  box(7.5,3.25,1.65,2.75,.05,.05,brass);box(8.85,3.25,3,.05,.05,2.75,brass);box(8.65,2,2,.07,2,.07,brass);box(8.4,2.97,2,.6,.06,.5,brass);
  for(let i=0;i<7;i++)detail(8.8,1.6,1.8+i*.32,.045,2.5,.055,'#9ebbb3','stone');
  cabinet(7,13,2.3,1.6);for(let i=0;i<3;i++)detail(7,1.7+i*.11,13,1.6,.1,.65,ivory,'fabric');
  table(-3.5,12,1.25,.7,.75);box(-3.5,.96,12,.4,.3,.4,'#a59676');plant(4.5,14);plant(-8.6,5);
 }else if(room===1){
  rug(-3,8,7,4.5,'#8e7b63');
  // Second seating group across the room, and a piano toward the rear.
  chair(3.5,11.8,-1);chair(5.1,11.8,-1);table(4.3,10,2.5,1.2,.8);lamp(5.9,12.5);
  detail(-5.8,1.05,14,3.4,2.1,1.1,'#463d34');box(-5.8,1.4,13.35,3.35,.14,.5,'#d9d4be');
  for(let i=0;i<23;i++){box(-7.35+i*.135,1.49,13.27,.012,.04,.48,'#4c4c40');if(i%7!==2&&i%7!==6)box(-7.31+i*.135,1.53,13.44,.055,.06,.24,'#343b34');}
  table(-5.8,12.5,1.7,.8,.55);lamp(-7.7,13.8);plant(3,4.5);
  cabinet(4.8,15,2.7,1.4);for(let i=0;i<4;i++)detail(4.1+i*.35,1.57,15,.3,.18,.65,['#917c5e','#a99c7e'][i%2]);
 }else if(room===2){
  rug(-4,6.5,5.2,7,'#817d8e');table(-4,10,3.1,.95,.55);detail(-4,.7,10,3,.18,.85,'#b1a5ad','fabric');
  // Dressing table, stool, and freestanding mirror in a separate dressing area.
  table(4.5,13,3.3,1.1,1.1);box(4.5,2.15,13.5,1.7,1.8,.12,brass);box(4.5,2.15,13.41,1.5,1.6,.025,'#9cb5b0');chair(4.5,11.8,-1);box(3.35,1.4,13,.25,.4,.25,'#c8b58d');
  cabinet(-7,13.3,2.8,1.5);detail(-7,1.65,13.3,1.9,.25,.85,'#c4b6a3','fabric');lamp(-7.8,10.5);plant(7.8,14.5);
  chair(2,5,-1);table(3.5,5,1.1,.8,.7);
 }else{
  // Prep island with storage and utensils, distinct from the wall range.
  detail(-1,.78,7,5,1.55,2.5,'#9aa28c');detail(-1,1.61,7,5.2,.18,2.7,'#d3cbb0','stone');
  for(let i=0;i<4;i++){detail(-2.8+i*1.2,.8,8.27,1.05,1.25,.06,'#b1b59e');box(-2.8+i*1.2,1.22,8.34,.36,.04,.06,brass);}
  box(.6,1.85,6.5,.4,.32,.4,'#807c68');for(let i=0;i<3;i++)box(.47+i*.12,2.1,6.5,.04,.5,.04,oak);
  // Open pantry shelving around the relocated spice jars.
  for(const px of [-8.05,-5.95])detail(px,1.65,4,.12,3.3,1.2,oak);
  for(const y of [.15,1,1.75,2.65,3.25])detail(-7,y,4,2.2,.12,1.2,oak);
  for(let i=0;i<4;i++)box(-7.75+i*.48,.6,4,.33,.72,.4,['#c6bda0','#ac9f80'][i%2]);
  // Separate dining zone and a tall refrigerator.
  table(-5.5,12.6,4,2,1.1);for(const x of [-6.7,-4.3]){chair(x,11,-1);chair(x,14.2,1);}rug(-5.5,12.6,5.5,4.7,'#8e8065');
  detail(6.8,1.7,10,2.1,3.4,1.5,'#b6bcb0','stone');box(6.8,2.15,10.77,1.95,2.1,.05,'#d0d1bf');box(6.8,.6,10.77,1.95,.8,.05,'#c6cab9');box(6.05,2,10.85,.065,.85,.09,brass);
  cabinet(5.7,14,3.2,1.5);box(5.7,1.65,14,1.4,.08,.8,'#738b84');box(5.7,1.9,13.7,.07,.5,.07,brass);plant(3.5,14.5);
 }
}
