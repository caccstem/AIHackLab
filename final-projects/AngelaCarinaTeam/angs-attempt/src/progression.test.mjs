import test from 'node:test';
import assert from 'node:assert/strict';
import {emptySaved,resolve,appear,reviewState,selectReview,gap,history,remaining,masteredCount,testPool,saveTest,testSummary,parseSaved,requiredFor,flaggedCount,backlogCount,testAvailable} from './progression.ts';
const at='2026-11-07T12:00:00.000Z';
function filler(s,count=10){for(let i=0;i<count;i++)s=resolve(s,'filler','practice',true);return s;}
function success(s,id){s=filler(s);assert.equal(gap(s,id),0);return resolve(appear(s,id,'review'),id,'review',true);}
test('Practice and Game populate history with stable IDs, sources and newest mistake first',()=>{
 let s=resolve(emptySaved(),'table','practice',false,false,at);s=resolve(s,'stick','game',false,false,'2026-11-08T12:00:00Z');assert.deepEqual(history(s,['table','stick']),['stick','table']);assert.equal(s.progress.table.sourceMode,'practice');assert.equal(s.progress.stick.sourceMode,'game');assert.equal(s.progress.table.requiredReviews,'2');
 s={...s,language:'no'};assert.deepEqual(history(parseSaved(JSON.stringify(s)),['table','stick']),['stick','table']);
});
test('cycle requirements double 2,4,8,16; every new P/G mistake resets completed successes',()=>{
 let s=emptySaved();for(const [i,n] of ['2','4','8','16'].entries()){s=resolve(s,'a',i%2?'game':'practice',false);assert.equal(s.progress.a.requiredReviews,n);assert.equal(s.progress.a.cycleMistakes,i+1);assert.equal(s.progress.a.completedReviews,'0');if(i<3)s=success(s,'a');}
 assert.equal(s.progress.a.totalMistakes,4);assert.equal(requiredFor(60),'1152921504606846976');
});
test('Review wrong/revealed resets progress, preserving P/G mistakes, requirement, date and source',()=>{
 for(const revealed of [false,true]){let s=resolve(emptySaved(),'a','game',false,false,at);s=success(s,'a');s=filler(s);s=resolve(s,'a','review',false,revealed);assert.equal(s.progress.a.completedReviews,'0');assert.equal(s.progress.a.requiredReviews,'2');assert.equal(s.progress.a.totalMistakes,1);assert.equal(s.progress.a.lastMistakeAt,at);assert.equal(s.progress.a.sourceMode,'game');}
});
test('mastery ends cycle and preserves ever-mastered history; a later miss starts at two',()=>{
 let s=resolve(emptySaved(),'a','practice',false);s=success(s,'a');assert.equal(remaining(s.progress.a),'1');s=success(s,'a');assert.equal(s.progress.a.mastered,true);assert.equal(s.progress.a.everMastered,true);assert.equal(s.progress.a.cycleMistakes,0);assert.deepEqual(reviewState(s,['a']).pool,[]);
 s=resolve(s,'a','game',false);assert.equal(s.progress.a.mastered,false);assert.equal(s.progress.a.everMastered,true);assert.equal(s.progress.a.cycleMistakes,1);assert.equal(s.progress.a.requiredReviews,'2');assert.equal(s.progress.a.completedReviews,'0');
});
test('exactly ten OTHER completed questions satisfy spacing; nine and navigation do not',()=>{
 let s=resolve(emptySaved(),'a','practice',false);s.reviewUnlocked=true;assert.equal(gap(s,'a'),10);assert.equal(selectReview(s,['a']),null);s=filler(s,9);s=parseSaved(JSON.stringify(s));assert.equal(gap(s,'a'),1);assert.equal(selectReview(s,['a']),null);s=filler(s,1);assert.equal(selectReview(s,['a']),'a');
 const before=s;assert.equal(appear(s,'a','review'),before);s=resolve(s,'a','review',true);assert.equal(gap(s,'a'),10);s=filler(s);s=appear(s,'a','game');assert.equal(gap(s,'a'),0);s=resolve(s,'a','game',true);assert.equal(gap(s,'a'),10);
});
test('permanent Review unlock needs eleven distinct misses; Test availability uses only the current backlog',()=>{
 let s=emptySaved();for(let i=0;i<20;i++)s=resolve(s,'same','practice',false);assert.equal(flaggedCount(s),1);assert.equal(s.reviewUnlocked,false);
 for(let i=1;i<11;i++){s=resolve(s,'r'+i,i%2?'game':'practice',false);assert.equal(s.reviewUnlocked,i===10);}
 assert.equal(backlogCount(s),11);assert.equal(testAvailable(s),true);assert.deepEqual(testPool(s,Object.keys(s.progress)),[]);
 for(let i=1;i<3;i++){s=success(s,'r'+i);s=success(s,'r'+i);}
 assert.equal(backlogCount(s),9);assert.equal(testAvailable(s),false);assert.equal(s.reviewUnlocked,true);assert.deepEqual(testPool(s,Object.keys(s.progress)),['r1','r2']);
 s=resolve(s,'r1','game',false);assert.equal(backlogCount(s),10);assert.equal(testAvailable(s),true);assert.deepEqual(testPool(s,Object.keys(s.progress)),['r2']);
});
test('additional review of mastered recipes preserves mastery on success and re-flags on error/reveal',()=>{
 for(const reveal of [false,true]){let s=resolve(emptySaved(),'a','practice',false);s=success(s,'a');s=success(s,'a');s.reviewUnlocked=true;s=filler(s);
 assert.equal(selectReview(s,['a'],()=>1,'mastered'),'a');assert.equal(selectReview(s,['a']),null);
 s=resolve(s,'a','review',true);assert.equal(s.progress.a.mastered,true);assert.equal(backlogCount(s),0);assert.equal(s.progress.a.cycleMistakes,0);assert.equal(gap(s,'a'),10);
 s=filler(s);s=resolve(s,'a','review',false,reveal,'2026-11-09T12:00:00Z');assert.equal(s.progress.a.mastered,false);assert.equal(s.progress.a.requiredReviews,'2');assert.equal(s.progress.a.cycleMistakes,1);assert.equal(s.progress.a.sourceMode,'review');assert.equal(s.progress.a.everMastered,true);assert.deepEqual(testPool(s,['a']),[]);assert.equal(backlogCount(s),1);
 assert.equal(parseSaved(JSON.stringify(s)).reviewUnlocked,true);}
});
test('Review stays unlocked even when all flagged recipes are mastered; optional spacing is enforced',()=>{
 let s=emptySaved();for(let i=0;i<11;i++)s=resolve(s,'r'+i,'practice',false);for(let i=0;i<11;i++){s=success(s,'r'+i);s=success(s,'r'+i);}assert.equal(s.reviewUnlocked,true);assert.equal(backlogCount(s),0);assert.equal(testAvailable(s),false);assert.equal(testPool(s,Object.keys(s.progress)).length,11);assert.equal(selectReview(s,['r10'],()=>1,'mastered'),null);s=filler(s,9);assert.equal(selectReview(s,['r10'],()=>1,'mastered'),null);s=filler(s,1);assert.equal(selectReview(s,['r10'],()=>1,'mastered'),'r10');
});
test('test answers/results never change learning or global spacing; variable pool and summary',()=>{
 let s=resolve(emptySaved(),'a','practice',false);const original=s;assert.equal(appear(s,'a','test'),s);assert.equal(resolve(s,'a','test',false),s);assert.equal(resolve(s,'a','test',true),s);
 const answers=[{id:'a',correct:true},{id:'b',correct:false},{id:'c',correct:true}];s=saveTest(s,answers,at);assert.deepEqual(s.progress,original.progress);assert.equal(s.completedQuestions,original.completedQuestions);assert.deepEqual(testSummary(answers),{correct:2,total:3,percent:67,incorrect:['b']});assert.equal(parseSaved(JSON.stringify(s)).testResults.length,1);
});
test('migration preserves explicit mastery, settings and known misses without inventing dates, sources or repeated events',()=>{
 const legacy={version:1,language:'no',difficulty:'hard',progress:{a:{attempts:12,mistakes:7,reviews:3,streak:1,mastered:false},b:{attempts:9,mistakes:2,reviews:7,streak:7,mastered:true},bad:{attempts:-1}}};
 const s=parseSaved(JSON.stringify(legacy));assert.equal(s.version,3);assert.equal(s.progress.a.cycleMistakes,1);assert.equal(s.progress.a.requiredReviews,'2');assert.equal(s.progress.a.completedReviews,'0');assert.equal(s.progress.a.legacyMistakes,7);assert.equal(s.progress.a.lastMistakeAt,null);assert.equal(s.progress.a.sourceMode,null);assert.equal(s.progress.b.everMastered,true);assert.equal(s.completedQuestions,0);assert.equal(s.progress.bad,undefined);assert.equal(s.language,'no');assert.equal(s.difficulty,'hard');assert.equal(gap(s,'a'),10);
 assert.deepEqual(parseSaved('broken'),emptySaved());assert.deepEqual(parseSaved('{"version":99}'),emptySaved());
});

test('version two permanent Test flag is ignored; cycles, timestamps, spacing and explicit mastery migrate',()=>{
 let s=resolve(emptySaved(),'a','game',false,false,at);const old={...s,version:2,testUnlocked:true};delete old.reviewUnlocked;const migrated=parseSaved(JSON.stringify(old));assert.equal(testAvailable(migrated),false);assert.equal('testUnlocked' in migrated,false);assert.deepEqual(migrated.progress,s.progress);assert.equal(migrated.completedQuestions,s.completedQuestions);assert.equal(migrated.reviewUnlocked,false);
});
