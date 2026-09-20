import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const canvas=document.querySelector("#game"),menu=document.querySelector("#menu"),pause=document.querySelector("#pause"),win=document.querySelector("#win"),notice=document.querySelector("#notice");
const heightText=document.querySelector("#height"),checkpointText=document.querySelector("#checkpoint"),levelName=document.querySelector("#level-name"),bar=document.querySelector("#bar"),crosshair=document.querySelector("#crosshair");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x080608);scene.fog=new THREE.FogExp2(0x080608,.012);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.27;
scene.add(new THREE.AmbientLight(0x271a13,.08));

const mats={stone:new THREE.MeshStandardMaterial({color:0x211a1a,roughness:.8}),violet:new THREE.MeshStandardMaterial({color:0x241b24,roughness:.8}),rose:new THREE.MeshStandardMaterial({color:0x2b1d24,roughness:.8}),summit:new THREE.MeshStandardMaterial({color:0x2b211b,roughness:.8}),pink:new THREE.MeshStandardMaterial({color:0xf08fae,roughness:.58}),palePink:new THREE.MeshStandardMaterial({color:0xffd1df,roughness:.62}),deepPink:new THREE.MeshStandardMaterial({color:0xcf5f88,roughness:.58}),dark:new THREE.MeshStandardMaterial({color:0x090709})};
const solids=[];function box(x,y,z,w,h,d,mat=mats.stone){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);solids.push({mesh:m,min:new THREE.Vector3(x-w/2,y-h/2,z-d/2),max:new THREE.Vector3(x+w/2,y+h/2,z+d/2)});return m}

// Five hard stages. Platforms get smaller and jumps change direction more often near the top.
box(0,-1,0,28,2,28);const course=[
// 1 — The Undercity: narrow offset ledges
[-8,2,1,4,1,4],[-2,4,-5,4,1,3.5],[5,6,-8,3.6,1,3.4],[10,8,-3,3.5,1,3.3],[8,10,5,3.4,1,3.2],[1,12,10,3.4,1,3.2],[-6,14,8,3.2,1,3.1],[-10,16,2,3.1,1,3],[-6,18,-6,3,1,3],[0,20,0,9,1,9],
// 2 — Broken Corners: jumps wrap around the walls
[7,22,-8,3,1,2.8],[11,24,-2,2.8,1,2.8],[9,26,6,2.8,1,2.7],[3,28,11,2.7,1,2.7],[-5,30,10,2.7,1,2.6],[-11,32,5,2.6,1,2.6],[-10,34,-3,2.6,1,2.5],[-4,36,-10,2.5,1,2.5],[4,38,-11,2.5,1,2.4],[0,40,0,8,1,8],
// 3 — Needle Walk: tiny alternating pads
[-8,42,3,2.5,1,2.5],[-3,44,-5,2.35,1,2.35],[4,46,3,2.25,1,2.25],[9,48,-5,2.2,1,2.2],[5,50,-11,2.15,1,2.15],[-2,52,-8,2.1,1,2.1],[-9,54,-10,2.05,1,2.05],[-11,56,-3,2,1,2],[-7,58,5,2,1,2],[0,60,0,7,1,7],
// 4 — The Spiral: exposed clockwise ascent
[8,62,0,2.4,1,2.2],[10,64,7,2.3,1,2.2],[4,66,11,2.2,1,2.1],[-4,68,11,2.2,1,2.1],[-10,70,6,2.1,1,2.1],[-11,72,-2,2.1,1,2],[-7,74,-9,2,1,2],[1,76,-11,2,1,2],[9,78,-7,2,1,1.9],[0,80,0,6,1,6],
// 5 — Crown Run: the smallest summit sequence
[-7,82,7,2,1,1.9],[-11,84,0,1.9,1,1.9],[-7,86,-8,1.85,1,1.85],[0,88,-11,1.8,1,1.8],[8,90,-7,1.8,1,1.75],[11,92,1,1.75,1,1.75],[7,94,9,1.7,1,1.7],[0,96,11,1.7,1,1.7],[-8,98,7,1.65,1,1.65],[0,101,0,11,1,11]
];course.forEach((p,i)=>box(...p,i<20?mats.stone:i<30?mats.violet:i<40?mats.rose:mats.summit));

