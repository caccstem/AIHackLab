// Runs inside a fresh game iframe. Test progress stays in session memory.
const originalSave=save;save=()=>{};

const errors=[];addEventListener('error',e=>errors.push(e.message));
setTimeout(()=>{try{
 const check=(v,m)=>{if(!v)throw Error(m);};const captures=[];enterHouse(true);
 check(!!ctx.gl,'WebGL depth renderer active');
 for(let r=0;r<4;r++){
  room=r;found=[];setup();playing=true;
  for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2,2*Math.PI])for(const pitch of [-.65,0,.65]){camera.a=angle;camera.pitch=pitch;drawRoom(ctx,canvas,objects,camera,room,true,0);check(ctx.gl.getError()===ctx.gl.NO_ERROR,'GPU error in room '+r);}
  camera={x:1.5,y:2.5,z:15.5,a:-.12,pitch:-.12};drawRoom(ctx,canvas,objects,camera,room,true,0);layoutMarkers();captures.push({name:rooms[r].name,image:canvas.toDataURL()});
  const reachable=new Set();
  for(const angle of [-3.14,-2.4,-1.6,-.8,0,.8,1.6,2.4,3.14])for(const pitch of [-.6,-.3,0,.3]){camera.a=angle;camera.pitch=pitch;layoutMarkers();const visible=markers.filter(m=>m.el.style.display==='block');for(const m of visible){reachable.add(m.id);const a=m.el.getBoundingClientRect();check(a.left>=0&&a.right<=innerWidth&&a.top>=0&&a.bottom<=innerHeight,'offscreen marker');for(const other of visible){if(m===other)continue;const b=other.el.getBoundingClientRect();check(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,'overlapping markers');}}}
  check(reachable.size===8,'unreachable marker in '+r+': '+[...reachable]);
  camera={x:0,y:2.5,z:13.8,a:0,pitch:0};
  if(r===2){camera.x=-4;held={w:true};for(let i=0;i<150;i++)movePlayer(.04);check(camera.z>=8.49,'walked into bed');resetInput();}
  held={w:true,d:true};camera={x:0,y:2.5,z:13.8,a:0,pitch:0};movePlayer(.04);check(Math.abs(Math.hypot(camera.x,camera.z-13.8)-.108)<.00001,'diagonal speed');resetInput();
  for(let id=5;id<=8;id++){open(id);check($('#modal').open,'fragment opens');check($('#answerForm').hidden,'fragment read only');$('#modal').close();}
  for(let id=0;id<3;id++){open(id);$('#answer').value=rooms[r].puzzles[id][2];$('#answerForm').onsubmit({preventDefault(){}});check(found.includes(id),'key awarded');}
  open(4);$('#answer').value=rooms[r].code;$('#answerForm').onsubmit({preventDefault(){}});if(r===3){check(finished,'victory');$('#modal').close();}else check(room===r+1,'room transition');
 }
 check(errors.length===0,'runtime errors: '+errors.join(','));parent.postMessage({houseTest:true,passed:true,message:'All four rooms passed: rendering, clue access, collisions, movement speed, keys and exits.'},location.origin);
 playing=false;$('#gameUI').hidden=true;$('#homepage').hidden=true;canvas.style.display='none';document.body.style.cssText='overflow:auto;background:#101c20;padding:20px;font:14px sans-serif;color:white';
 const title=document.createElement('h2');title.textContent='PASS · All four rooms: GPU rotation/pitch, reachable non-overlapping clues, collision, movement speed, puzzles and exits';document.body.append(title);
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:18px';document.body.append(grid);
 captures.forEach(c=>{const card=document.createElement('div'),name=document.createElement('p'),img=document.createElement('img');name.textContent=c.name;img.src=c.image;img.style.width='100%';card.append(name,img);grid.append(card);});
 }catch(e){parent.postMessage({houseTest:true,passed:false,message:e.message},location.origin);const el=document.createElement('pre');el.id='qa-failure';el.style.cssText='position:fixed;inset:0;z-index:999;background:#200;color:white;padding:40px';el.textContent='FAIL '+e.stack;document.body.append(el);}
},300);
