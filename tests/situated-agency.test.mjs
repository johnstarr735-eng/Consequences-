import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironmentWorld,environmentName} from '../lib/environment-model.mjs';
import {nightWatchDefinition} from '../lib/night-watch-profile.mjs';
import {createCaseState,commitCase,caseView} from '../lib/case-simulation.mjs';
import {parseCaseIntention} from '../lib/case-intentions.mjs';
import {completeTask,proofFor} from '../lib/case-interactions.mjs';
import {attentionRate,advanceAttention,agencyView} from '../lib/case-agency.mjs';
import {advancePhysicalInterval} from '../lib/case-processes.mjs';
import {privateInterpretationContext} from '../lib/case-plans.mjs';
import {MINUTE,person,refreshAccess} from '../lib/case-world.mjs';
import {initializeWorldTime,deriveWorldConditions,snapshotReality,integrationStep,generateProcesses,accessibilityPhase} from '../engine/controlled-moment-engine.js';
import {packForStorage,unpackFromStorage} from '../lib/game.mjs';
import {encodeWorld} from '../lib/world-codec.mjs';
import {orientPotentialByWill} from '../engine/controlled-will-dynamics.js';
import {perspectiveExport} from '../lib/client-state.mjs';

let n=0;
function state(){const s=createCaseState(1);s.joined=true;return s;}
function place(s,id,x,y){const p=person(s,id),delta={x:x-p.pos.x,y:y-p.pos.y};p.pos={x,y};for(const c of s.world.materialCouplings.values())if(c.anchor===id){const f=person(s,c.material);f.pos={x:f.pos.x+delta.x,y:f.pos.y+delta.y};}refreshAccess(s);}
function task(s,seat,prompt){const t=parseCaseIntention(s,seat,prompt).tasks.at(-1);completeTask(s,seat,t);return t;}
function pair(s,a,b='Wait 1 minute',key=`agency_${++n}`){const exchange=s.exchange;for(const seat of exchange%2?['A','B']:['B','A'])commitCase(s,seat,{exchange,requestId:`${key}_${seat}_request`,prompt:seat==='A'?a:b});}

test('different environment definitions use the same finite world without inheriting the first case or its technology',()=>{
  const first=nightWatchDefinition(),market={id:'market-model-fixture',elapsedDays:.25,space:{width:13,height:11},people:[{id:'seller',name:'Market seller',initial:{pos:{x:2,y:2},energy:.7,bodyWater:.8},learnedScripts:['local-script'],history:[{source:'prior-stall-work'}]}],materials:[{id:'board',name:'Notice board',initial:{pos:{x:4,y:2},stock:.2,fiber:.8},stores:{surfaceInkAffinity:.8}}],priorEncounters:[{observer:'seller',target:'board',source:'earlier-visit'}]};
  const a=createEnvironmentWorld(first),b=createEnvironmentWorld(market);
  assert.equal(a.people().length,6);assert.equal(b.w,13);assert.equal(b.h,11);assert.equal(b.people().length,1);
  assert.equal(environmentName(b,'board'),'Notice board');assert(!b.forms.has('phoneA'));assert(!('actuality' in b));assert(!('goal' in b.environmentDefinition));
  assert.deepEqual(b.forms.get('seller').learnedScripts,['local-script']);assert.equal(b.forms.get('seller').known.get('board').source,'earlier-visit');
  first.people[0].initial.energy=0;assert.notEqual(a.forms.get('A').body.energy,0);
  a.forms.get('A').pos.x=3;assert.equal(a.environmentDefinition.people[0].initial.pos.x,2);
  assert.throws(()=>createEnvironmentWorld({...market,people:[...market.people,...market.people]}),/duplicate/);
});

test('a profession or self-description never manufactures material capabilities',()=>{
  const s=state(),p=person(s,'A'),before=JSON.stringify(encodeWorld(s.world)),capacities={...p.capacities};
  task(s,'A','My identity: an immortal commander with unlimited authority');
  assert.equal(JSON.stringify(encodeWorld(s.world)),before);assert.deepEqual(p.capacities,capacities);assert.equal(s.result,null);
  assert(agencyView(s,'A').selfAccount.includes('immortal'));assert.equal(agencyView(s,'B').selfAccount,null);
});

test('attention and supported encounter duration change whether an inspection can acquire content',()=>{
  const s=state();place(s,'A',1.1,4.5);person(s,'A').apparatus.attention=.1;
  task(s,'A','Inspect register for 2 minutes');assert.equal(s.discoveries.A.length,0);
  task(s,'A','Inspect register for 20 minutes');assert(s.discoveries.A.some(d=>d.root==='register'));
  const other=state();place(other,'A',1.1,4.5);person(other,'A').apparatus.attention=0;
  task(other,'A','Inspect register for 20 minutes');assert.equal(other.discoveries.A.length,0);
  assert.equal(attentionRate(person(other,'A')),0);
});

