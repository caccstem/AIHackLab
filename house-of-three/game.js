'use strict';
const rooms=[
 {name:'The Bathroom',description:'The east wing’s marble bathing chamber. Even the silence feels inherited.',color:'#526e69',code:'5831',puzzles:[
 ["The medicine cabinet", "A key is inside exactly one of four jars: A, B, C, or D. Exactly ONE label tells the truth.\n\nA: “The key is in B or C.”\nB: “The key is in A.”\nC: “The key is not in C.”\nD: “The key is in D.”\n\nWhich jar contains the key? Enter its letter.", "c", "Test each possible hiding place. Count true labels, including the label on that jar; only one hiding place makes exactly one label true."],
 ["The balance of water", "An empty bath has two taps and an open drain. Tap A alone fills it in 12 minutes; B alone in 18. The drain alone empties a full bath in 36 minutes. All rates are constant.\n\nBoth taps run with the drain open for 3 minutes. Then A is closed; B and the drain stay open. How many minutes TOTAL, from the start, until the bath is full?", "27", "Work in fractions of a bath per minute. Find the amount filled during the first phase, then use the new net rate for the remaining water. Include the first 3 minutes."],
 ["The mirror drawer", "The mirror has two alphabet rows:\nABCDEFGHIJKLMNOPQRSTUVWXYZ\nZYXWVUTSRQPONMLKJIHGFEDCBA\n\nBelow them: MLRGX VOUVI\n\n“Exchange each letter for its partner across the glass. Then read as the mirror reads. The gap is only a crack.”\n\nWhat single English word is hidden?", "reflection", "Ignore the space. Substitute using the paired alphabets, then reverse the entire result."]]},
 {name:'The Living Room',description:'The grand drawing room. Generations of portraits watch from the walls.',color:'#75634e',code:'2746',puzzles:[
 ["The chess table", "Four guests must cross a narrow bridge at night. Their crossing times are 1, 3, 7, and 12 minutes. At most two may cross together, taking the slower person’s time. They have one lantern, which must accompany EVERY crossing, including returns. Nobody can throw the lantern.\n\nAll start on the same side. What is the minimum total time to get everyone across? Enter minutes.", "22", "It can be cheaper to send the two slowest together. Compare that strategy with having the fastest escort each person. Account for every return."],
 ["The locked book", "Find one seven-letter English word. Its first two letters form a male pronoun. Its first three form a female object pronoun. Its first four name a person admired for courage. The whole word names a woman admired for courage.\n\nAll four readings must use the same unchanged beginning.", "heroine", "Write the pronouns first, then extend the prefix without rearranging or replacing any letters."],
 ["The three portraits", "Five portraits A, B, C, D, E must be arranged left to right.\n\nE is immediately to the right of C.\nB is immediately to the right of A.\nD is somewhere to the right of E, but somewhere to the left of A.\n\nEnter the complete five-letter order with no spaces.", "cedab", "Treat each “immediately” pair as an inseparable block. Place D between the two blocks."]]},
 {name:'The Bedroom',description:'The master suite, high above the grounds. Its last guest never checked out.',color:'#625975',code:'4916',puzzles:[
 ["The music box", "Find a nine-letter adjective meaning surprising. Remove exactly one letter at each step, preserving the order of every remaining letter. Each shorter word must match the next clue:\n\n8 letters: beginning\n7: looking fixedly\n6: a cord\n5: an insect’s painful jab\n4: make vocal music\n3: a moral wrongdoing\n2: inside\n1: the speaker, as a pronoun\n\nEnter the original nine-letter word.", "startling", "Work backward from I, adding one letter at a time without rearranging. Your six-letter word must be STRING."],
 ["The bedside clock", "Two 12-hour clocks are set correctly at 6:00 AM. One gains 5 minutes per real hour; the other loses 7 minutes per real hour. They run continuously at those constant rates, with no date or AM/PM display.\n\nAfter how many real hours will their displayed readings first agree again? Enter a whole number of hours.", "60", "Their readings separate at a combined rate. They match again when that separation equals one full 12-hour dial, not when either clock alone becomes correct."],
 ["The wardrobe", "Five coats hang in a row, belonging to Ada, Bea, Cora, Dina, and Eli.\n\nAda is exactly two positions to the right of Dina.\nCora is somewhere to the left of Dina.\nEli is somewhere to the right of Ada.\nBea is not at either end.\n\nWhose coat is in the center? Enter the owner’s name.", "bea", "Try each possible position for Dina. Leave room for Cora on her left, Ada two places right, and Eli beyond Ada."]]},
 {name:'The Kitchen',description:'The vast estate kitchen. Beyond the servants’ wing lies your way out.',color:'#637477',code:'6093',puzzles:[
 ["The pantry safe", "The pantry ledger is an addition puzzle:\n\n  SEND\n+ MORE\n──────\n MONEY\n\nEach letter stands for a different digit, 0–9. A repeated letter always has the same value. Neither S nor M is zero.\n\nWhat five-digit number is MONEY?", "10652", "The addition creates one extra digit, so first determine M. Track the carries column by column; the thousands column tightly constrains S and O."],
 ["The recipe tin", "Find a ten-letter English occupation containing three consecutive pairs of identical letters, with no gaps between the pairs. Its final six letters name someone who guards or retains something.\n\nThe answer is singular and contains no spaces or hyphens.", "bookkeeper", "The occupation involves maintaining records. The six-letter run of doubled letters starts at the second letter."],
 ["The final cupboard", "Three witnesses A, B, C each make two claims. One witness tells TWO truths, one tells TWO lies, and one tells ONE truth and ONE lie. Each role is used exactly once.\n\nA: “B is the two-lie witness.” “C is the mixed witness.”\nB: “A is the two-lie witness.” “C is the two-truth witness.”\nC: “A is the two-truth witness.” “B is the two-truth witness.”\n\nWhich witness is mixed? Enter A, B, or C.", "c", "Assign the three roles to the witnesses, then check both claims from each. A mixed witness must make exactly one true claim, not merely at least one."]]}
];