// Four small candles mark the corners of each platform.
const waxMaterial=new THREE.MeshStandardMaterial({color:0xf0d7ab,roughness:.95});
const wickMaterial=new THREE.MeshBasicMaterial({color:0x27160c});
const flameMaterial=new THREE.MeshBasicMaterial({color:0xe09d37});
const waxGeometry=new THREE.CylinderGeometry(.085,.095,.27,8);
const wickGeometry=new THREE.CylinderGeometry(.012,.012,.07,5);
const flameGeometry=new THREE.ConeGeometry(.065,.19,7);
const haloCanvas=document.createElement("canvas");haloCanvas.width=haloCanvas.height=64;
const haloContext=haloCanvas.getContext("2d"),haloGradient=haloContext.createRadialGradient(32,32,2,32,32,32);
haloGradient.addColorStop(0,"rgba(224,157,55,.5)");haloGradient.addColorStop(.35,"rgba(224,157,55,.2)");haloGradient.addColorStop(1,"rgba(224,157,55,0)");
haloContext.fillStyle=haloGradient;haloContext.fillRect(0,0,64,64);
const haloMaterial=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
const candleFlames=[];
function addCandle(x,y,z){
  const candle=new THREE.Group();
  const wax=new THREE.Mesh(waxGeometry,waxMaterial),wick=new THREE.Mesh(wickGeometry,wickMaterial),flame=new THREE.Mesh(flameGeometry,flameMaterial);
  wax.position.y=.135;wick.position.y=.29;flame.position.y=.42;
  const halo=new THREE.Sprite(haloMaterial);halo.scale.set(.85,.85,1);halo.position.y=.43;
  candle.add(wax,wick,flame,halo);candle.position.set(x,y,z);scene.add(candle);
  candleFlames.push({flame,halo,position:new THREE.Vector3(x,y+.43,z),phase:Math.random()*Math.PI*2});
}
function addPlatformCandles([x,y,z,w,h,d]){
  const top=y+h/2,inset=.2;
  for(const xSide of[-1,1])for(const zSide of[-1,1])addCandle(x+xSide*(w/2-inset),top,z+zSide*(d/2-inset));
}
addPlatformCandles([0,-1,0,28,2,28]);course.forEach(addPlatformCandles);
// Reuse a small set of lights for the candles closest to the camera.
const candleLights=Array.from({length:12},()=>{const light=new THREE.PointLight(0xe09d37,0,5.5,2);scene.add(light);return light});
for(let y=4;y<101;y+=8){box(-15,y,0,1,8,30,mats.dark);box(15,y,0,1,8,30,mats.dark);box(0,y,-15,30,8,1,mats.dark);box(0,y,15,30,8,1,mats.dark)}

function makeCat(){const g=new THREE.Group();const aura=new THREE.Sprite(haloMaterial);aura.scale.set(2.4,2.4,1);aura.position.set(0,.2,-.35);g.add(aura);const body=new THREE.Mesh(new RoundedBoxGeometry(1.2,1.3,1.08,5,.18),mats.pink);g.add(body);const muzzle=new THREE.Mesh(new RoundedBoxGeometry(.72,.47,.06,4,.1),mats.palePink);muzzle.position.set(0,.02,.55);g.add(muzzle);for(const x of[-.24,.24]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),mats.dark);eye.position.set(x,.15,.59);g.add(eye);const ear=new THREE.Mesh(new THREE.ConeGeometry(.24,.48,4),mats.deepPink);ear.position.set(x*1.55,.87,0);ear.rotation.y=Math.PI/4;g.add(ear)}for(const x of[-.73,.73]){const arm=new THREE.Mesh(new RoundedBoxGeometry(.25,.62,.3,4,.1),mats.pink);arm.position.set(x,-.08,0);arm.rotation.z=x<0?-.12:.12;g.add(arm)}const band=new THREE.Mesh(new RoundedBoxGeometry(1.29,.17,1.17,3,.06),mats.deepPink);band.position.y=.38;g.add(band);return g}
const player=makeCat();scene.add(player);const velocity=new THREE.Vector3(),keys={},spawn=new THREE.Vector3(0,1,6);let grounded=false,playing=false,yaw=0,pitch=.28,currentCheckpoint=0,coyote=0,jumpBuffer=0;
const levelNames=["THE UNDERCITY","BROKEN CORNERS","NEEDLE WALK","THE SPIRAL","CROWN RUN"];
const checkpoints=[{y:0,pos:new THREE.Vector3(0,1,6)},{y:20,pos:new THREE.Vector3(0,21,0)},{y:40,pos:new THREE.Vector3(0,41,0)},{y:60,pos:new THREE.Vector3(0,61,0)},{y:80,pos:new THREE.Vector3(0,81,0)}];
function respawn(){player.position.copy(spawn);velocity.set(0,0,0)}respawn();

