import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const canvas=document.querySelector("#game"),menu=document.querySelector("#menu"),pause=document.querySelector("#pause"),win=document.querySelector("#win"),notice=document.querySelector("#notice");
const heightText=document.querySelector("#height"),checkpointText=document.querySelector("#checkpoint"),bar=document.querySelector("#bar"),crosshair=document.querySelector("#crosshair");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x15243d);scene.fog=new THREE.FogExp2(0x1c2b48,.008);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
scene.add(new THREE.HemisphereLight(0x8db5e8,0x34243c,2.2));const moonLight=new THREE.DirectionalLight(0xffe4b8,3);moonLight.position.set(-20,35,15);moonLight.castShadow=true;moonLight.shadow.mapSize.set(2048,2048);scene.add(moonLight);

const mats={stone:new THREE.MeshStandardMaterial({color:0x34465b,roughness:.75}),edge:new THREE.MeshStandardMaterial({color:0x738b91,roughness:.7}),coral:new THREE.MeshStandardMaterial({color:0xdb7865,roughness:.65}),cream:new THREE.MeshStandardMaterial({color:0xffe2b5}),dark:new THREE.MeshStandardMaterial({color:0x3d2c35}),mint:new THREE.MeshStandardMaterial({color:0x86b89a}),gold:new THREE.MeshStandardMaterial({color:0xffd679,emissive:0xffa52e,emissiveIntensity:4})};
const solids=[];function box(x,y,z,w,h,d,mat=mats.stone){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);solids.push({mesh:m,min:new THREE.Vector3(x-w/2,y-h/2,z-d/2),max:new THREE.Vector3(x+w/2,y+h/2,z+d/2)});return m}

// Tower course: broad checkpoint floors connected by smaller jumps.
box(0,-1,0,28,2,28);const course=[
[-7,2,0,6,1,6],[0,4,-5,7,1,5],[7,6,-2,5,1,5],[7,8,6,5,1,8],[0,10,9,8,1,5],
[-8,12,7,6,1,5],[-10,14,0,5,1,5],[-5,16,-7,6,1,5],[3,18,-9,8,1,5],[10,20,-5,5,1,6],
[11,22,3,5,1,5],[6,24,10,6,1,5],[-2,26,11,7,1,5],[-9,28,7,5,1,5],[-11,30,-1,5,1,7],
[-7,32,-9,6,1,5],[1,34,-11,7,1,5],[9,36,-7,5,1,5],[11,38,1,5,1,7],[7,40,9,6,1,5],
[0,42,11,7,1,5],[-8,44,8,5,1,5],[-11,46,0,5,1,6],[-6,48,-8,6,1,5],[2,50,-10,8,1,6],[0,53,0,16,1,16]
];course.forEach((p,i)=>box(...p,i%5===4?mats.edge:mats.stone));
for(let y=4;y<52;y+=8){box(-15,y,0,1,8,30,mats.dark);box(15,y,0,1,8,30,mats.dark);box(0,y,-15,30,8,1,mats.dark);box(0,y,15,30,8,1,mats.dark)}

// Warm windows and floating dust make the tower feel alive.
for(let y=3;y<52;y+=4)for(const side of[-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.1),mats.gold);w.position.set(side*14.49,y,((y*7)%22)-11);w.rotation.y=side<0?Math.PI/2:-Math.PI/2;scene.add(w)}
const lampSpots=[[-7,3,0],[7,7,-2],[0,11,9],[-10,15,0],[3,19,-9],[11,23,3],[-2,27,11],[-11,31,-1],[1,35,-11],[11,39,1],[0,43,11],[-11,47,0],[2,51,-10]];
for(const [x,y,z] of lampSpots){const lamp=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,1.7,8),mats.dark),bulb=new THREE.Mesh(new THREE.SphereGeometry(.19,12,8),mats.gold);pole.position.y=.85;bulb.position.y=1.72;lamp.add(pole,bulb);lamp.position.set(x+1.8,y,z);scene.add(lamp);const light=new THREE.PointLight(0xffc36b,5.5,11,1.7);light.position.set(x+1.8,y+1.75,z);scene.add(light)}
const starsGeo=new THREE.BufferGeometry(),stars=[];for(let i=0;i<500;i++)stars.push((Math.random()-.5)*240,Math.random()*140-10,(Math.random()-.5)*240);starsGeo.setAttribute("position",new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xffe6b5,size:.28,transparent:true,opacity:.8})));

function makeCat(){const g=new THREE.Group();const body=new THREE.Mesh(new RoundedBoxGeometry(1.2,1.3,1.08,5,.18),mats.coral);body.castShadow=true;g.add(body);const muzzle=new THREE.Mesh(new RoundedBoxGeometry(.72,.47,.06,4,.1),mats.cream);muzzle.position.set(0,.02,.55);g.add(muzzle);for(const x of[-.24,.24]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),mats.dark);eye.position.set(x,.15,.59);g.add(eye);const ear=new THREE.Mesh(new THREE.ConeGeometry(.24,.48,4),mats.coral);ear.position.set(x*1.55,.87,0);ear.rotation.y=Math.PI/4;g.add(ear)}const tail=new THREE.Mesh(new RoundedBoxGeometry(.28,.28,1,4,.1),mats.coral);tail.position.set(.58,-.25,-.55);tail.rotation.x=-.35;g.add(tail);const scarf=new THREE.Mesh(new RoundedBoxGeometry(1.28,.16,1.16,3,.06),mats.mint);scarf.position.y=.38;g.add(scarf);return g}
const player=makeCat();scene.add(player);const velocity=new THREE.Vector3(),keys={},spawn=new THREE.Vector3(0,1,6);let grounded=false,playing=false,yaw=0,pitch=.28,currentCheckpoint=0,coyote=0,jumpBuffer=0;
const checkpoints=[{y:0,pos:new THREE.Vector3(0,1,6)},{y:14,pos:new THREE.Vector3(-10,15,0)},{y:28,pos:new THREE.Vector3(-9,29,7)},{y:42,pos:new THREE.Vector3(0,43,11)}];
function respawn(){player.position.copy(spawn);velocity.set(0,0,0)}respawn();

