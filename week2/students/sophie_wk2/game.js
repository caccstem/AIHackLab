const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const ids = ["score","best","start-screen","end-screen","final-score","pause-label","start","restart","pause","sound"];
const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const momoImage = new Image();
momoImage.src = "assets/momo-red-panda.png";

let W=900,H=600,dpr=1,last=0,time=0,state="ready",soundOn=true,score=0;
let best=Number(localStorage.getItem("momo-city-best")||0),camera=0,levelWidth=5200,particles=[];
const keys={left:false,right:false};
const player={x:150,y:0,vx:0,vy:0,w:58,h:62,onGround:false,facing:1,coyote:0,runCycle:0};
let platforms=[],lanterns=[];
ui.best.textContent=best;

function resize(){
  const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);W=r.width;H=r.height;ctx.setTransform(dpr,0,0,dpr,0,0);
  if(state==="ready")player.y=H*.7-player.h;
}
addEventListener("resize",resize);resize();
const rand=(a,b)=>a+Math.random()*(b-a);
function tone(freq,d=.08,type="sine",vol=.04){if(!soundOn)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;tone.ac??=new A();const o=tone.ac.createOscillator(),g=tone.ac.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,tone.ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,tone.ac.currentTime+d);o.connect(g).connect(tone.ac.destination);o.start();o.stop(tone.ac.currentTime+d)}

function buildLevel(){
  const ground=H*.82;
  platforms=[
    {x:0,y:ground,w:620,h:100},{x:710,y:ground-55,w:350,h:155},{x:1140,y:ground-10,w:470,h:110},
    {x:1690,y:ground-105,w:250,h:205},{x:2010,y:ground-35,w:420,h:135},{x:2520,y:ground-145,w:230,h:245},
    {x:2835,y:ground-50,w:430,h:150},{x:3350,y:ground-120,w:280,h:220},{x:3710,y:ground-20,w:520,h:120},
    {x:4315,y:ground-85,w:250,h:185},{x:4645,y:ground-25,w:555,h:125},
    {x:410,y:ground-145,w:135,h:22},{x:920,y:ground-215,w:145,h:22},{x:1450,y:ground-185,w:145,h:22},
    {x:2190,y:ground-220,w:150,h:22},{x:3040,y:ground-245,w:150,h:22},{x:3910,y:ground-205,w:150,h:22}
  ];
  const spots=[[470,ground-185],[785,ground-105],[985,ground-255],[1260,ground-55],[1515,ground-225],[1790,ground-150],[2255,ground-260],[2615,ground-190],[3108,ground-285],[3490,ground-160],[3980,ground-245],[4410,ground-125],[4820,ground-65]];
  lanterns=spots.map(([x,y])=>({x,y,taken:false,phase:rand(0,6)}));
}
function reset(){buildLevel();score=0;camera=0;player.x=150;player.y=H*.82-player.h;player.vx=player.vy=0;player.facing=1;ui.score.textContent=0;particles=[];}
function startGame(){reset();state="playing";ui["start-screen"].hidden=true;ui["end-screen"].hidden=true;tone(440,.1);setTimeout(()=>tone(660,.13),70)}
function jump(){if(state==="ready"){startGame();return}if(state!=="playing")return;if(player.onGround||player.coyote>0){player.vy=-Math.max(470,H*.78);player.onGround=false;player.coyote=0;tone(520,.09);burst(player.x+player.w/2,player.y+player.h,"#f4cf8f",8)}}
function burst(x,y,color,n=10){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-110,110),vy:rand(-130,10),life:1,size:rand(2,5),color})}
function finish(){if(state!=="playing")return;state="won";best=Math.max(best,score);localStorage.setItem("momo-city-best",best);ui.best.textContent=best;ui["final-score"].textContent=score;tone(523,.12);setTimeout(()=>tone(659,.12),100);setTimeout(()=>tone(784,.25),200);setTimeout(()=>ui["end-screen"].hidden=false,500)}
function respawn(){player.x=Math.max(80,camera+100);player.y=H*.25;player.vx=0;player.vy=0;burst(player.x,player.y,"#f2a68e",16);tone(170,.2,"triangle")}
function togglePause(){if(state==="playing"){state="paused";ui["pause-label"].hidden=false}else if(state==="paused"){state="playing";ui["pause-label"].hidden=true;last=performance.now()}}