// Each fragment reveals only one digit and its position in the door code.
const codeClues=[
 [
  {place:'Behind the mirror',p:[1.5, 3.25, 0.05],text:"FIRST DIGIT · Find the smallest positive whole number that leaves remainder 2 when divided by 3, remainder 3 when divided by 4, and remainder 0 when divided by 5. Use its units digit.",hint:"List multiples of 5 and test both other remainders. The smallest solution has two digits."},
  {place:'On the windowsill',p:[-4,2.35,.2],text:"SECOND DIGIT · Two strips read TGE and HI. The note says: “Each strip faces backward. Restore each one, then weave their letters together, taking from the longer strip first.” The woven word names your digit.",hint:"Reverse each strip separately. Alternate a letter from the longer strip with a letter from the shorter until neither has letters left."},
  {place:'Beneath the bath mat',p:[-5, 0.12, 8],text:"THIRD DIGIT · Among the whole numbers from 1 through 24 inclusive, how many are divisible by 6 but NOT divisible by 9?",hint:"List the multiples of 6 in the interval. Exclude numbers that also divide evenly by 9."},
  {place:'Inside the towel stack',p:[6.6, 1.95, 7.1],text:"FOURTH DIGIT · A is paired with Z, B with Y, C with X, and so on. Decode VML using those pairs, then read the result backward. Write the number word as a digit.",hint:"Do both operations in order: alphabet substitution, then reversal."}
 ],
 [
  {place:'Under a sofa cushion',p:[-6.3, 1.12, 8.7],text:"FIRST DIGIT · A cipher turns GRRU into DOOR by moving every letter the same distance backward through the alphabet. Apply the identical shift to WZR. Write the decoded number as a digit.",hint:"Compare G with D to determine the shift, then use it on all three encoded letters."},
  {place:'Tucked into a book spine',p:[6.45, 2.25, 9.45],text:"SECOND DIGIT · What is the units digit of 3 raised to the power 103?",hint:"The units digits of successive powers repeat in a short cycle. Locate exponent 103 within that cycle."},
  {place:'Behind the wall note',p:[-1.8,2.45,.05],text:"THIRD DIGIT · “Only the tails survive, and the procession returns the way it came.”\ncedar · emu · echo · leaf\nThe hidden word names a number.",hint:"Take each word’s final letter. Reverse the sequence of extracted letters."},
  {place:'Under the chessboard',p:[-0.75, 0.8, 7.9],text:"FOURTH DIGIT · Four different guests sit around a round table. Arrangements that differ only by rotating everyone together count as the same. Mirror images count as different. How many arrangements are there?",hint:"Fix one guest in place to remove rotational duplicates, then arrange everyone else."}
 ],
 [
  {place:'Inside a pillowcase',p:[-4.9, 1.55, 4.9],text:"FIRST DIGIT · Write out the product 1 × 2 × 3 × … × 20. How many zeros are at the very end of its decimal representation?",hint:"Each trailing zero needs a factor of 10. Count the scarcer ingredient in the pairs of 2 and 5; do not calculate the entire product."},
  {place:'Behind the bedside lamp',p:[-0.6, 2.22, 3.65],text:"SECOND DIGIT · The same two-step cipher turns CAT into UBD: move every letter one place forward in the alphabet, then reverse the whole string. Decode FOJO. The original word names your digit.",hint:"To undo a process, undo its steps in reverse order. First reverse FOJO, then move each letter backward."},
  {place:'Inside the wardrobe handle',p:[6.4, 1.45, 8.38],text:"THIRD DIGIT · Find the longest uninterrupted run of letters shared by STONE, MONEY, and HONEY, keeping the letters in their original order. That shared run spells your digit.",hint:"The matching block can appear at different positions in the three words. Do not rearrange letters or skip over any."},
  {place:'Under the rug edge',p:[1.1, 0.12, 12.5],text:"FOURTH DIGIT · Form a three-digit number using different digits chosen from 1, 2, 3, 4. The sum of its digits must be 6. How many such numbers can you form?",hint:"First determine which set of three digits works. Then count the orders in which those digits can appear."}
 ],
 [
  {place:'Beneath a spice jar',p:[-7, 2.25, 4.6],text:"FIRST DIGIT · Find the smallest positive integer divisible by every integer from 1 through 5. Use its tens digit.",hint:"Build the least common multiple. You need enough factors for both 4 and 3 as well as 5."},
  {place:'Under the chopping board',p:[-1, 1.85, 7.05],text:"SECOND DIGIT · “Keep the ends. Return from the bottom.”\nmango\ncedar\nlime\nfizz\nRead the recovered number word as a digit.",hint:"Take the last letter of each line, then read your letters from the bottom upward."},
  {place:'Inside the oven handle',p:[0,1.3,1.65],text:"THIRD DIGIT · Add every whole number from 1 to 99. Then add the digits of that total. Keep adding the digits of each new total until only one digit remains.",hint:"Pair the first and last terms to find the initial sum. The first digit-sum is still two digits, so do not stop there."},
  {place:'Behind a cupboard door',p:[4,2.65,.95],text:"FOURTH DIGIT · Decode ZNXKK. Every letter was moved the same number of places forward around A–Z. The original is the English name of a digit from zero to nine. No other operation was used.",hint:"Try one shift consistently across all five letters. The repeated final letters must decode to a repeated ending in a number word."}
 ]
];
const $=s=>document.querySelector(s),canvas=$('#scene'),ctx=createRoomRenderer(canvas);
let playing=false,hasSave=false;
let discoveries={},room=0,found=[],journal=[],active=null,finished=false; const storage='house-of-three-v1';
try{const s=JSON.parse(localStorage.getItem(storage));if(s&&Number.isInteger(s.room)&&s.room>=0&&s.room<4&&Array.isArray(s.found)&&Array.isArray(s.journal)){hasSave=true;room=s.room;found=[...new Set(s.found.filter(i=>Number.isInteger(i)&&i>=0&&i<3))];journal=s.journal.filter(n=>n&&typeof n.room==='string'&&typeof n.title==='string'&&typeof n.answer==='string');for(let r=0;r<4;r++){const entries=s.discoveries?.[r];if(Array.isArray(entries))discoveries[r]=[...new Set(entries.filter(i=>Number.isInteger(i)&&i>=0&&i<4))];}finished=!!s.finished;}}catch{}
function save(){hasSave=true;try{localStorage.setItem(storage,JSON.stringify({room,found,journal,finished,discoveries}));}catch{}}
let camera={x:0,y:2.5,z:13.8,a:0,pitch:-.08},held={},objects=[],markers=[],last=0,timer;
function foundClues(){return discoveries[room]||[];}
function updateClueStatus(){ $('#clueCount').textContent=`Passcode clues: ${foundClues().length} / 4`; }
const keyPositions=[
 [[-7,2.1,3.08],[-5.8,1.9,5.3],[6.6,1.15,7.65]],
 [[-1.4,.95,7.6],[6,1.35,3.5],[3.05,3.2,0]],
 [[-3.2,1.55,5.4],[-1.25,1.6,4.35],[7,2.2,8.35]],
 [[-7,1.2,4.65],[-1,2,6.95],[3.5,.9,1.46]]
];
let furnishing=false;
function box(x,y,z,w,h,d,color){objects.push({x,y,z,w,h,d,color,group:furnishing?'furniture':null});}
function setup(){camera={x:0,y:2.5,z:13.8,a:0,pitch:-.08};objects=[];const r=rooms[room];box(0,-.16,8.5,20,.3,19,'#776c59');box(0,4,-.45,20,8,.3,r.color);box(-10,4,8.5,.2,8,19,r.color);box(10,4,8.5,.2,8,19,r.color);
 box(0,4,18,20,8,.2,r.color);box(0,8.05,8.5,20,.15,19,'#555c51');
 box(5.05,1.55,-.2,1.3,3.1,.18,'#253c3b');box(5.05,3.2,-.15,1.5,.1,.2,'#b69a68');box(5.57,1.5,-.04,.08,.12,.12,'#ecc37b');
 box(-1.8,2.45,-.16,1.3,1.35,.13,'#c6b68e');box(-1.8,2.45,-.07,1.08,1.12,.08,'#eee1bd');
 furnishing=true;
 if(room===0){box(-3.8,.65,2,2.8,1.3,2,'#d8dcd1');box(-3.8,1.32,2,2.4,.12,1.6,'#82b5b3');box(0,.65,.8,1.8,1.3,1,'#c4c3ad');box(0,1.35,.8,1.95,.17,1.2,'#e1e4d6');box(0,2.7,-.1,1.7,1.7,.1,'#aacac8');box(3.6,.8,2,1.4,1.6,1.1,'#7c634c');}
 if(room===1){box(-3.6,.5,2.2,3,1,1.5,'#9f8d65');box(-3.6,1.15,1.6,3,1.1,.4,'#b19c73');box(-5,.9,2.2,.3,.7,1.5,'#b19c73');box(-2.2,.9,2.2,.3,.7,1.5,'#b19c73');box(0,.6,2,2.1,.18,1.6,'#745138');for(const x of [-.85,.85])box(x,.3,2,.12,.6,1.3,'#463c2c');box(0,.75,2,1,.1,1,'#d2c19b');box(3.6,1.2,1,1.5,2.4,.7,'#493e31');for(let i=0;i<6;i++)box(3.05+i*.21,1.7,1,.14,1,.8,['#a19266','#658480','#986954'][i%3]);}
 if(room===2){box(-3,.4,3,3.8,.8,4.5,'#554737');box(-3,.94,3,3.7,.4,4.3,'#bbb1b8');box(-3,1.17,3.5,3.7,.12,3.1,'#777c91');box(-3,1.3,1.4,2.7,.3,.8,'#d6cbbf');box(0,.65,1,1.2,1.3,1,'#816846');box(0,1.55,1,.5,.45,.4,'#cfb579');box(3.6,1.5,1.6,2,3,1.3,'#7b695d');box(3.6,1.5,2.27,.035,2.8,.03,'#342f2b');}
 if(room===3){box(0,.8,.65,9,1.6,1.4,'#c1ba9e');box(0,1.65,.65,9.2,.15,1.5,'#ddd4b8');for(let x=-4;x<5;x+=1.5)box(x,.8,1.37,.035,1.4,.03,'#7a8171');box(-3.6,2.4,.4,1.8,1.1,.8,'#b5b79e');box(3.6,2.4,.4,1.8,1.1,.8,'#b5b79e');box(0,1.77,.7,1.6,.1,1,'#343e3b');box(-.4,1.84,.7,.4,.08,.4,'#7d8d86');box(.4,1.84,.7,.4,.08,.4,'#7d8d86');}
 furnishing=false;decorateRoom(room, box, objects);spreadRoomFurniture(room,objects);decorateMansionInterior(room,box,objects);furnishRoomZones(room,box,objects);
 // Ceiling beams and rug create depth without obscuring the view.
 box(0,7.7,1,20,.2,.3,'#303e39');box(0,.035,5,4,.025,2.4,room===0?'#91aaa2':'#8a7c63');
 $('#roomName').textContent=r.name;$('#description').textContent=r.description;$('#number').textContent=`0${room+1} — 04`;$('#keys').innerHTML=[0,1,2].map(i=>`<span class="key ${found.includes(i)?'found':''}" aria-label="Key ${i+1} ${found.includes(i)?'found':'missing'}">${found.includes(i)?'⚿':'·'}</span>`).join('');
 updateClueStatus();
 codeClues[room].forEach(c=>{box(c.p[0],c.p[1]-.05,c.p[2],.2,.12,.035,'#e3cf9e');});
 $('#labels').replaceChildren();markers=[...r.puzzles.map((p,i)=>({p:keyPositions[room][i],name:p[0],id:i})),...codeClues[room].map((c,i)=>({p:c.p,name:c.place,id:5+i})),{p:[5.05,1.8,.05],name:'Exit door',id:4}];markers.forEach(m=>{m.el=document.createElement('button');const solved=m.id>=5?foundClues().includes(m.id-5):found.includes(m.id);m.el.className='marker'+(solved?' solved':'');m.el.innerHTML=`${solved?'✓':m.id===4?'↗':m.id>=5?'⌘':'+'}<span>${m.name}</span>`;m.el.onclick=()=>open(m.id);$('#labels').append(m.el);});}