function overlapsXZ(pos,s){const half=.48;return pos.x+half>s.min.x&&pos.x-half<s.max.x&&pos.z+half>s.min.z&&pos.z-half<s.max.z}
function collidesAt(pos){const feet=pos.y-.65,head=pos.y+.65;return solids.find(s=>overlapsXZ(pos,s)&&head>s.min.y&&feet<s.max.y)}
function moveHorizontal(axis,amount){const steps=Math.max(1,Math.ceil(Math.abs(amount)/.16)),step=amount/steps;for(let i=0;i<steps;i++){player.position[axis]+=step;if(collidesAt(player.position)){player.position[axis]-=step;velocity[axis]=0;break}}}
function update(dt){
  if(!playing)return;jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=grounded?.11:Math.max(0,coyote-dt);if(jumpBuffer>0&&coyote>0){velocity.y=10.8;grounded=false;coyote=0;jumpBuffer=0}const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),side=(keys.KeyD?1:0)-(keys.KeyA?1:0),speed=(keys.ShiftLeft||keys.ShiftRight)?9:5;
  const dir=new THREE.Vector3();if(forward||side){dir.set(Math.sin(yaw)*forward+Math.cos(yaw)*side,0,Math.cos(yaw)*forward-Math.sin(yaw)*side).normalize();velocity.x=THREE.MathUtils.damp(velocity.x,dir.x*speed,12,dt);velocity.z=THREE.MathUtils.damp(velocity.z,dir.z*speed,12,dt);player.rotation.y=Math.atan2(dir.x,dir.z);player.rotation.z=Math.sin(performance.now()*.018)*.035}else{velocity.x=THREE.MathUtils.damp(velocity.x,0,9,dt);velocity.z=THREE.MathUtils.damp(velocity.z,0,9,dt);player.rotation.z=0}
  moveHorizontal("x",velocity.x*dt);moveHorizontal("z",velocity.z*dt);velocity.y-=20*dt;const oldY=player.position.y,nextY=oldY+velocity.y*dt;player.position.y=nextY;grounded=false;
  if(velocity.y<=0){let landing=null;for(const s of solids)if(overlapsXZ(player.position,s)&&oldY-.65>=s.max.y-.08&&nextY-.65<=s.max.y){if(!landing||s.max.y>landing.max.y)landing=s}if(landing){player.position.y=landing.max.y+.65;velocity.y=0;grounded=true}}
  else{for(const s of solids)if(overlapsXZ(player.position,s)&&oldY+.65<=s.min.y+.08&&nextY+.65>=s.min.y){player.position.y=s.min.y-.65;velocity.y=0;break}}
  if(player.position.y<-12)respawn();for(let i=checkpoints.length-1;i>currentCheckpoint;i--)if(player.position.y>=checkpoints[i].y){currentCheckpoint=i;spawn.copy(checkpoints[i].pos);checkpointText.textContent=`${i+1} / 4`;notice.classList.add("show");setTimeout(()=>notice.classList.remove("show"),1500);break}
  if(player.position.y>52.8){playing=false;document.exitPointerLock();win.hidden=false;crosshair.hidden=true}
  const h=Math.max(0,Math.floor(player.position.y));heightText.textContent=`${h}m`;bar.style.width=`${Math.min(100,h/53*100)}%`;
  const target=player.position.clone().add(new THREE.Vector3(0,1,0));const dist=7,flat=dist*Math.cos(pitch);camera.position.set(target.x-Math.sin(yaw)*flat,target.y+dist*Math.sin(pitch)+1.5,target.z-Math.cos(yaw)*flat);camera.lookAt(target);
}
function begin(){menu.hidden=true;win.hidden=true;currentCheckpoint=0;spawn.copy(checkpoints[0].pos);checkpointText.textContent="1 / 4";respawn();playing=true;canvas.requestPointerLock()}
document.querySelector("#play").onclick=begin;document.querySelector("#again").onclick=begin;pause.onclick=()=>canvas.requestPointerLock();canvas.onclick=()=>{if(playing&&!document.pointerLockElement)canvas.requestPointerLock()};
document.addEventListener("pointerlockchange",()=>{const locked=document.pointerLockElement===canvas;pause.hidden=!playing||locked;crosshair.hidden=!locked});document.addEventListener("mousemove",e=>{if(document.pointerLockElement!==canvas)return;yaw-=e.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.0017,-1.05,1.05)});
addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Space"){e.preventDefault();if(!e.repeat)jumpBuffer=.13}});addEventListener("keyup",e=>{keys[e.code]=false;if(e.code==="Space"&&velocity.y>4.5)velocity.y=4.5});
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const clock=new THREE.Clock();function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);update(dt);renderer.render(scene,camera)}camera.position.set(0,6,14);camera.lookAt(0,2,0);loop();