function overlapsXZ(pos,s){const half=.48;return pos.x+half>s.min.x&&pos.x-half<s.max.x&&pos.z+half>s.min.z&&pos.z-half<s.max.z}
function collidesAt(pos){const feet=pos.y-.65,head=pos.y+.65;return solids.find(s=>overlapsXZ(pos,s)&&head>s.min.y&&feet<s.max.y)}
function moveHorizontal(axis,amount){const steps=Math.max(1,Math.ceil(Math.abs(amount)/.16)),step=amount/steps;for(let i=0;i<steps;i++){player.position[axis]+=step;if(collidesAt(player.position)){player.position[axis]-=step;velocity[axis]=0;break}}}
function update(dt){
  if(!playing)return;jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=grounded?.11:Math.max(0,coyote-dt);if(jumpBuffer>0&&coyote>0){velocity.y=10.8;grounded=false;coyote=0;jumpBuffer=0}const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),side=(keys.KeyA?1:0)-(keys.KeyD?1:0),speed=(keys.ShiftLeft||keys.ShiftRight)?9:5;
  const dir=new THREE.Vector3();if(forward||side){dir.set(Math.sin(yaw)*forward+Math.cos(yaw)*side,0,Math.cos(yaw)*forward-Math.sin(yaw)*side).normalize();velocity.x=THREE.MathUtils.damp(velocity.x,dir.x*speed,24,dt);velocity.z=THREE.MathUtils.damp(velocity.z,dir.z*speed,24,dt);player.rotation.y=Math.atan2(dir.x,dir.z);player.rotation.z=Math.sin(performance.now()*.018)*.035}else{velocity.x=THREE.MathUtils.damp(velocity.x,0,14,dt);velocity.z=THREE.MathUtils.damp(velocity.z,0,14,dt);player.rotation.z=0}
  moveHorizontal("x",velocity.x*dt);moveHorizontal("z",velocity.z*dt);velocity.y-=20*dt;const oldY=player.position.y,nextY=oldY+velocity.y*dt;player.position.y=nextY;grounded=false;
  if(velocity.y<=0){let landing=null;for(const s of solids)if(overlapsXZ(player.position,s)&&oldY-.65>=s.max.y-.08&&nextY-.65<=s.max.y){if(!landing||s.max.y>landing.max.y)landing=s}if(landing){player.position.y=landing.max.y+.65;velocity.y=0;grounded=true}}
  else{for(const s of solids)if(overlapsXZ(player.position,s)&&oldY+.65<=s.min.y+.08&&nextY+.65>=s.min.y){player.position.y=s.min.y-.65;velocity.y=0;break}}
  if(player.position.y<-12)respawn();for(let i=checkpoints.length-1;i>currentCheckpoint;i--)if(player.position.y>=checkpoints[i].y){currentCheckpoint=i;spawn.copy(checkpoints[i].pos);checkpointText.textContent=`${i+1} / 5`;levelName.textContent=levelNames[i];notice.textContent=`Level ${i+1}: ${levelNames[i]}`;notice.classList.add("show");setTimeout(()=>notice.classList.remove("show"),1800);break}
  if(player.position.y>100.8){playing=false;document.body.classList.remove("playing");document.exitPointerLock();win.hidden=false;crosshair.hidden=true}
  const h=Math.max(0,Math.floor(player.position.y));heightText.textContent=`${h}m`;bar.style.width=`${Math.min(100,h/101*100)}%`;
  const target=player.position.clone().add(new THREE.Vector3(0,1,0));const dist=7,flat=dist*Math.cos(pitch);camera.position.set(target.x-Math.sin(yaw)*flat,target.y+dist*Math.sin(pitch)+1.5,target.z-Math.cos(yaw)*flat);camera.lookAt(target);
}
function begin(){menu.hidden=true;win.hidden=true;currentCheckpoint=0;spawn.copy(checkpoints[0].pos);checkpointText.textContent="1 / 5";levelName.textContent=levelNames[0];respawn();playing=true;document.body.classList.add("playing");canvas.requestPointerLock()}
document.querySelector("#play").onclick=begin;document.querySelector("#again").onclick=begin;pause.onclick=()=>canvas.requestPointerLock();canvas.onclick=()=>{if(playing&&!document.pointerLockElement)canvas.requestPointerLock()};
document.addEventListener("pointerlockchange",()=>{const locked=document.pointerLockElement===canvas;pause.hidden=!playing||locked;crosshair.hidden=!locked});document.addEventListener("mousemove",e=>{if(document.pointerLockElement!==canvas)return;yaw-=e.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.0017,-1.05,1.05)});
addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Space"){e.preventDefault();if(!e.repeat)jumpBuffer=.13}});addEventListener("keyup",e=>{keys[e.code]=false;if(e.code==="Space"&&velocity.y>4.5)velocity.y=4.5});
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const clock=new THREE.Clock();function loop(){
  requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04),time=clock.elapsedTime;update(dt);
  for(const {flame,halo,phase} of candleFlames){const sway=Math.sin(time*5+phase);flame.position.x=sway*.025;flame.position.z=Math.cos(time*4+phase)*.02;flame.rotation.z=sway*.18;flame.scale.y=1+Math.sin(time*9+phase)*.13;halo.scale.setScalar(.85+Math.sin(time*8+phase)*.08)}
  const nearest=candleFlames.map(candle=>({candle,distance:candle.position.distanceToSquared(camera.position)})).sort((a,b)=>a.distance-b.distance);
  candleLights.forEach((light,index)=>{const item=nearest[index];light.position.copy(item.candle.position);light.intensity=4.5+Math.sin(time*8+item.candle.phase)*.4});
  renderer.render(scene,camera)
}camera.position.set(0,6,14);camera.lookAt(0,2,0);loop();