function project(p){return projectRoomPoint(p,camera,innerWidth,innerHeight);}
function movePlayer(dt){
 const turn=(held.ArrowRight?1:0)-(held.ArrowLeft?1:0);camera.a=(camera.a+turn*dt*1.1)%(Math.PI*2);
 camera.pitch=Math.max(-.65,Math.min(.65,camera.pitch+((held.ArrowUp?1:0)-(held.ArrowDown?1:0))*dt*.9));
 const forward=(held.w?1:0)-(held.s?1:0),side=(held.d?1:0)-(held.a?1:0),length=Math.hypot(forward,side)||1;
 const dx=(Math.sin(camera.a)*forward+Math.cos(camera.a)*side)/length*dt*2.7;
 const dz=(-Math.cos(camera.a)*forward+Math.sin(camera.a)*side)/length*dt*2.7;
 const blocked=(x,z)=>objects.some(b=>b.h>.25&&b.y+b.h/2>.3&&b.y-b.h/2<1.8&&Math.abs(x-b.x)<b.w/2+.24&&Math.abs(z-b.z)<b.d/2+.24);
 const x=Math.max(-9.3,Math.min(9.3,camera.x+dx)),z=Math.max(.6,Math.min(17.2,camera.z+dz));
 if(!blocked(x,camera.z))camera.x=x;if(!blocked(camera.x,z))camera.z=z;
}
function layoutMarkers(){
 const occupied=[];
 const obstacles=[...document.querySelectorAll('#gameUI header, #gameUI aside, #gameUI footer, #gameUI .touch')].filter(el=>el.getClientRects().length).map(el=>el.getBoundingClientRect());
 const fits=(x,y)=>x>=24&&x<=innerWidth-24&&y>=75&&y<=innerHeight-65&&!occupied.some(p=>Math.abs(x-p.x)<46&&Math.abs(y-p.y)<46)&&!obstacles.some(r=>x>r.left-24&&x<r.right+24&&y>r.top-24&&y<r.bottom+24);
 markers.forEach(m=>{const p=project(m.p);let spot=null;
 if(playing&&p.z>.15&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>-30&&p.x<innerWidth+30&&p.y>-30&&p.y<innerHeight+30){
  const base={x:Math.max(24,Math.min(innerWidth-24,p.x)),y:Math.max(75,Math.min(innerHeight-65,p.y))};
  const offsets=[[0,0],[0,-48],[0,48],[-48,0],[48,0],[-48,-48],[48,-48],[-48,48],[48,48],[0,-96],[0,96]];
  for(const [dx,dy] of offsets){const x=base.x+dx,y=base.y+dy;if(fits(x,y)){spot={x,y};break;}}
 }
 m.el.style.display=spot?'block':'none';if(spot){m.el.style.left=spot.x+'px';m.el.style.top=spot.y+'px';occupied.push(spot);}
 });
}
const mansionExterior=createMansionExterior();
const mansionCamera={x:18,y:11,z:36,a:-.65,pitch:-.12};
let lastFrameKey='',lastScene=null;
function render(t){
 const dt=Math.min((t-last)/1000||0,.04);last=t;
 if(!document.hidden){
  if(playing&&!$('#modal').open)movePlayer(dt);
  const key=[camera.x,camera.z,camera.a,camera.pitch,innerWidth,innerHeight,devicePixelRatio,playing].join(',');
  const visibleScene=playing?objects:mansionExterior;
  if(key!==lastFrameKey||visibleScene!==lastScene||ctx.dirty){drawRoom(ctx,canvas,visibleScene,playing?camera:mansionCamera,room,playing,t);layoutMarkers();lastFrameKey=key;lastScene=visibleScene;}
 }
 requestAnimationFrame(render);
}
function notify(s){$('#toast').textContent=s;clearTimeout(timer);timer=setTimeout(()=>$('#toast').textContent='',4000);}
function open(id){
 if(!playing||$('#modal').open||![0,1,2,4,5,6,7,8].includes(id))return;
 resetInput();active=id;held={};const r=rooms[room],fragment=id>=5?codeClues[room][id-5]:null;
 if(fragment&&!foundClues().includes(id-5)){
  discoveries[room]=[...foundClues(),id-5];save();updateClueStatus();
  const marker=markers.find(m=>m.id===id);if(marker){marker.el.classList.add('solved');marker.el.firstChild.textContent='✓';}
 }
 $('#kind').textContent=fragment?`PASSCODE FRAGMENT ${id-4} / 4`:id<3?`KEY ${id+1} / DEDUCTION`:'THE EXIT / THREE LOCKS';
 $('#title').textContent=fragment?fragment.place:id<3?r.puzzles[id][0]:'A door with three locks';
 $('#body').textContent=fragment?fragment.text:id<3?r.puzzles[id][1]:`Keys collected: ${found.length} / 3\nPasscode clues discovered: ${foundClues().length} / 4\nThe four passcode clues are hidden in different places around this room. Each gives one digit and its position. Check your notebook to piece them together, then enter the code.`;
 $('#answerForm').hidden=!!fragment||(id<3&&found.includes(id));$('#hint').hidden=id===4;
 $('#feedback').textContent=fragment?'Clue copied to your notebook.':id<3&&found.includes(id)?'Solved. This key is in your pocket.':'';
 $('#answer').value='';$('#answer').maxLength=id===4?4:60;$('#answer').inputMode=id===4?'numeric':'text';$('#answerLabel').textContent=id===4?'Four-digit passcode':'Your answer';$('#modal').showModal();if(!$('#answerForm').hidden)$('#answer').focus();
}
$('#answerForm').onsubmit=e=>{e.preventDefault();if(!playing||!Number.isInteger(active)||![0,1,2,4].includes(active))return;const a=$('#answer').value.trim().toLowerCase().replace(/[.!?]$/,'');if(active===4){if(found.length!==3){$('#feedback').textContent='The three key locks must be opened first.';return;}if(a!==rooms[room].code){$('#feedback').textContent='That code does not fit. Compare the fragments in your notebook.';return;}$('#modal').close();if(room===3){finished=true;save();win();}else{room++;found=[];save();setup();notify('Door unlocked. A new room, three new keys.');}}else if(active<3){if(a===rooms[room].puzzles[active][2]){if(!found.includes(active)){found.push(active);journal.push({room:rooms[room].name,title:rooms[room].puzzles[active][0],answer:a});save();}$('#modal').close();const previousCamera={...camera};setup();camera=previousCamera;notify(`Key secured · ${found.length} of 3`);}else $('#feedback').textContent='The lock stays shut. Check your reasoning and try again.';}};
$('#hint').onclick=()=>{$('#feedback').textContent=active>=5?codeClues[room][active-5].hint:rooms[room].puzzles[active][3];};$('#close').onclick=()=>$('#modal').close();$('#door').onclick=()=>open(4);$('#resetView').onclick=()=>camera={x:0,y:2.5,z:13.8,a:0,pitch:-.08};
function notebook(){
 if(!playing||$('#modal').open)return;resetInput();active=null;$('#kind').textContent='YOUR FIELD NOTES';$('#title').textContent='What the house revealed';$('#body').replaceChildren();
 const heading=document.createElement('p');heading.textContent=`${rooms[room].name} · Passcode clues: ${foundClues().length} / 4`;$('#body').append(heading);
 codeClues[room].forEach((c,i)=>{const entry=document.createElement('article');entry.textContent=foundClues().includes(i)?`${c.place}\n${c.text}`:`Fragment ${i+1} · Not discovered yet. Search the room.`;$('#body').append(entry);});
 journal.forEach(n=>{const a=document.createElement('article');a.textContent=`${n.room} · ${n.title}\nAnswer: ${n.answer} · Key secured`;$('#body').append(a);});$('#answerForm').hidden=true;$('#hint').hidden=true;$('#feedback').textContent='Only clues you discover are recorded. Progress saves automatically in this browser.';$('#modal').showModal();
}
$('#notes').onclick=notebook;
function win(){active=null;$('#kind').textContent='04 / 04 · BLACKTHORN MANOR RELEASES YOU';$('#title').textContent='You found your way out.';$('#body').textContent='Twelve keys. Four codes. Every room understood.\n\nThe great doors open onto the manor’s sweeping grounds. Beyond the fountain and iron gates, morning waits. Blackthorn Manor finally lets you go.';const b=document.createElement('button');b.textContent='Play again';b.onclick=()=>{room=0;found=[];journal=[];discoveries={};finished=false;save();$('#modal').close();setup();};$('#body').append(document.createElement('br'),b);$('#answerForm').hidden=true;$('#hint').hidden=true;$('#feedback').textContent='';$('#modal').showModal();}
let drag=null;
function resetInput(){held={};drag=null;}
addEventListener('keydown',e=>{if(!playing||$('#modal').open)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(['w','a','s','d','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)){e.preventDefault();held[k]=true;}if(k==='j'&&!e.repeat)notebook();});
addEventListener('keyup',e=>held[e.key.length===1?e.key.toLowerCase():e.key]=false);
addEventListener('blur',resetInput);document.addEventListener('visibilitychange',resetInput);$('#modal').addEventListener('close',resetInput);
canvas.onpointerdown=e=>{if(!playing||$('#modal').open||e.button!==0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(playing&&drag&&e.pointerId===drag.id&&!$('#modal').open){camera.a=(camera.a-(e.clientX-drag.x)*.004)%(Math.PI*2);camera.pitch=Math.max(-.65,Math.min(.65,camera.pitch+(e.clientY-drag.y)*.003));drag.x=e.clientX;drag.y=e.clientY;}};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>drag=null;
document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{if(!playing||$('#modal').open)return;e.preventDefault();held[b.dataset.move]=true;b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>held[b.dataset.move]=false;});
function showHome(){playing=false;resetInput();$('#gameUI').hidden=true;$('#homepage').hidden=false;document.body.classList.add('at-home');$('#continueBtn').hidden=!hasSave;$('#continueBtn').textContent=finished?'View your completed escape →':'Continue your escape →';$('#playBtn').innerHTML=hasSave?'Start a new escape <span>↗</span>':'Enter the mansion <span>↗</span>';$('#saveInfo').textContent=hasSave?(finished?'All four rooms completed.':`${rooms[room].name} · ${found.length} of 3 keys · ${foundClues().length} of 4 code clues`):'No timer. Just you and the mystery.';$('.home-caption').textContent='BLACKTHORN MANOR / THE ESTATE AWAITS';$('#playBtn').focus();}
function enterHouse(fresh){if(fresh){room=0;found=[];journal=[];discoveries={};finished=false;save();}playing=true;resetInput();$('#homepage').hidden=true;$('#gameUI').hidden=false;document.body.classList.remove('at-home');setup();$('#notes').focus();if(finished)win();}
$('#homeBtn').onclick=showHome;
$('#continueBtn').onclick=()=>enterHouse(false);
$('#playBtn').onclick=()=>{if(hasSave&&!finished){active=null;$('#kind').textContent='A FRESH START';$('#title').textContent='Begin again?';$('#body').textContent='Starting a new escape replaces your saved progress.';const b=document.createElement('button');b.textContent='Start a new escape';b.onclick=()=>{$('#modal').close();enterHouse(true);};$('#body').append(document.createElement('br'),b);$('#answerForm').hidden=true;$('#hint').hidden=true;$('#feedback').textContent='Close this window to keep your progress.';$('#modal').showModal();}else enterHouse(true);};
$('#howBtn').onclick=()=>{active=null;$('#kind').textContent='A FEW THINGS BEFORE YOU ENTER';$('#title').textContent='Look closer.';$('#body').textContent='Explore four grand chambers in Blackthorn Manor: the bathroom, drawing room, master bedroom, and estate kitchen. Click glowing markers to examine objects and solve a mix of word riddles, logic challenges, and math puzzles hiding three keys in each room.\n\nFind four passcode fragments in different places around each room. Each fragment gives one digit and its position. Discovered clues are copied into your notebook; undiscovered clues stay hidden. You need all three keys AND the correct code to open the exit.\n\nWASD to move · Arrow keys or drag to look left, right, up, and down · J for your notebook. On a phone, use the on-screen arrows.\n\nHints are available inside each puzzle. Your progress saves automatically. Use Home to take a break.';$('#answerForm').hidden=true;$('#hint').hidden=true;$('#feedback').textContent='';$('#modal').showModal();};
setup();showHome();requestAnimationFrame(render);
