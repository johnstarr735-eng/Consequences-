import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,commitIntention,playerView,packForStorage,unpackFromStorage,expectedSeat} from '../lib/game.mjs';
import {configureCharacter,confirmSetup,configurePractice} from '../lib/game-setup.mjs';
import {validateCharacter,handlingCoordination} from '../lib/character-model.mjs';
import {ENVIRONMENTS,DIFFICULTIES,defaultRecipe,validateRecipe} from '../lib/scenario-catalog.mjs';
import {createScenarioGenerator,createDialogueGenerator} from '../lib/scenario-model.mjs';
import {person,refreshAccess} from '../lib/case-world.mjs';
import {LocalPractice} from '../lib/local-practice.mjs';

const choice=(profileId='port-serein',difficulty='medium')=>({profileId,difficulty,character:{preset:'investigator',name:'Elena'}});
function ready(profileId='port-serein',difficulty='medium'){
  const s=createState({seed:3,setup:choice(profileId,difficulty)});s.joined=true;configureCharacter(s,'B',{preset:'veteran',name:'Tomas'});confirmSetup(s,'A');confirmSetup(s,'B');return s;
}
const act=(s,id,prompt)=>commitIntention(s,id,{exchange:s.exchange,requestId:crypto.randomUUID(),prompt});
test('each environment is a playable finite world with declared communication conditions',()=>{
  for(const e of ENVIRONMENTS){const s=ready(e.id),v=playerView(s,'A','room');assert.equal(v.setup.family,e.family);assert.equal(v.setup.phase,'play');assert.equal(v.environment.date,e.date);assert.equal(v.environment.handsets.length,e.electronic?1:0);assert(s.world.forms.has('register'));assert.equal(s.world.forms.has('phoneA'),e.electronic);assert.equal(s.environment.infrastructure.cellularVoice,e.electronic);}
});
test('both players must confirm before any time can pass and character selection then locks',()=>{
  const s=createState({setup:choice()});s.joined=true;configureCharacter(s,'B',{preset:'caregiver',name:'Tomas'});const at=s.world.elapsedDays;
  assert.throws(()=>act(s,'A','Wait 1 minute'),/confirm/);confirmSetup(s,'A');assert(!playerView(s,'A','room').canSubmit);assert.equal(s.world.elapsedDays,at);
  confirmSetup(s,'B');assert(playerView(s,'A','room').canSubmit);assert.throws(()=>configureCharacter(s,'A',{preset:'veteran',name:'Elena'}),/fixed/);
});
test('custom characters accept supported histories and reject arbitrary powers, extra fields and omniscience',()=>{
  const valid={preset:'custom',name:'Elena',role:'resident',background:'grappling',physique:'light'};assert.equal(validateCharacter(valid).background,'grappling');
  for(const bad of [{...valid,force:999},{...valid,background:'knows-everything'},{...valid,physique:'giant'},{...valid,name:'<script>'}])assert.throws(()=>validateCharacter(bad));
  assert.throws(()=>createState({setup:{...choice(),difficulty:'impossible'}}));
});
test('changing a job title alone supplies no force, knowledge or extra equipment',()=>{
  const s=createState({setup:choice()}),before={force:person(s,'A').material.force,known:[...person(s,'A').known.keys()],forms:s.world.forms.size};
  configureCharacter(s,'A',{preset:'custom',name:'Elena',role:'officer',background:'local',physique:'balanced'});
  assert.equal(person(s,'A').material.force,before.force);assert.deepEqual([...person(s,'A').known.keys()],before.known);assert.equal(s.world.forms.size,before.forms);assert.deepEqual(person(s,'A').retainedHandling,[]);
});
test('relevant retained practice changes handling only for its specific process',()=>{
  const s=createState({setup:choice()}),p=person(s,'A'),force=p.material.force,encounter={counterpart:person(s,'B'),direct:true,timeProfile:'sustained',instrument:null},ordinary=handlingCoordination(p,encounter);
  configureCharacter(s,'A',{preset:'wrestler',name:'Elena'});assert(handlingCoordination(p,encounter)>ordinary);assert.equal(handlingCoordination(p,{...encounter,timeProfile:'impulse'}),ordinary);assert.equal(p.material.force,force);
  configureCharacter(s,'A',{preset:'custom',name:'Elena',role:'resident',background:'former-service',physique:'balanced'});assert.equal(handlingCoordination(p,encounter),ordinary);
});
test('physical builds have bounded material differences and repeated editing cannot stack them',()=>{
  const s=createState({setup:choice()}),base=person(s,'A').material.force,c={preset:'custom',name:'Elena',role:'resident',background:'local',physique:'solid'};
  configureCharacter(s,'A',c);const force=person(s,'A').material.force;assert(force>base);configureCharacter(s,'A',c);assert.equal(person(s,'A').material.force,force);assert(person(s,'A').material.mobility<person(s,'A').creationBody.mobility);
});
test('custom names are usable targets and survive storage without changing another player’s private history',async()=>{
  let s=ready();person(s,'A').pos={x:2.3,y:3};person(s,'B').pos={x:3,y:3};refreshAccess(s);act(s,'A','Tell Tomas: Check the record.');assert.equal(s.turn.reaction.seat,'B');act(s,'B','Tell Elena: I heard you.');
  s.notes.A='a private hypothesis';s=await unpackFromStorage(await packForStorage(s));const a=playerView(s,'A','room'),b=playerView(s,'B','room');assert.equal(a.name,'Elena');assert.equal(b.name,'Tomas');assert(!JSON.stringify(b).includes('a private hypothesis'));assert(b.entries.some(e=>e.speaker==='Elena'));assert(!JSON.stringify(b).includes('culpritIndex'));assert(!JSON.stringify(b).includes('wasCulprit'));
});
test('non-electronic worlds cannot transmit through absent phones or acquire modern recording evidence',()=>{
  for(const profile of ['roman-court','lantern-keep']){const s=ready(profile);act(s,'A','Call police: Please check on Nell');assert.equal(s.environment.messages.length,0);assert(s.entries.some(e=>e.text.includes('charged, working handset')));assert(!s.patterns.clock.text.includes('automatic'));assert(!s.patterns.body.text.includes('watch is stopped'));assert(!s.patterns.clock.text.includes('20:17'));}
});
test('difficulty changes the deadline and starting guidance while leaving evidence and bodies comparable',()=>{
  const states=DIFFICULTIES.map(d=>createState({seed:3,setup:choice('port-serein',d.id)}));assert.deepEqual(states.map(s=>s.setup.deadlineMinutes),[240,180,120]);assert.deepEqual(states[0].originalPatterns,states[2].originalPatterns);assert.deepEqual(person(states[0],'A').body,person(states[2],'A').body);assert(states[2].entries.some(e=>e.kind==='private'&&!e.text.includes('starting lead')));
});
test('validated generated recipes affect prior facts and leads but cannot add an engine capability',()=>{
  const recipe=defaultRecipe('port-serein',3);recipe.culpritIndex=2;const s=createState({setup:choice(),recipe});assert.equal(s.actuality.culprit,'S');assert.equal(s.originalPatterns.register.supports,'S');assert.throws(()=>validateRecipe({...recipe,force:999},'port-serein'));assert.throws(()=>validateRecipe({...recipe,profileId:'roman-court'},'port-serein'));
});
test('AI scenario transport is optional, schema-bound and checks its output before accepting it',async()=>{
  assert.equal(createScenarioGenerator(),null);let sent;
  const generate=createScenarioGenerator({apiKey:'test-only',fetcher:async(url,options)=>{sent=JSON.parse(options.body);return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(defaultRecipe('roman-court',5))}]}]});}});
  const result=await generate({profileId:'roman-court',difficulty:'medium',seed:5});assert.equal(result.profileId,'roman-court');assert.equal(sent.store,false);assert.equal(sent.text.format.strict,true);assert(!JSON.stringify(sent.input).includes('private notes'));
  const invalid=createScenarioGenerator({apiKey:'test-only',fetcher:async()=>Response.json({output:[{content:[{type:'output_text',text:'{"version":1,"force":999}'}]}]})});await assert.rejects(()=>invalid({profileId:'roman-court',difficulty:'medium',seed:5}));
});
test('optional dialogue fails cleanly and remains words rather than a world mutation',async()=>{
  assert.equal(createDialogueGenerator(),null);const speak=createDialogueGenerator({apiKey:'test-only',fetcher:async()=>Response.json({output:[{content:[{type:'output_text',text:'{"words":"I have only seen the open records."}'}]}]})});assert.equal(await speak({prompt:'What do you know?',perspective:{}}),'I have only seen the open records.');
});
test('new on-device setup, confirmation and multi-prompt turns survive a service restart',async()=>{
  const rows=new Map(),store={get:async id=>rows.get(id),put:async row=>{rows.set(row.id,structuredClone(row));}};
  let service=new LocalPractice(store),a=await service.request('create',{practice:true,setup:choice('roman-court')});const id=a.view.roomId,key=a.token;assert.equal(a.view.setup.phase,'setup');
  await service.request('ready',{id},key);const first=await service.request('commit',{id,exchange:1,requestId:crypto.randomUUID(),prompt:'Ask Nell about the key'},key);assert(first.view.canSubmit);assert(first.view.turn.usedMinutes>0);
  service=new LocalPractice(store);const restored=await service.request('read',{id},key);assert.equal(restored.view.turn.usedMinutes,first.view.turn.usedMinutes);assert.equal(restored.view.name,'Elena');
  const next=await service.request('commit',{id,exchange:restored.view.exchange,requestId:crypto.randomUUID(),prompt:'Ask Nell about the time'},key);assert(next.view.canSubmit);assert.equal(next.view.turn.number,1);
});
test('each family supports a complete acquired-evidence ending under the difficult deadline',()=>{
  for(const profile of ENVIRONMENTS){const s=ready(profile.id,'difficult');
    for(const [root,prompt] of [['register','Inspect key register'],['weight','Inspect brass weight'],['body',`Inspect ${s.names.body}`],['end','File case against Nell']]){
      for(let guard=0;guard<12&&!s.result&&(root==='end'||!s.discoveries.A.some(d=>d.root===root));guard++){
        const id=expectedSeat(s);act(s,id,id==='B'?'Wait 15 minutes':s.ongoing.A?'Continue existing activity':prompt);
      }
    }
    assert.equal(s.result?.ending,'established',profile.id);assert.deepEqual(s.result.winners,['A']);assert((s.world.elapsedDays-s.startedAt)*1440<120);
  }
});
