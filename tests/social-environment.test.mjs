import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaseState,commitCase,caseView,resolveCaseExchange} from '../lib/case-simulation.mjs';
import {parseCaseIntention} from '../lib/case-intentions.mjs';
import {completeTask,proofFor} from '../lib/case-interactions.mjs';
import {advanceEnvironment,environmentView,policeMovement,usableHandset} from '../lib/case-environment.mjs';
import {advancePhysicalInterval} from '../lib/case-processes.mjs';
import {MINUTE,person,refreshAccess} from '../lib/case-world.mjs';
import {distance} from '../engine/scene-geometry.js';
import {packForStorage,unpackFromStorage} from '../lib/game.mjs';
import {encodeWorld} from '../lib/world-codec.mjs';

let serial=0;
function state(seed=3){const s=createCaseState(seed);s.joined=true;return s;}
function task(s,id,prompt){return completeTask(s,id,parseCaseIntention(s,id,prompt).tasks.at(-1));}
function deliver(s,minutes=.5){s.world.elapsedDays+=minutes*MINUTE;advanceEnvironment(s,minutes*MINUTE);}
function place(s,id,x,y){const p=person(s,id),dx=x-p.pos.x,dy=y-p.pos.y;p.pos={x,y};for(const c of s.world.materialCouplings.values())if(c.anchor===id){const phone=person(s,c.material);phone.pos={x:phone.pos.x+dx,y:phone.pos.y+dy};}refreshAccess(s);}
function pair(s,a,b='Wait 2 minutes'){const exchange=s.exchange;for(const id of exchange%2?['A','B']:['B','A'])commitCase(s,id,{exchange,requestId:`social_test_request_${++serial}`,prompt:id==='A'?a:b});}

test('a new case retains an explicit setting and a finite police response without changing the prior culprit',()=>{
  for(const seed of [1,2,3]){
    const s=state(seed);assert.equal(s.environment.date,'2026-10-17');assert.equal(s.world.people().length,6);
    assert.equal(s.actuality.culprit,['D','S','N'][seed-1]);assert.deepEqual(s.environment.institutions[0].members,['P']);
    assert.equal(s.npcKnowledge.P.memory.length,1);assert(!/killer|killed|murdered/.test(s.npcKnowledge.P.memory[0].words));
    assert.equal(s.environment.police.assignment.target,'body');assert.equal(s.world.materialCouplings.get('phoneA').anchor,'A');
    const view=caseView(s,'A','room');assert(view.environment.role.limits.some(x=>x.includes('detain')));
    assert(!JSON.stringify(view.environment).includes('wasCulprit'));
  }
});

test('reviewing and queuing a call neither transmits words nor consumes battery before both contributions',()=>{
  const s=state(),before=JSON.stringify(encodeWorld(s.environment)),world=JSON.stringify(encodeWorld(s.world));
  parseCaseIntention(s,'A','Call police: Nell is hurt');
  commitCase(s,'A',{exchange:1,requestId:'social_pending_call_123',prompt:'Call police: Nell is hurt'});
  assert.equal(JSON.stringify(encodeWorld(s.environment)),before);assert.equal(JSON.stringify(encodeWorld(s.world)),world);
  assert(!JSON.stringify(caseView(s,'B','room')).includes('Nell is hurt'));
});

test('SMS reaches a distant handset without nearby listeners learning the words or material surplus',()=>{
  const s=state();place(s,'B',7.5,6.5);
  const stock=[...s.world.forms.values()].reduce((sum,f)=>sum+f.material.stock,0);
  task(s,'A','Text Jonah: PRIVATE_TEXT_MARKER');assert.equal(s.discoveries.B.length,0);deliver(s);
  assert(s.discoveries.B.some(d=>d.text==='PRIVATE_TEXT_MARKER'&&d.mode==='reported'));
  for(const id of ['N','D','S','P'])assert(!s.npcKnowledge[id].memory.some(m=>m.words==='PRIVATE_TEXT_MARKER'));
  assert.equal([...s.world.forms.values()].reduce((sum,f)=>sum+f.material.stock,0),stock);
  assert(!proofFor(s,'B',s.actuality.culprit).complete);
});

