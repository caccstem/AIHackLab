import {weightedPick} from './preferences.ts';
export type Mode='practice'|'game'|'review'|'test';
export type Learning={
 attempts:number; totalMistakes:number; cycleMistakes:number;
 requiredReviews:string; completedReviews:string; mastered:boolean; everMastered:boolean;
 lastMistakeAt:string|null; sourceMode:'practice'|'game'|'review'|null; lastAppearance:number|null;
 legacyMistakes:number;
};
export type TestAnswer={id:string,correct:boolean};
export type TestResult={at:string,answers:TestAnswer[]};
export type Saved={version:3,language:'en'|'no',difficulty:'easy'|'hard',progress:Record<string,Learning>,completedQuestions:number,reviewUnlocked:boolean,testResults:TestResult[]};
export const SPACING=10;
export const emptyLearning=():Learning=>({attempts:0,totalMistakes:0,cycleMistakes:0,requiredReviews:'0',completedReviews:'0',mastered:false,everMastered:false,lastMistakeAt:null,sourceMode:null,lastAppearance:null,legacyMistakes:0});
export const emptySaved=():Saved=>({version:3,language:'en',difficulty:'easy',progress:{},completedQuestions:0,reviewUnlocked:false,testResults:[]});
export const requiredFor=(mistakes:number)=>(2n**BigInt(mistakes)).toString();
export const remaining=(p:Learning)=>{const n=BigInt(p.requiredReviews)-BigInt(p.completedReviews);return (n>0n?n:0n).toString();};
export const struggled=(p:Learning)=>p.totalMistakes>0||p.legacyMistakes>0;
export const active=(p:Learning)=>struggled(p)&&!p.mastered;
export const masteredCount=(s:Saved)=>Object.values(s.progress).filter(p=>struggled(p)&&p.everMastered).length;
export const flaggedCount=(s:Saved,ids=Object.keys(s.progress))=>ids.filter(id=>s.progress[id]&&struggled(s.progress[id])).length;
export const backlogCount=(s:Saved,ids=Object.keys(s.progress))=>ids.filter(id=>s.progress[id]&&active(s.progress[id])).length;
export const testAvailable=(s:Saved,ids=Object.keys(s.progress))=>backlogCount(s,ids)>=10;
export const testPool=(s:Saved,ids:string[])=>ids.filter(id=>s.progress[id]?.mastered&&struggled(s.progress[id]));
export function gap(s:Saved,id:string){const last=s.progress[id]?.lastAppearance;return last==null?0:Math.max(0,SPACING-(s.completedQuestions-last));}
export function reviewState(s:Saved,ids:string[],kind:'active'|'mastered'='active'){const pool=ids.filter(id=>s.progress[id]&&struggled(s.progress[id])&&(kind==='mastered'?s.progress[id].mastered:!s.progress[id].mastered));const eligible=pool.filter(id=>gap(s,id)===0);return {pool,eligible,wait:pool.length?Math.min(...pool.map(id=>gap(s,id))):0};}
export function selectReview(s:Saved,ids:string[],weight:(id:string)=>number=()=>1,kind:'active'|'mastered'='active',random=Math.random){if(!s.reviewUnlocked)return null;const {eligible}=reviewState(s,ids,kind);return weightedPick(eligible,id=>weight(id)*(1+s.progress[id].cycleMistakes),random);}
export function history(s:Saved,ids:string[]){return ids.filter(id=>s.progress[id]&&struggled(s.progress[id])).sort((a,b)=>(s.progress[b].lastMistakeAt||'').localeCompare(s.progress[a].lastMistakeAt||'')||a.localeCompare(b));}
// Only completed appearances reset scheduling; navigation is not a completion.
export function appear(s:Saved,_id:string,_mode:Mode):Saved{return s;}
export function resolve(s:Saved,id:string,mode:Mode,correct:boolean,revealed=false,now=new Date().toISOString()):Saved{
 if(mode==='test')return s;
 const p={...(s.progress[id]||emptyLearning())};p.attempts++;p.lastAppearance=s.completedQuestions+1;
 if(mode==='practice'||mode==='game'){
  if(!correct){p.cycleMistakes=p.mastered?1:p.cycleMistakes+1;p.totalMistakes++;p.requiredReviews=requiredFor(p.cycleMistakes);p.completedReviews='0';p.mastered=false;p.lastMistakeAt=now;p.sourceMode=mode;}
 }else if(p.mastered&&struggled(p)){
  if(!correct||revealed){p.cycleMistakes=1;p.totalMistakes++;p.requiredReviews='2';p.completedReviews='0';p.mastered=false;p.lastMistakeAt=now;p.sourceMode='review';}
 }else if(active(p)){
  if(!correct||revealed)p.completedReviews='0';
  else{p.completedReviews=(BigInt(p.completedReviews)+1n).toString();if(BigInt(p.completedReviews)>=BigInt(p.requiredReviews)){p.mastered=true;p.everMastered=true;p.cycleMistakes=0;}}
 }
 const next={...s,completedQuestions:s.completedQuestions+1,progress:{...s.progress,[id]:p}};
 return {...next,reviewUnlocked:s.reviewUnlocked||flaggedCount(next)>=11};
}
export function saveTest(s:Saved,answers:TestAnswer[],now=new Date().toISOString()):Saved{return {...s,testResults:[{at:now,answers:answers.map(a=>({...a}))},...s.testResults].slice(0,20)};}
export function testSummary(answers:TestAnswer[]){const correct=answers.filter(a=>a.correct).length;return {correct,total:answers.length,percent:answers.length?Math.round(100*correct/answers.length):0,incorrect:answers.filter(a=>!a.correct).map(a=>a.id)};}
const integer=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
const decimal=(s:unknown)=>typeof s==='string'&&/^\d{1,4096}$/.test(s);
export function parseSaved(raw:string|null):Saved{
 const out=emptySaved();try{
  const v=JSON.parse(raw||'null');if(!v||![1,2,3].includes(v.version))return out;
  out.language=v.language==='no'?'no':'en';out.difficulty=v.difficulty==='hard'?'hard':'easy';
  if(v.version>=2){out.completedQuestions=integer(v.completedQuestions)?v.completedQuestions:0;out.reviewUnlocked=v.version===3&&v.reviewUnlocked===true;}
  for(const [id,value] of Object.entries(v.progress||{})){
   if(['__proto__','constructor','prototype'].includes(id))continue;
   const p=value as Record<string,unknown>;if(!p||!integer(p.attempts))continue;
   if(v.version===1){if(!integer(p.mistakes)||typeof p.mastered!=='boolean')continue;
    // Legacy counters included review failures; only one original P/G miss is certain.
    const missed=Number(p.mistakes)>0;out.progress[id]={...emptyLearning(),attempts:p.attempts as number,totalMistakes:missed?1:0,legacyMistakes:p.mistakes as number,cycleMistakes:missed&&!p.mastered?1:0,requiredReviews:missed&&!p.mastered?'2':'0',mastered:p.mastered,everMastered:p.mastered,lastAppearance:missed?0:null};
   }else{
    if(!['totalMistakes','cycleMistakes','legacyMistakes'].every(k=>integer(p[k]))||!decimal(p.requiredReviews)||!decimal(p.completedReviews)||typeof p.mastered!=='boolean'||typeof p.everMastered!=='boolean'||!(p.lastAppearance===null||integer(p.lastAppearance)))continue;
    if(BigInt(p.completedReviews as string)>BigInt(p.requiredReviews as string))continue;
    out.progress[id]={...p,lastMistakeAt:typeof p.lastMistakeAt==='string'&&Number.isFinite(Date.parse(p.lastMistakeAt))?new Date(p.lastMistakeAt).toISOString():null,sourceMode:p.sourceMode==='practice'||p.sourceMode==='game'||p.sourceMode==='review'?p.sourceMode:null} as Learning;
   }
  }
  out.reviewUnlocked=out.reviewUnlocked||flaggedCount(out)>=11;
  if(v.version>=2&&Array.isArray(v.testResults))out.testResults=v.testResults.filter((t:TestResult)=>typeof t?.at==='string'&&Array.isArray(t.answers)&&t.answers.every(a=>typeof a.id==='string'&&typeof a.correct==='boolean')).slice(0,20);
  return out;
 }catch{return out;}
}