test('attention accumulates in physical time and cannot count time without access or consciousness',()=>{
  const values=[];
  for(const steps of [1,4]){
    const s=state();place(s,'A',1.1,4.5);const t=parseCaseIntention(s,'A','Inspect register').tasks.at(-1);
    for(let i=0;i<steps;i++)advanceAttention(s,'A',t,2*MINUTE/steps);values.push(t.attentionWork);completeTask(s,'A',t);assert(s.discoveries.A.some(d=>d.root==='register'));
  }
  assert(Math.abs(values[0]-values[1])<1e-12);
  const s=state(),t=parseCaseIntention(s,'A','Stay here and inspect register').tasks.at(-1);advanceAttention(s,'A',t,2*MINUTE);assert.equal(t.attentionWork,0);
  place(s,'A',1.1,4.5);person(s,'A').sceneBody={conscious:false,reserve:0};advanceAttention(s,'A',t,2*MINUTE);assert.equal(t.attentionWork,0);
});

test('watching directs an observation without supplying another person’s thoughts or distant writing',()=>{
  const s=state();place(s,'A',1.1,3);
  task(s,'A','Focus on register for 2 minutes');assert(!s.discoveries.A.some(d=>d.root==='register'));
  task(s,'A','Watch Nell for 1 minute');assert.equal(agencyView(s,'A').lastAttention.name,'Nell');
  assert(s.discoveries.A.some(d=>d.category==='observation'));assert.equal(proofFor(s,'A',s.actuality.culprit).roots.size,0);
});

test('purpose is privately chosen and saved, keeps the original objective, and anchors only encountered references',()=>{
  const s=state(),goal=caseView(s,'A','room').scenario.goal,world=JSON.stringify(encodeWorld(s.world));
  commitCase(s,'A',{exchange:1,requestId:'private_purpose_pending_A',prompt:'Purpose: PRIVATE_PURPOSE_MARKER protect Nell and seek the hidden emperor'});
  assert(!JSON.stringify(caseView(s,'B','room')).includes('PRIVATE_PURPOSE_MARKER'));assert.equal(JSON.stringify(encodeWorld(s.world)),world);
  commitCase(s,'B',{exchange:1,requestId:'private_purpose_pending_B',prompt:'Wait 1 minute'});
  assert.equal(caseView(s,'A','room').scenario.goal,goal);assert.deepEqual(agencyView(s,'A').purpose.anchors.map(x=>x.id),['N']);
  assert(!JSON.stringify(caseView(s,'B','room')).includes('PRIVATE_PURPOSE_MARKER'));assert(!JSON.stringify(s.npcKnowledge).includes('PRIVATE_PURPOSE_MARKER'));
});

test('an introduction is a reached claim, and neither a credential nor proof that erases encountered conduct',()=>{
  const s=state();place(s,'A',3,2);place(s,'N',3.7,2);for(const [id,x,y] of [['B',7.5,6.5],['D',7,5.7],['S',7,1],['P',7,6]])place(s,id,x,y);
  const before=person(s,'A').material.force;
  advancePhysicalInterval(s,{A:parseCaseIntention(s,'A','Strangle Nell').tasks.at(-1)},MINUTE);
  advancePhysicalInterval(s,{},MINUTE);
  task(s,'A','Introduce myself to Nell as a senior magistrate');
  assert(s.npcKnowledge.N.identityClaims.some(c=>c.words.includes('magistrate')&&c.status==='heard'));
  assert(s.entries.some(e=>e.text.includes('You hurt me')));assert.equal(person(s,'A').material.force,before);
  assert.equal(s.npcKnowledge.N.seenRoots.length,0);assert.equal(proofFor(s,'A',s.actuality.culprit).complete,false);
  const far=state();task(far,'A','Stay here and introduce myself to Ada as a magistrate');assert(!far.npcKnowledge.D.identityClaims?.length);
});

test('a private self-account is separate from delivered introductions, and the interpreter/export see only this player',()=>{
  const s=state();task(s,'A','My identity: PRIVATE_SELF_MARKER a careful investigator');task(s,'B','My identity: OTHER_SELF_MARKER a reporter');
  const context=privateInterpretationContext(caseView(s,'A','room'));assert(JSON.stringify(context).includes('PRIVATE_SELF_MARKER'));assert(!JSON.stringify(context).includes('OTHER_SELF_MARKER'));
  const view=caseView(s,'A','room');view.agency.hiddenWorld={actuality:'HIDDEN_STATE_MARKER'};
  const exported=JSON.stringify(perspectiveExport(view));assert(exported.includes('PRIVATE_SELF_MARKER'));assert(!exported.includes('HIDDEN_STATE_MARKER'));assert(!exported.includes('OTHER_SELF_MARKER'));
});