test('outgoing voice can be overheard; typing a private text does not broadcast its content',()=>{
  for(const channel of ['Call','Text']){
    const s=state();place(s,'B',2.9,3);
    task(s,'A',`${channel} police: LOCAL_WORDS_MARKER`);
    assert.equal(caseView(s,'B','room').entries.some(e=>e.text==='LOCAL_WORDS_MARKER'),channel==='Call');
    deliver(s);assert(s.npcKnowledge.P.memory.some(m=>m.words==='LOCAL_WORDS_MARKER'));
  }
});

test('a title cannot replace a battery, handset control, learned procedure or retained contact',()=>{
  for(const condition of ['battery','control','procedure','contact']){
    const s=state();
    if(condition==='battery')s.environment.devices.phoneA.battery=0;
    if(condition==='control')s.world.materialCouplings.delete('phoneA');
    if(condition==='procedure')person(s,'A').learnedProcedures=[];
    if(condition==='contact')delete s.environment.devices.phoneA.contacts.P;
    task(s,'A','Call police: Please check Nell');deliver(s);
    assert.equal(s.environment.messages.length,0,condition);assert.equal(s.npcKnowledge.P.memory.length,1,condition);
  }
});

test('mobile voice, SMS, mobile internet and the local WiFi uplink have distinct support',()=>{
  const s=state(),i=s.environment.infrastructure;
  i.internetUplink=false;s.environment.routerPowered=false;
  assert.equal(environmentView(s,'A').channels.voice,true);assert.equal(environmentView(s,'A').channels.sms,true);assert.equal(environmentView(s,'A').channels.internet,true);
  task(s,'A','Message Jonah: MOBILE_INTERNET');deliver(s);assert(s.discoveries.B.some(d=>d.text==='MOBILE_INTERNET'));
  i.cellularData=false;assert.equal(environmentView(s,'A').channels.internet,false);
  place(s,'A',6.5,1.4);place(s,'B',6.5,2.5);i.internetUplink=true;s.environment.routerPowered=true;
  assert.equal(environmentView(s,'A').channels.wifi,true);assert.equal(environmentView(s,'A').channels.internet,true);
  task(s,'A','Message Jonah: WIFI_ONLY');deliver(s);assert(s.discoveries.B.some(d=>d.text==='WIFI_ONLY'));
  s.environment.routerPowered=false;task(s,'A','Message Jonah: NO_UPLINK_ROUTE');assert.equal(s.environment.messages.length,2);
  task(s,'A','Text Jonah: SMS_SURVIVES');deliver(s);assert(s.discoveries.B.some(d=>d.text==='SMS_SURVIVES'));
});

test('a switched-off or damaged receiving handset prevents delivery without inventing recipient knowledge',()=>{
  for(const reason of ['off','damaged']){
    const s=state();if(reason==='off')s.environment.devices.phoneB.powered=false;else person(s,'phoneB').material.integrity=.2;
    task(s,'A','Text Jonah: UNDELIVERED_WORDS');deliver(s);
    assert.equal(s.environment.messages[0].status,'failed');assert.equal(s.discoveries.B.length,0);assert(!JSON.stringify(environmentView(s,'B')).includes('UNDELIVERED_WORDS'));
  }
});

test('device delivery during incapacity is separate from reading and later retained knowledge',()=>{
  const s=state();person(s,'B').sceneBody={conscious:false,reserve:.1};
  task(s,'A','Text Jonah: LATER_READING');deliver(s);
  const m=s.environment.messages[0];assert.equal(m.status,'delivered');assert.equal(m.readAt,null);assert.equal(s.discoveries.B.length,0);
  assert.equal(caseView(s,'B','room').environment.channels,null);assert(!JSON.stringify(caseView(s,'B','room')).includes('LATER_READING'));
  person(s,'B').sceneBody.conscious=true;advanceEnvironment(s);
  assert(m.readAt);assert(s.discoveries.B.some(d=>d.text==='LATER_READING'));assert.equal(environmentView(s,'A').messages[0].status,'Reached handset');
});

test('reading a delivered text requires perception and a learned script, while a shared trace keeps its origin',()=>{
  for(const missing of ['perception','script']){
    const s=state();place(s,'A',1.1,4.5);task(s,'A','Inspect register');
    if(missing==='perception')person(s,'B').apparatus.receptor=0;else person(s,'B').learnedScripts=[];
    task(s,'A','Text register to Jonah');deliver(s);
    assert.equal(s.environment.messages[0].status,'delivered');assert.equal(s.discoveries.B.length,0);
    person(s,'B').apparatus.receptor=.85;person(s,'B').learnedScripts=['archive-en'];advanceEnvironment(s);
    const record=s.discoveries.B[0];assert.equal(record.root,'register');assert.equal(record.mode,'reported');assert.equal(record.source,'A');
    assert.equal(proofFor(s,'B',s.actuality.culprit).roots.size,1);assert.equal(proofFor(s,'B',s.actuality.culprit).direct,0);
  }
});

