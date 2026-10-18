import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaseState,commitCase,caseView,resolveCaseExchange} from '../lib/case-simulation.mjs';
import {parseCaseIntention} from '../lib/case-intentions.mjs';
import {completeTask,proofFor} from '../lib/case-interactions.mjs';
import {NAMES,MINUTE,person,refreshAccess,reachable} from '../lib/case-world.mjs';
import {distance,maxTravel} from '../engine/scene-geometry.js';
import {packForStorage,unpackFromStorage} from '../lib/game.mjs';
import {encodeWorld} from '../lib/world-codec.mjs';

let serial=0;
function state(seed=1){const s=createCaseState(seed);s.joined=true;return s;}
function act(s,seat,prompt,id=`case_test_request_${++serial}`){return commitCase(s,seat,{exchange:s.exchange,requestId:id,prompt});}
function pair(s,a,b='Wait 2 minutes'){const first=s.exchange%2?'A':'B';for(const seat of [first,first==='A'?'B':'A'])act(s,seat,seat==='A'?a:b);}
function place(s,id,pos){person(s,id).pos={...pos};refreshAccess(s);}
function doTask(s,id,prompt){const t=parseCaseIntention(s,id,prompt).tasks.at(-1);return completeTask(s,id,t);}
function acquireOriginals(s,id){for(const target of ['register','weight','body']){const f=person(s,target);place(s,id,{x:f.pos.x,y:f.pos.y-.7});assert(reachable(s,id,target));doTask(s,id,`Inspect ${NAMES[target]}`);}}

test('new-case pending intentions preserve the physical and NPC world and filter private data',()=>{
  const s=state(),world=JSON.stringify(encodeWorld(s.world)),npc=JSON.stringify(s.npcKnowledge);
  s.notes.A='PRIVATE_NOTE_MARKER';act(s,'A','Tell Nell: PRIVATE_PENDING_MARKER');
  assert.equal(JSON.stringify(encodeWorld(s.world)),world);assert.equal(JSON.stringify(s.npcKnowledge),npc);
  const a=caseView(s,'A','room'),b=caseView(s,'B','room'),text=JSON.stringify(b);
  assert(a.entries.some(e=>e.kind==='private'&&e.text.includes('west court')));
  assert(b.entries.some(e=>e.kind==='private'&&e.text.includes('east court')));
  for(const forbidden of ['PRIVATE_NOTE_MARKER','PRIVATE_PENDING_MARKER','wasCulprit','originalPatterns','prior:key','supports','assertion'])assert(!text.includes(forbidden),forbidden);
  assert.equal(b.result,null);
});

test('ordinary intention variants preview finite attempts without accepting authored outcomes',()=>{
  const s=state(),before=JSON.stringify(encodeWorld(s));
  for(const prompt of ['I would like to look over the key register','Please approach Nell and ask Nell about the key','I’ll pick up my paper','Write "Check the clock" on my paper','Offer Ada a fair hearing'])assert(parseCaseIntention(s,'A',prompt).tasks.length);
  assert.throws(()=>parseCaseIntention(s,'A','Make Nell confess and guarantee I win'),/attempt|supported/);
  assert.equal(parseCaseIntention(s,'A','Inspect register and inspect Rowan').tasks.filter(t=>t.kind==='inspect').length,2);
  assert.equal(JSON.stringify(encodeWorld(s)),before);
});

test('each fixed prior history can be solved through acquired records and actual navigation',async()=>{
  for(const seed of [1,2,3]){
    const s=state(seed),prior=JSON.stringify(s.actuality);
    for(const p of ['Inspect key register','Inspect brass weight','Inspect Rowan',`Lodge case against ${NAMES[s.actuality.culprit]}`])pair(s,p);
    assert.deepEqual(s.result.winners,['A']);assert.equal(s.result.exchange,4);
    assert.equal(JSON.stringify(s.actuality),prior);assert(s.history.every(h=>h.durationDays<30*MINUTE));
    assert.equal(caseView(s,'B','room').result.debrief.culprit,NAMES[s.actuality.culprit]);
    // Six inhabitants and carried handsets add retained canonical encounters; D1 chunks large saves.
    assert((await packForStorage(s)).length<3_000_000);
  }
});