function update(dt){
  time+=dt;if(state!=="playing")return;
  const accel=player.onGround?1500:850,max=260,drag=player.onGround?.78:.94;
  if(keys.left){player.vx-=accel*dt;player.facing=-1}if(keys.right){player.vx+=accel*dt;player.facing=1}if(!keys.left&&!keys.right)player.vx*=Math.pow(drag,dt*60);
  player.vx=Math.max(-max,Math.min(max,player.vx));player.vy+=Math.max(1100,H*1.75)*dt;
  player.x+=player.vx*dt;player.x=Math.max(0,Math.min(levelWidth-player.w,player.x));
  const oldBottom=player.y+player.h;player.y+=player.vy*dt;player.onGround=false;
  for(const p of platforms){if(player.x+player.w>p.x+5&&player.x<p.x+p.w-5&&oldBottom<=p.y+8&&player.y+player.h>=p.y&&player.vy>=0){player.y=p.y-player.h;player.vy=0;player.onGround=true;break}}
  player.coyote=player.onGround?.1:Math.max(0,player.coyote-dt);player.runCycle+=Math.abs(player.vx)*dt*.055;
  if(player.y>H+180)respawn();
  for(const l of lanterns){if(!l.taken&&Math.hypot(player.x+player.w/2-l.x,player.y+player.h/2-l.y)<45){l.taken=true;score++;ui.score.textContent=score;burst(l.x,l.y,"#ffd98b",14);tone(760,.08);setTimeout(()=>tone(980,.1),55)}}
  if(player.x>levelWidth-190)finish();
  const target=Math.max(0,Math.min(levelWidth-W,player.x-W*.32));camera+=(target-camera)*Math.min(1,dt*5);
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.life-=dt*1.7});particles=particles.filter(p=>p.life>0);
}