test('turning off the sending phone ends a pending voice route but does not recall an already sent text',()=>{
  for(const kind of ['Call','Text']){
    const s=state();task(s,'A',`${kind} Jonah: WORDS_IN_TRANSIT`);task(s,'A','Switch off my phone');deliver(s);
    assert.equal(s.discoveries.B.some(d=>d.text==='WORDS_IN_TRANSIT'),kind==='Text');
    assert.equal(usableHandset(s,'A'),undefined);
  }
});

test('a report changes the officer’s finite route, while an unavailable route leaves the report unknown',()=>{
  const states=[];
  for(const connected of [true,false]){
    const s=state();s.environment.infrastructure.cellularSMS=connected;
    const prior=JSON.stringify(s.actuality),body=person(s,'N').body.integrity,start={...person(s,'P').pos};
    task(s,'A','Text police: Please check Nell, I think she is hurt');deliver(s);
    assert.equal(policeMovement(s).target,connected?'N':'body');
    pair(s,'Wait 5 minutes','Wait 5 minutes');
    assert(distance(start,person(s,'P').pos)>0);assert.equal(JSON.stringify(s.actuality),prior);assert.equal(person(s,'N').body.integrity,body);
    assert.equal(s.npcKnowledge.P.memory.some(m=>m.words.includes('I think she is hurt')),connected);states.push(s);
  }
  assert(distance(person(states[0],'P').pos,person(states[1],'P').pos)>.1);
});

test('the institution label does not replace an unavailable officer or grant remote bodily force',()=>{
  const s=state();person(s,'P').sceneBody={conscious:false,reserve:.1};
  task(s,'A','Call police: Nell is being attacked');deliver(s);
  assert.equal(s.npcKnowledge.P.memory.length,1);assert.equal(s.environment.messages[0].status,'missed');assert.equal(s.world.people().length,6);
  const far=state(),near=state();
  for(const w of [far,near]){place(w,'A',3,2);place(w,'N',3.7,2);place(w,'B',7.5,6.5);place(w,'D',7,5.7);place(w,'S',7,1);}
  place(far,'P',7.5,6);place(near,'P',3.1,2.75);
  for(const w of [far,near])advancePhysicalInterval(w,{A:parseCaseIntention(w,'A','Strangle Nell').tasks.at(-1)},MINUTE);
  assert(person(near,'N').sceneBody.reserve>person(far,'N').sceneBody.reserve);
  assert(!(far.encounters.P||[]).some(e=>e.harmful&&e.mode==='direct'));assert(near.encounters.P.some(e=>e.harmful&&e.mode==='direct'));
});

test('messages in transit and received reports survive save/resume with the same later consequence',async()=>{
  const s=state();task(s,'A','Text police: Please check Nell');task(s,'A','Text Jonah: PENDING_PRIVATE');
  const restored=await unpackFromStorage(await packForStorage(s));
  assert(!JSON.stringify(caseView(restored,'B','room')).includes('PENDING_PRIVATE'));
  for(const w of [s,restored]){deliver(w);for(const id of ['A','B'])commitCase(w,id,{exchange:1,requestId:`resume_social_${id}_123`,prompt:'Wait 2 minutes'});}
  assert.deepEqual(encodeWorld(restored),encodeWorld(s));assert.equal(restored.environment.police.assignment.target,'N');
});

test('delivery time and device idle costs follow physical time rather than solver frame count',()=>{
  const results=[];
  for(const maxStepMinutes of [1,.5]){
    const s=state();s.pending={A:{intent:parseCaseIntention(s,'A','Text Jonah: TIMED_WORDS')},B:{intent:parseCaseIntention(s,'B','Wait 2 minutes')}};
    resolveCaseExchange(s,{maxStepMinutes});results.push(s);
  }
  assert(Math.abs(results[0].environment.messages[0].readAt-results[1].environment.messages[0].readAt)<1e-10);
  assert(Math.abs(results[0].environment.devices.phoneA.battery-results[1].environment.devices.phoneA.battery)<1e-10);
});
