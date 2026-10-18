import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaseState,commitCase,caseView} from '../lib/case-simulation.mjs';
import {parseCaseIntention} from '../lib/case-intentions.mjs';
import {recordEncounter,reportEncounters} from '../lib/case-processes.mjs';
import {completeTask} from '../lib/case-interactions.mjs';
import {person,refreshAccess} from '../lib/case-world.mjs';
import {compilePlan,privateInterpretationContext} from '../lib/case-plans.mjs';
import {createIntentInterpreter} from '../lib/intent-model.mjs';
import {encodeWorld} from '../lib/world-codec.mjs';
let n=0;const state=()=>{const s=createCaseState(1);s.joined=true;return s;};
function place(s,id,x,y){person(s,id).pos={x,y};refreshAccess(s);}
function pair(s,a,b='Wait 1 minute'){const first=s.exchange%2?'A':'B';for(const seat of [first,first==='A'?'B':'A'])commitCase(s,seat,{exchange:s.exchange,requestId:`open_play_request_${++n}`,prompt:seat==='A'?a:b});}
function isolated(){const s=state();place(s,'A',1,1);place(s,'N',1.75,1);place(s,'B',7.5,6.5);place(s,'D',6.5,5.9);place(s,'S',5.9,6.5);return s;}

test('fictional violence is a reviewable physical attempt rather than an authored outcome',()=>{
 const s=state(),before=JSON.stringify(encodeWorld(s.world));
 for(const prompt of ['Strangle Nell','I try to choke Ada','Attack Silas','Hit Jonah with my pen','Kill Nell','Protect Nell','Flee from Ada','Tear up key register'])assert(parseCaseIntention(s,'A',prompt).tasks.length);
 assert.equal(JSON.stringify(encodeWorld(s.world)),before);
 assert.equal(parseCaseIntention(s,'A','Strangle Nell').tasks.at(-1).effect,'compress');
});

test('queuing harmful intent causes neither injury nor witness knowledge',()=>{
 const s=isolated(),before=JSON.stringify(encodeWorld(s.world));
 commitCase(s,'A',{exchange:1,requestId:'violent_pending_1234',prompt:'Strangle Nell'});
 assert.equal(JSON.stringify(encodeWorld(s.world)),before);assert(!s.encounters);assert(!JSON.stringify(caseView(s,'B','room')).includes('Strangle Nell'));
});

test('survival and later delivered testimony do not notify an absent player immediately',()=>{
 const s=isolated();pair(s,'Strangle Nell');
 assert(person(s,'N').alive);assert(s.encounters.N.some(e=>e.actor==='A'&&e.mode==='direct'));
 assert(!s.encounters.B?.some(e=>e.actor==='A'));assert(!caseView(s,'B','room').discoveries.some(d=>d.category==='incident'));
 // A later physical meeting opens a real delivery path.
 place(s,'B',person(s,'N').pos.x+1,person(s,'N').pos.y);person(s,'N').sceneBody.voiceBlocked=false;reportEncounters(s);
 const report=caseView(s,'B','room').discoveries.find(d=>d.category==='incident');assert(report);assert.equal(report.mode,'reported');
 assert(report.text.includes('I was the person'));assert(!report.text.includes('Rowan'));
});

test('a nearby witness can remember and materially oppose the contact',()=>{
 const alone=isolated(),seen=isolated();place(seen,'D',1.1,1.75);
 pair(alone,'Strangle Nell');pair(seen,'Strangle Nell');
 assert(seen.encounters.D.some(e=>e.harmful&&e.actor==='A'));
 assert(person(seen,'N').sceneBody.reserve>=person(alone,'N').sceneBody.reserve);
 assert(seen.incidents.some(e=>e.process==='interruption'));
});

