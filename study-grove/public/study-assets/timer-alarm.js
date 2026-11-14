'use strict';
(()=>{
let context=null,notes=[],version=0;
const banner=document.createElement('div');banner.className='timer-alarm';banner.hidden=true;banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');const message=document.createElement('span'),stop=document.createElement('button');stop.type='button';stop.textContent='Stop ringtone';banner.append(message,stop);document.body.append(banner);
async function prime(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;context=context||new Audio();if(context.state==='suspended')await context.resume();return context.state==='running'}catch{return false}}
function silence(){version++;for(const note of notes){try{note.osc.stop()}catch{}note.osc.disconnect();note.gain.disconnect()}notes=[]}
function dismiss(){silence();banner.hidden=true}
async function ring(text='Time’s up!'){silence();const current=version;message.textContent=text;banner.hidden=false;stop.textContent='Stop ringtone';const ready=await prime();if(current!==version)return;if(!ready){message.textContent=text+' Sound is unavailable. Check your browser’s audio settings.';stop.textContent='Dismiss';return}const start=context.currentTime;for(let round=0;round<6;round++)for(const [offset,frequency]of [[0,659.25],[.22,783.99],[.44,987.77]]){const osc=context.createOscillator(),gain=context.createGain(),at=start+round*1.6+offset;osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.18,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.32);osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+.35);notes.push({osc,gain});osc.onended=()=>{osc.disconnect();gain.disconnect()}}setTimeout(()=>{if(current===version){silence();stop.textContent='Dismiss'}},10000)}
stop.onclick=dismiss;
// Unlock audio during the same user gesture that starts either timer.
document.addEventListener('click',event=>{if(event.target.closest?.('#start, #count-start'))void prime()},true);
window.studyAlarm={prime,ring,stop:dismiss};
for(const id of ['reset','count-reset']){const anchor=document.getElementById(id);if(!anchor)continue;const button=document.createElement('button');button.type='button';button.className='test-ringtone';button.textContent='Test ringtone';button.onclick=()=>void ring('Ringtone preview');anchor.insertAdjacentElement('afterend',button)}
})();