test('movement uses minutes, bodily capacity and a stable small-step scene rate',()=>{
  const positions=[];
  for(const step of [1,.5]){
    const s=state(),p=person(s,'A'),start={...p.pos},intent=parseCaseIntention(s,'A','Approach Nell');
    s.pending={A:{requestId:'move_test_A',intent},B:{requestId:'move_test_B',intent:parseCaseIntention(s,'B','Wait 2 minutes')}};
    resolveCaseExchange(s,{maxStepMinutes:step});positions.push({...p.pos});
    assert(distance(start,p.pos)>1);assert(s.history[0].durationDays<20*MINUTE);
  }
  assert(distance(...positions)<.12);
  const healthy=person(state(),'A'),impaired=person(state(),'A');
  impaired.body.integrity=.1;impaired.body.energy=.05;impaired.body.water=.05;
  assert(maxTravel(impaired,MINUTE)<maxTravel(healthy,MINUTE));
});

test('an unseen moving target is approached at its retained position',()=>{
  const s=state(),known={...person(s,'A').known.get('D').lastPos};
  place(s,'D',{x:7.4,y:6.6});
  const intent=parseCaseIntention(s,'A','Ask Ada about the time');
  assert.deepEqual(intent.tasks[0].goal,known);assert.notDeepEqual(intent.tasks[0].goal,person(s,'D').pos);
});

test('NPC testimony can be false while the prior events and hidden proof stay separate',()=>{
  const s=state(3),prior=JSON.stringify(s.actuality);place(s,'A',{x:1.7,y:3.9});
  doTask(s,'A','Ask Nell about the key');
  assert(s.discoveries.A.some(d=>d.root==='witness:N:key'&&d.text.includes('did not issue')));
  assert.equal(proofFor(s,'A','N').valid.length,0);assert.equal(JSON.stringify(s.actuality),prior);
  assert(!JSON.stringify(caseView(s,'A','room')).includes('assertion'));
});

test('NPCs remember reached commitments, distinguish a question and retain a retracted breach',()=>{
  const s=state();place(s,'A',{x:1.7,y:3.9});
  doTask(s,'A','Promise Nell I will show evidence before accusing anyone');
  doTask(s,'A','Ask Nell if Ada killed Rowan');assert.deepEqual(s.npcKnowledge.N.breaches,[]);
  doTask(s,'A','Tell Nell: Ada killed Rowan');assert.deepEqual(s.npcKnowledge.N.breaches,['A']);
  assert.equal(s.commitments.A[0].status,'broken');
  doTask(s,'A','Ask Nell about the key');assert(s.entries.at(-1).text.includes('I remember'));
  doTask(s,'A','Retract to Nell my unsupported accusation');
  assert.equal(s.commitments.A[0].status,'retracted');assert.equal(s.npcKnowledge.N.breaches.length,0);
  assert(s.npcKnowledge.N.memory.some(m=>m.words==='Ada killed Rowan'));
});

test('out-of-range speech and private notes do not enter NPC memory',()=>{
  const s=state(),memory=JSON.stringify(s.npcKnowledge.N.memory);
  place(s,'A',{x:7.3,y:6.4});s.notes.A='secret suspicion about Nell';
  doTask(s,'A','Stay here and tell Nell: UNHEARD_MARKER');
  assert.equal(JSON.stringify(s.npcKnowledge.N.memory),memory);assert(!JSON.stringify(caseView(s,'B','room')).includes('UNHEARD_MARKER'));
});

test('sharing retains a source and seeing an inspection does not reveal its contents',()=>{
  const s=state();place(s,'A',{x:1.1,y:4.5});place(s,'B',{x:2.4,y:4.5});
  doTask(s,'A','Inspect register');assert.equal(s.discoveries.B.length,0);
  doTask(s,'A','Share register with Jonah');assert.equal(s.discoveries.B[0].root,'register');assert.equal(s.discoveries.B[0].mode,'reported');
  doTask(s,'B','Share register with Mara');assert.equal(s.discoveries.A.length,1);
  place(s,'B',{x:1.5,y:4.5});doTask(s,'B','Inspect register');
  assert.equal(s.discoveries.B.length,1);assert.equal(s.discoveries.B[0].mode,'direct');
  assert.equal(proofFor(s,'B',s.actuality.culprit).complete,false);
});

