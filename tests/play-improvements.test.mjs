import test from 'node:test';
import assert from 'node:assert/strict';
import {RequestScope,currentReview,deadlineRequest} from '../lib/client-flow.mjs';
import {evidenceCoverage,latestExchange,turnState} from '../lib/perspective-summary.mjs';
import {parseCaseIntention,splitImmediatePlan} from '../lib/case-intentions.mjs';
import {createCaseState,commitCase,caseView} from '../lib/case-simulation.mjs';
import {encodeWorld} from '../lib/world-codec.mjs';
import {person,refreshAccess} from '../lib/case-world.mjs';
import {readSessions,rememberSession} from '../lib/client-state.mjs';

const state=()=>{const s=createCaseState(3);s.joined=true;return s;};
let n=0;
function pair(s,a,b='Wait 1 minute'){const first=s.exchange%2?'A':'B';for(const seat of [first,first==='A'?'B':'A'])commitCase(s,seat,{exchange:s.exchange,requestId:`improved_play_${++n}`,prompt:seat==='A'?a:b});}

test('a short compound intention reviews every step without changing the world or revealing it to the other player',()=>{
 const s=state(),before=JSON.stringify(encodeWorld(s));
 const intent=parseCaseIntention(s,'A','Approach Nell, then ask her about the key; inspect the key register');
 assert.equal(intent.tasks.filter(t=>t.kind==='ask').length,1);assert.equal(intent.tasks.find(t=>t.kind==='ask').to,'N');assert.equal(intent.tasks.at(-1).target,'register');
 assert.equal(JSON.stringify(encodeWorld(s)),before);
 const instrument=parseCaseIntention(s,'A','Take the brass weight then hit Nell with it');assert.equal(instrument.tasks.at(-1).instrument,'weight');
 commitCase(s,'A',{exchange:1,prompt:intent.prompt,requestId:'compound_pending_001'});assert(!JSON.stringify(caseView(s,'B','room')).includes(intent.prompt));assert.equal(s.world.elapsedDays,.5);
});

test('commands inside quoted speech and writing remain content; an unsupported later clause cannot silently disappear',()=>{
 const s=state();
 const quote='Tell Nell: "Inspect the register and take the brass weight; then strangle Ada"';
 const tasks=parseCaseIntention(s,'A',quote).tasks;assert.deepEqual(tasks.filter(t=>t.kind!=='move').map(t=>t.kind),['say']);assert(tasks.at(-1).words.includes('then strangle Ada'));
 const writing=parseCaseIntention(s,'A','Write "Wait, then take the pen and run" on my paper');assert.equal(writing.tasks.at(-1).kind,'write');
 assert.throws(()=>parseCaseIntention(s,'A','Inspect the register then teleport to the moon'),/supported|attempt/);
 assert.throws(()=>parseCaseIntention(s,'A','Inspect the register and teleport to the moon'),/supported|attempt/);
 assert.throws(()=>parseCaseIntention(s,'A','Strangle her'),/earlier target/);
 assert.throws(()=>parseCaseIntention(s,'A','Inspect register; strangle her'),/previous target was an object/);
 assert.throws(()=>splitImmediatePlan('Tell Nell "Take the pen'),/quotation/);
});

test('immediate plans have bounded duration/steps and repeated approaches report their own actual movement',()=>{
 const s=state();
 assert.throws(()=>parseCaseIntention(s,'A',Array(7).fill('Look around').join('; ')),/six immediate steps/);
 assert.throws(()=>parseCaseIntention(s,'A','Wait 20 minutes then wait 20 minutes'),/30 simulated minutes/);
 pair(s,'Approach Nell then approach Nell');
 const entries=caseView(s,'A','room').entries.filter(e=>e.kind==='consequence'&&e.text.includes('Nell'));
 assert(entries.some(e=>e.text.includes('cross part')));assert(entries.some(e=>e.text.includes('no further progress')));
});

test('combining inspection attempts still acquires records through physical access, rather than the plan text',()=>{
 const s=state();pair(s,'Inspect key register then inspect Rowan');
 const v=caseView(s,'A','room');assert(v.discoveries.some(d=>d.root==='register'));assert(v.discoveries.some(d=>d.root==='body'));
 const blocked=state();person(blocked,'A').pos={x:8,y:7};refreshAccess(blocked);pair(blocked,'Stay here and inspect key register then inspect Rowan');
 assert.equal(caseView(blocked,'A','room').discoveries.length,0);
});

test('the case board counts original sources and firsthand acquisitions without identifying the culprit or validating claims',()=>{
 const coverage=evidenceCoverage([{root:'register',category:'access',mode:'reported',supports:'N'},{root:'register',category:'access',mode:'direct',version:2},{root:'clock',category:'timeline',mode:'reported'},{root:'written-lie',category:'statement',mode:'direct',supports:'N'},{root:'incident',category:'incident',mode:'direct'}]);
 assert.equal(coverage.sources,2);assert.equal(coverage.firsthand,1);assert.equal(coverage.categories.find(c=>c.key==='means').count,0);
 for(const forbidden of ['culprit','supports','written-lie','Nell'])assert(!JSON.stringify(coverage).includes(forbidden));
});

test('exchange recaps and waiting status use only the requesting perspective',()=>{
 const s=state();pair(s,'Inspect register');const v=caseView(s,'A','room');
 const last=latestExchange(v);assert.equal(last.exchange,1);assert.equal(last.intention,'Inspect register');assert(last.minutes>0);assert(last.readings>0);
 assert(!('otherPrompt' in last));assert(!('culprit' in last));assert.equal(turnState(v).phase,'waiting');
 v.result={reason:'Case closed'};assert.equal(turnState(v).phase,'closed');
});

test('navigation cancels late replies, including when returning to the same seat, and stale reviews cannot apply to changed text',async()=>{
 const scope=new RequestScope(),old=scope.begin(),view={roomId:'room-a',seat:'A',exchange:1,canSubmit:true};
 let release;const reply=new Promise(resolve=>{release=resolve;});let shown='new match';
 const pending=reply.then(()=>{if(scope.current(old))shown='old match';});scope.begin();release();await pending;assert.equal(shown,'new match');
 const current=scope.capture();assert(currentReview(current,scope,view,view,'Inspect register','Inspect register'));
 assert(!currentReview(current,scope,view,view,'Inspect register','Attack Nell'));
 assert(!currentReview(current,scope,view,{...view,exchange:2},'Inspect register','Inspect register'));
 scope.begin();assert(!currentReview(current,scope,view,view,'Inspect register','Inspect register'));
});

test('a network deadline stops waiting without asserting failure or changing the retried payload',async()=>{
 const body=JSON.stringify({action:'commit',requestId:'same_durable_request',prompt:'Wait'});let sent;
 const fetcher=async(_url,options)=>{sent=options.body;return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))));};
 await assert.rejects(()=>deadlineRequest(fetcher,'/api/matches',{method:'POST',body},5),/too long to confirm/);assert.equal(sent,body);
});

test('saved player keys are retained beyond twelve matches and corrupt display metadata is discarded',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 for(let i=1;i<=18;i++)assert(rememberSession(storage,{id:i.toString(16).padStart(24,'0'),token:i.toString(16).padStart(64,'0'),seat:'A',name:'Mara',title:{corrupt:true},turn:{corrupt:true}}));
 const restored=readSessions(storage);assert.equal(restored.length,18);assert(restored.some(s=>s.id.endsWith('0001')));assert(restored.every(s=>!('title' in s)&&!('turn' in s)));
 const first=restored[0];assert(rememberSession(storage,{...first,name:'Mara'}));assert.equal(readSessions(storage).length,18);
});
