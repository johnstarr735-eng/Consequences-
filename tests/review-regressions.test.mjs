import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,commitIntention,playerView,packForStorage,unpackFromStorage} from '../lib/game.mjs';
import {configureCharacter,confirmSetup} from '../lib/game-setup.mjs';
import {person,refreshAccess} from '../lib/case-world.mjs';
import {parseCaseIntention} from '../lib/case-intentions.mjs';
import {LocalPractice} from '../lib/local-practice.mjs';
import {latestExchange,sceneEntries,intentionHistory} from '../lib/perspective-summary.mjs';

const act=(s,id,prompt)=>commitIntention(s,id,{exchange:s.exchange,requestId:crypto.randomUUID(),prompt});
function ready(a='Mara',b='Jonah',profileId='port-serein'){
  const s=createState({seed:3,setup:{profileId,character:{preset:'investigator',name:a}}});s.joined=true;
  configureCharacter(s,'B',{preset:'investigator',name:b});confirmSetup(s,'A');confirmSetup(s,'B');return s;
}
function local(){const rows=new Map();return new LocalPractice({get:async id=>rows.get(id),put:async row=>rows.set(row.id,structuredClone(row))});}

test('valid Cyrillic and Chinese names remain targetable by movement and physical attempts after reload',async()=>{
  for(const [a,b] of [['Элена','Томас'],['明月','天宇']]){
    const s=await unpackFromStorage(await packForStorage(ready(a,b)));
    assert.equal(parseCaseIntention(s,'A',`Approach ${b}`).tasks.at(-1).target,'B');
    assert.equal(parseCaseIntention(s,'A',`Grapple ${b}`).tasks.at(-1).target,'B');
    assert.equal(parseCaseIntention(s,'A',`Tell ${b}: Hello`).tasks.at(-1).to,'B');
  }
});
test('character names cannot collide with accent variants, material aliases or possessive target phrases',()=>{
  const s=createState({setup:{character:{preset:'investigator',name:'Elena'}}});
  for(const name of ['Élena','Key Book','Paper','My Pen','My Paper Bag'])assert.throws(()=>configureCharacter(s,'B',{preset:'investigator',name}),/distinct/);
  configureCharacter(s,'B',{preset:'investigator',name:'Томас'});assert.equal(s.names.B,'Томас');
});
test('a name prefix does not redirect dialogue and a historical victim can be named in an accusation',()=>{
  const s=ready('Tom','Tomas','roman-court');
  assert.equal(parseCaseIntention(s,'A','Tell Tomas: Hello').tasks.at(-1).to,'B');
  assert.throws(()=>parseCaseIntention(s,'A','Tell Tomatoes: Hello'));
  assert.equal(parseCaseIntention(s,'A','File a case against Nell killed Lucan').tasks.at(-1).accused,'N');
  assert.equal(parseCaseIntention(s,'A','Accuse Nell of killing Lucan').tasks.at(-1).accused,'N');
});
test('response availability and the final deadline are reported as the actual bounded action window',()=>{
  const s=ready();person(s,'A').pos={x:2.3,y:3};person(s,'B').pos={x:3,y:3};refreshAccess(s);
  act(s,'A','Tell Jonah: Hello');
  assert.equal(playerView(s,'B','room').turn.availableMinutes,1);assert(s.turn.usedMinutes<2);
  act(s,'B','Wait 5 minutes');assert.equal(s.turn.reaction,null);assert(Math.abs(s.ongoing.B.duration*1440-4)<1e-8);
  const deadline=ready();deadline.setup.deadlineMinutes=17;act(deadline,'A','Wait 15 minutes');
  assert(Math.abs(playerView(deadline,'B','room').turn.availableMinutes-2)<1e-8);
  act(deadline,'B','Wait 15 minutes');assert.equal(deadline.result.ending,'limit');assert(Math.abs((deadline.world.elapsedDays-deadline.startedAt)*1440-17)<1e-8);
});
test('on-device review respects setup agreement before interpreting any action',async()=>{
  const p=local(),a=await p.request('create',{practice:true,setup:{character:{preset:'investigator',name:'Elena'}}}),id=a.view.roomId;
  await assert.rejects(()=>p.request('preview',{id,prompt:'Wait 1 minute'},a.token),/cannot review/);
  await p.request('ready',{id},a.token);const result=await p.request('preview',{id,prompt:'Wait 1 minute'},a.token);assert.equal(result.preview.interpreted,true);
});
test('automatic practice does not replace the submitted action or hide its received consequences',async()=>{
  const p=local(),a=await p.request('create',{practice:true,setup:{character:{preset:'investigator',name:'Elena'}}}),id=a.view.roomId;
  await p.request('ready',{id},a.token);
  const {view}=await p.request('commit',{id,exchange:1,requestId:crypto.randomUUID(),prompt:'Wait 15 minutes'},a.token);
  assert.equal(latestExchange(view).intention,'Wait 15 minutes');
  assert.deepEqual(intentionHistory(view).map(h=>h.ownPrompt),['Wait 15 minutes']);
  assert(sceneEntries(view).some(e=>e.exchange===1&&e.text.includes('You let time pass')));
  assert(sceneEntries(view).some(e=>e.kind==='turn'&&e.text.includes('Elena')));
});
test('a brief response retains the responding seat’s input attribution through save and reload',async()=>{
  let s=ready();person(s,'A').pos={x:2.3,y:3};person(s,'B').pos={x:3,y:3};refreshAccess(s);
  act(s,'A','Tell Jonah: Hello');act(s,'B','Tell Mara: I heard you.');
  s=await unpackFromStorage(await packForStorage(s));
  const a=playerView(s,'A','room'),b=playerView(s,'B','room');
  assert.equal(a.completedExchanges.at(-1).ownContribution,false);assert.equal(b.completedExchanges.at(-1).ownContribution,true);
  assert.equal(latestExchange(a).intention,'Tell Jonah: Hello');assert.equal(latestExchange(b).intention,'Tell Mara: I heard you.');
});