function rect(x,y,w,h,r=0){ctx.beginPath();r?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);ctx.fill()}
function drawSky(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#435d7a");g.addColorStop(.48,"#b4868e");g.addColorStop(1,"#f2bd8a");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(W*.72,H*.22,4,W*.72,H*.22,H*.36);glow.addColorStop(0,"#fff4c9d9");glow.addColorStop(.22,"#fbd7a45f");glow.addColorStop(1,"#fbd7a400");ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#fff5cf";ctx.beginPath();ctx.arc(W*.76,H*.18,Math.max(25,H*.055),0,7);ctx.fill();
  ctx.fillStyle="#fff9ddbb";for(let i=0;i<25;i++){const x=(i*197-camera*.025)%W,y=30+(i*83)%(H*.38);ctx.fillRect(x,y,1.5,1.5)}
}
function drawBuildings(layer,base,color,speed){
  ctx.fillStyle=color;const shift=-(camera*speed)%170;
  for(let i=-2;i<W/110+3;i++){const x=i*150+shift,w=90+Math.abs(i*31%45),h=80+Math.abs((i*73+layer*41)%150);rect(x,base-h,w,h,5);
    ctx.fillStyle=layer===2?"#f4c47c99":"#ffd99c66";for(let wy=base-h+18;wy<base-15;wy+=24)for(let wx=x+15;wx<x+w-10;wx+=25)if((wx+wy+i)%4>1)rect(wx,wy,5,8,1);ctx.fillStyle=color;
    if(i%3===0){ctx.fillRect(x+w*.45,base-h-18,3,18);ctx.beginPath();ctx.arc(x+w*.45+1,base-h-19,3,0,7);ctx.fill()}
  }
}
function drawCity(){drawSky();drawBuildings(0,H*.71,"#6d7182",.12);drawBuildings(1,H*.79,"#4f6270",.23);drawBuildings(2,H*.87,"#344f59",.4)}
function drawPlatforms(){
  for(const p of platforms){const x=p.x-camera;if(x>W+30||x+p.w<-30)continue;const g=ctx.createLinearGradient(0,p.y,0,p.y+p.h);g.addColorStop(0,"#486562");g.addColorStop(1,"#283f45");ctx.fillStyle=g;rect(x,p.y,p.w,p.h,8);ctx.fillStyle="#708b7b";rect(x,p.y,p.w,9,5);
    ctx.fillStyle="#f0bd7899";for(let wx=x+22;wx<x+p.w-12;wx+=42)for(let wy=p.y+30;wy<Math.min(H,p.y+p.h-10);wy+=36)if((wx+wy)%3>1)rect(wx,wy,8,12,2);
    ctx.fillStyle="#789987";for(let i=12;i<p.w;i+=32){ctx.beginPath();ctx.arc(x+i,p.y-3,6,0,7);ctx.fill()}
  }
}
function drawLanterns(){for(const l of lanterns){if(l.taken)continue;const x=l.x-camera,y=l.y+Math.sin(time*3+l.phase)*5;if(x<-40||x>W+40)continue;const glow=ctx.createRadialGradient(x,y,2,x,y,28);glow.addColorStop(0,"#fff5b5cc");glow.addColorStop(1,"#ffd27b00");ctx.fillStyle=glow;ctx.fillRect(x-30,y-30,60,60);ctx.fillStyle="#ffe39b";ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.fill();ctx.strokeStyle="#bd6c55";ctx.lineWidth=2;ctx.strokeRect(x-7,y-7,14,15)}}
function drawGoal(){const x=levelWidth-150-camera,y=H*.82-112;ctx.fillStyle="#334e55";rect(x,y,110,112,12);ctx.fillStyle="#f2b978";rect(x+12,y+15,86,65,8);ctx.fillStyle="#fff0b8";rect(x+22,y+25,27,30,4);rect(x+61,y+25,27,30,4);ctx.fillStyle="#263d43";ctx.beginPath();ctx.arc(x+25,y+103,14,0,7);ctx.arc(x+85,y+103,14,0,7);ctx.fill();ctx.fillStyle="#f8d994";ctx.font="700 12px DM Sans";ctx.fillText("HOME",x+34,y+74)}
function drawPlayer(){
  const sx=player.x-camera+player.w/2,sy=player.y+player.h/2;const moving=Math.abs(player.vx)>20&&player.onGround;const bob=moving?Math.sin(player.runCycle)*3:Math.sin(time*2.5)*1.5;const stretch=player.onGround?(moving?1+Math.sin(player.runCycle*2)*.025:1):1.07;const squash=2-stretch;
  ctx.save();ctx.translate(sx,sy+bob);ctx.scale(player.facing*stretch,squash);ctx.rotate(player.onGround?Math.sin(player.runCycle)*.025:Math.max(-.18,Math.min(.22,player.vy/1500)));const size=112;if(momoImage.complete)ctx.drawImage(momoImage,-size/2,-size/2,size,size);ctx.restore();
}
function drawParticles(){for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x-camera,p.y,p.size,0,7);ctx.fill()}ctx.globalAlpha=1}
function draw(){drawCity();drawPlatforms();drawLanterns();drawGoal();drawParticles();drawPlayer();if(state==="ready"){ctx.fillStyle="#243e4950";ctx.fillRect(0,0,W,H)}}
function loop(t){const dt=Math.min((t-last)/1000,.033)||0;last=t;update(dt);draw();requestAnimationFrame(loop)}

const control=(code,on)=>{if(["ArrowLeft","KeyA"].includes(code))keys.left=on;if(["ArrowRight","KeyD"].includes(code))keys.right=on};
addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","ArrowUp","Space"].includes(e.code))e.preventDefault();control(e.code,true);if((e.code==="Space"||e.code==="ArrowUp"||e.code==="KeyW")&&!e.repeat)jump();if(e.code==="KeyP"||e.code==="Escape")togglePause()});
addEventListener("keyup",e=>control(e.code,false));
ui.start.addEventListener("click",startGame);ui.restart.addEventListener("click",startGame);ui.pause.addEventListener("click",togglePause);
ui.sound.addEventListener("click",()=>{soundOn=!soundOn;ui.sound.textContent=soundOn?"♪":"×";ui.sound.setAttribute("aria-pressed",String(soundOn));ui.sound.setAttribute("aria-label",soundOn?"Mute sound":"Turn sound on")});
buildLevel();requestAnimationFrame(loop);