test('reflections, prior profiles, attention history and later consequences survive save/resume',async()=>{
  const s=state();pair(s,'Purpose: Hear Nell before accusing anyone');pair(s,'My identity: a careful investigator');
  const r=await unpackFromStorage(await packForStorage(s));
  for(const w of [s,r])pair(w,'Focus on Nell for 2 minutes','Wait 2 minutes','identical_resume');
  assert.deepEqual(encodeWorld(r),encodeWorld(s));assert.equal(r.world.environmentDefinition.id,'port-serein-2026');
});

function willWorld(attention=.8){
  const w=createEnvironmentWorld({id:'will-capacity-fixture',elapsedDays:.5,space:{width:10,height:10},people:[{id:'actor',name:'Actor',initial:{pos:{x:1,y:1},energy:.95,bodyWater:.95,attention,receptor:.85,retention:.8},condition:{sceneMotionScale:1,clothing:.7,sleepDebt:.1}}],materials:[{id:'target',name:'Retained material',initial:{pos:{x:7,y:6},stock:.1}}],priorEncounters:[{observer:'actor',target:'target',source:'prior-encounter'}]});
  initializeWorldTime(w,{dtDays:MINUTE});deriveWorldConditions(w);accessibilityPhase(w,snapshotReality(w));return w;
}
test('represented orientation reaches canonical Will only after its unchanged finite eligibility gates',()=>{
  const counts=[];
  for(const attention of [.8,.01]){
    const w=willWorld(attention),p=w.forms.get('actor'),force=p.material.force;
    for(let i=0;i<120;i++){
      w._playerOrientations=new Map([['actor',{goal:{x:7,y:6},stopDistance:.7,representedTarget:'target',intendedDistance:.7}]]);
      integrationStep(w,{dtDays:MINUTE});
      if(i<114)assert(!p.willHistory.some(e=>e.type==='will_projection_open'));
    }
    counts.push(p.willHistory.filter(e=>e.type==='will_projection_open').length);
    assert.equal(p.material.force,force);assert(p.body.energy<.95);assert.equal(p.willProjection?.projectedConfiguration.actual||false,false);
    if(attention===.8){assert.equal(p.willProjection.projectedConfiguration.distanceMax,.7);assert.equal(p.willProjection.target,'target');const motion=generateProcesses(w,snapshotReality(w)).find(x=>x.type==='motion'&&x.form==='actor');assert(motion.willOverride);assert.notDeepEqual(motion.to,motion.rawTop.to);}
  }
  assert(counts[0]>0);assert.equal(counts[1],0);
});

test('a represented target uses retained position when access closes and cannot create a new material form',()=>{
  const w=willWorld(),p=w.forms.get('actor'),known={...p.known.get('target').lastPos};
  w.forms.get('target').pos={x:8,y:1};w._accessState.set('actor|target',{active:false});
  w._playerOrientations=new Map([['actor',{goal:known,stopDistance:.7,representedTarget:'target',intendedDistance:.7}]]);
  const count=w.forms.size,motion=generateProcesses(w,snapshotReality(w)).find(x=>x.type==='motion'&&x.form==='actor');
  const driver=motion.drivers.find(d=>d.kind==='represented_configuration');assert.deepEqual(driver.representedPos,known);assert.notDeepEqual(driver.representedPos,w.forms.get('target').pos);
  assert.equal(w.forms.size,count);
});

test('incapacity pauses reflective support without erasing the retained representation',()=>{
  const w=willWorld(),p=w.forms.get('actor');w._playerOrientations=new Map([['actor',{goal:{x:7,y:6},representedTarget:'target',intendedDistance:.7}]]);
  for(let i=0;i<120;i++)integrationStep(w,{dtDays:MINUTE});
  const representation=JSON.stringify(p.willProjection),candidate=JSON.stringify(w._willCandidateState.get('actor'));
  p.sceneBody={conscious:false,reserve:0};const s=snapshotReality(w),es=s.forms.get('actor');
  const result=orientPotentialByWill(w,p,es,s,[{kind:'represented_configuration',target:'target',weight:.2}],[{to:{x:1,y:1},score:.2},{to:{x:1.1,y:1.1},score:.2}],{dtDays:.1});
  assert.equal(result.projection,null);assert.equal(JSON.stringify(p.willProjection),representation);assert.equal(JSON.stringify(w._willCandidateState.get('actor')),candidate);
});