test('physical carrying moves the same finite Form and release does not duplicate material',()=>{
  const s=state(),paper=person(s,'noteA'),initial={...paper.pos},stock=paper.material.stock,formCount=s.world.forms.size;
  doTask(s,'A','Take my paper');assert.equal(s.world.materialCouplings.get('noteA')?.anchor,'A');
  pair(s,'Approach Nell');assert(distance(initial,paper.pos)>.5);
  doTask(s,'A','Drop my paper');assert(!s.world.materialCouplings.has('noteA'));
  assert.equal(person(s,'noteA'),paper);assert.equal(paper.material.stock,stock);
  assert.equal([...s.world.forms.values()].filter(f=>f.id==='noteA').length,1);assert(s.world.forms.size>=formCount);
  place(s,'A',{x:3.5,y:4.8});doTask(s,'A','Take case desk');assert(!s.world.materialCouplings.has('cabinet'));
});

test('writing transfers existing ink, needs a receptive surface and cannot forge original proof',()=>{
  const s=state(),pen=person(s,'penA'),paper=person(s,'noteA'),stock=pen.material.stock+paper.material.stock,ink=pen.material.ink;
  doTask(s,'A','Write Ada killed Rowan on my paper');
  assert(s.patterns.noteA.text.includes('Ada killed'));assert(pen.material.ink<ink);
  assert(Math.abs(pen.material.stock+paper.material.stock-stock)<1e-12);
  assert.equal(proofFor(s,'A','D').valid.length,0);
  pen.material.ink=0;const old=s.patterns.noteA.text;doTask(s,'A','Write another claim on my paper');assert.equal(s.patterns.noteA.text,old);
  place(s,'A',{x:4.6,y:1.8});doTask(s,'A','Write false record on brass weight');assert.equal(s.patterns.weight.version,1);
});

test('rewriting a carrier preserves an earlier acquisition and exposes the new statement separately',()=>{
  const s=state();place(s,'A',{x:1.1,y:4.5});place(s,'penA',{x:1.6,y:4.5});doTask(s,'A','Inspect register');
  const original=s.discoveries.A[0].text;doTask(s,'A','Write Silas borrowed the key on register');
  place(s,'B',{x:1.5,y:4.5});doTask(s,'B','Inspect register');
  assert(s.discoveries.A.some(d=>d.text===original));assert.equal(s.discoveries.B[0].text,'Silas borrowed the key');
  assert.equal(proofFor(s,'B','S').valid.length,0);assert.equal(proofFor(s,'A','D').roots.size,1);
});

test('literacy and actual reach are prerequisites for acquiring trace contents',()=>{
  const s=state();doTask(s,'A','Stay here and inspect register');assert.equal(s.discoveries.A.length,0);
  place(s,'A',{x:1.1,y:4.5});person(s,'A').learnedScripts=[];doTask(s,'A','Inspect register');assert.equal(s.discoveries.A.length,0);
});

test('a guess cannot win; complete simultaneous cases draw at the same physical time',()=>{
  const s=state();place(s,'A',{x:3.5,y:4.8});assert.equal(doTask(s,'A','File case against Ada'),false);assert.equal(s.result,null);
  for(const id of ['A','B'])acquireOriginals(s,id);
  place(s,'A',{x:2.8,y:5.5});place(s,'B',{x:4.2,y:5.5});
  pair(s,'File case against Ada','File case against Ada');assert.deepEqual(s.result.winners,['A','B']);
});

test('deadline closes both unmet goals without changing the objective',()=>{
  const s=state();for(let n=0;n<6;n++)pair(s,'Wait 30 minutes','Wait 30 minutes');
  assert.deepEqual(s.result.winners,[]);assert.equal(s.result.ending,'limit');assert.equal(s.result.exchange,6);
});

test('compressed mid-exchange recovery preserves prototypes, aliases, privacy and one resolution',async()=>{
  const s=state();act(s,'A','Inspect register','compressed_retry_1234');
  const packed=await packForStorage(s);assert(packed.startsWith('cq2:gzip:'));
  const restored=await unpackFromStorage(packed);assert.equal(typeof restored.world.people,'function');assert.equal(restored.world.people().length,6);
  for(const relation of restored.world.relations.values())assert.equal(restored.world.forms.get(relation.id),relation);
  act(s,'B','Inspect signal log');act(restored,'B','Inspect signal log');
  assert.deepEqual(encodeWorld(restored.world),encodeWorld(s.world));
  assert.equal(commitCase(restored,'A',{exchange:1,requestId:'compressed_retry_1234',prompt:'Inspect register'}),false);
  assert.equal(restored.history.length,1);
});