test('a resisting human changes the bodily result without revealing their pending intention',()=>{
 const results=[];
 for(const defense of ['Wait 1 minute','Defend myself']){const s=state();place(s,'A',1,1);place(s,'B',1.75,1);place(s,'N',7,6);place(s,'D',6,6);place(s,'S',5,6);pair(s,'Strangle Jonah',defense);results.push(person(s,'B').sceneBody.reserve);}
 assert(results[1]>results[0]);
});

test('incapacity and mortality depend on bodily state and sustained contact, not the verb kill',()=>{
 const s=isolated(),v=person(s,'N');v.body.energy=.6;v.body.water=.6;v.capacities.forceTransmission=.03;
 pair(s,'Strangle Nell for 5 minutes','Wait 5 minutes');
 assert.equal(v.alive,false);assert(v.body.energy>.1);assert(v.body.water>.1);assert(v.body.integrity<.015);assert(v._matterReturned);assert.equal(v.sceneBody.conscious,false);const delivered=s.signals.filter(e=>e.producer==='N').length;reportEncounters(s);assert.equal(s.signals.filter(e=>e.producer==='N').length,delivered);
 const fresh=isolated();pair(fresh,'Kill Nell','Wait 3 minutes');assert.equal(fresh.actuality.culprit,'D');
 // The original killing is never reassigned to fit a new event.
 assert(!JSON.stringify(fresh.actuality).includes('Mara'));
});

test('erasing or tearing a material trace does not delete an earlier acquisition',()=>{
 const s=state();place(s,'A',1.1,4.5);completeTask(s,'A',parseCaseIntention(s,'A','Inspect register').tasks.at(-1));
 const original=s.discoveries.A[0].text;pair(s,'Tear up register');assert(person(s,'register').material.patternDestroyed);
 place(s,'B',1.5,4.5);completeTask(s,'B',parseCaseIntention(s,'B','Inspect register').tasks.at(-1));
 assert(!s.discoveries.B.some(d=>d.root==='register'));assert(s.discoveries.A.some(d=>d.text===original));
});

test('interpretation context and generated plans cannot smuggle hidden facts or arbitrary state edits',()=>{
 const s=state();s.notes.B='OTHER_PRIVATE';const context=privateInterpretationContext(caseView(s,'A','room'));
 for(const word of ['OTHER_PRIVATE','actuality','wasCulprit','supports'])assert(!JSON.stringify(context).includes(word));
 const step={op:'compress',target:'N',instrument:null,content:'',minutes:1};
 assert.equal(compilePlan(s,'A','I seize Nell',{clarification:'',steps:[step]}).tasks.at(-1).kind,'contact');
 assert.throws(()=>compilePlan(s,'A','win',{clarification:'',steps:[{...step,health:0}]}),/unsupported/);
 assert.throws(()=>compilePlan(s,'A','conjure',{clarification:'',steps:[{...step,target:'nonexistent person'}]}),/encountered/);
});

test('optional language transport uses a bounded schema and never treats a refusal or failure as an action',async()=>{
 assert.equal(createIntentInterpreter(),null);
 let request;const interpreted=createIntentInterpreter({apiKey:'test-only',fetcher:async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');request=JSON.parse(options.body);return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({clarification:'Which person?',steps:[]})}]}]});}});
 assert.equal((await interpreted({prompt:'grab them',perspective:{name:'Mara'}})).clarification,'Which person?');assert.equal(request.store,false);assert(request.text.format.strict);assert(!request.tools);
 const refused=createIntentInterpreter({apiKey:'test-only',fetcher:async()=>Response.json({output:[{content:[{type:'refusal'}]}]})});await assert.rejects(()=>refused({prompt:'x',perspective:{}}),/could not translate/);
});

test('unreached help does not give a distant intended recipient knowledge of the attempt',()=>{
 const s=isolated();place(s,'N',7,6);const t=parseCaseIntention(s,'A','Stay here and help Nell').tasks.at(-1);
 completeTask(s,'A',t);assert(!s.encounters.N?.some(e=>e.process==='aid'));assert(s.encounters.A.some(e=>e.process==='aid'));
});
