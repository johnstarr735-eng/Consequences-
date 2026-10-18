import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,commitIntention,playerView,packForStorage,unpackFromStorage,expectedSeat} from '../lib/game.mjs';
import {configureCharacter,confirmSetup} from '../lib/game-setup.mjs';
import {settleTimedIncapacity} from '../lib/case-time-turns.mjs';
import {createCaseState,person,refreshAccess,MINUTE} from '../lib/case-world.mjs';
import {parseCaseIntention} from '../lib/case-intentions.mjs';
import {resolveCaseExchange} from '../lib/case-simulation.mjs';

function ready(profileId='port-serein'){
  const s=createState({seed:3,setup:{profileId,difficulty:'medium',character:{preset:'investigator',name:'Mara'}}});s.joined=true;
  configureCharacter(s,'B',{preset:'wrestler',name:'Jonah'});confirmSetup(s,'A');confirmSetup(s,'B');return s;
}
const act=(s,seat,prompt,id=crypto.randomUUID())=>commitIntention(s,seat,{exchange:s.exchange,requestId:id,prompt});
function together(s){person(s,'A').pos={x:2.3,y:3};person(s,'B').pos={x:3,y:3};for(const id of ['N','D','S','P'])person(s,id).pos={x:7,y:7};refreshAccess(s);}

test('several questions resolve immediately within one fifteen-minute turn',()=>{
  const s=ready();act(s,'A','Ask Nell about the key');const first=playerView(s,'A','room');
  assert(first.entries.some(e=>e.kind==='speech'&&e.text.includes('register')));assert.equal(first.turn.number,1);assert(first.turn.usedMinutes>0);assert(first.canSubmit);
  act(s,'A','Ask Nell about the time');const second=playerView(s,'A','room');assert.equal(second.turn.number,1);assert(second.turn.usedMinutes>first.turn.usedMinutes);assert(second.canSubmit);assert.equal(second.otherCommitted,false);
});
test('a long action stops at exactly fifteen minutes and leaves the rest in progress',()=>{
  const s=ready(),start=s.world.elapsedDays;act(s,'A','Wait 30 minutes');
  assert(Math.abs((s.world.elapsedDays-start)/MINUTE-15)<1e-8);assert.equal(s.turn.seat,'B');assert.equal(s.turn.remainingMinutes,undefined);assert(Math.abs(s.ongoing.A.duration/MINUTE-15)<1e-8);
  act(s,'B','Wait 5 minutes');assert(Math.abs((s.world.elapsedDays-start)/MINUTE-20)<1e-8);assert(Math.abs(s.ongoing.A.duration/MINUTE-10)<1e-8);assert.equal(s.turn.seat,'B');
});
test('unfinished inspection retains its acquired attention and finishes during the other turn',async()=>{
  let s=ready();person(s,'N').pos={x:6.5,y:6.5};person(s,'A').pos={x:1.5,y:5.2};person(s,'phoneA').pos={x:1.84,y:5.2};refreshAccess(s);act(s,'A','Inspect register for 20 minutes');
  assert(!s.discoveries.A.some(d=>d.root==='register'));assert(s.ongoing.A.tasks[0].attentionWork>1);
  s=await unpackFromStorage(await packForStorage(s));act(s,'B','Wait 5 minutes');
  assert(s.discoveries.A.some(d=>d.root==='register'));assert(!s.ongoing.A);assert(!s.discoveries.B.some(d=>d.root==='register'));
});
test('a later task cannot resolve before the fifteen-minute cutoff',()=>{
  const s=ready();act(s,'A','Stay here and wait 20 minutes; inspect register');
  assert.equal(s.turn.seat,'B');assert(!s.discoveries.A.some(d=>d.root==='register'));assert.equal(s.ongoing.A.tasks.length,2);assert(s.ongoing.A.tasks[1].starts>0);
});
test('ending early transfers control without banking time or fabricating an action',()=>{
  const s=ready(),start=s.world.elapsedDays;act(s,'A','Look around');const elapsed=s.world.elapsedDays;act(s,'A','End turn');
  assert.equal(s.world.elapsedDays,elapsed);assert.equal(s.turn.seat,'B');assert.equal(s.turn.usedMinutes,0);assert.equal(s.turn.number,2);assert(s.world.elapsedDays>start);
});
test('a retried action is idempotent across save/reload and altered retry payloads fail',async()=>{
  let s=ready();const r={exchange:s.exchange,requestId:crypto.randomUUID(),prompt:'Wait 2 minutes'};commitIntention(s,'A',r);const at=s.world.elapsedDays;
  s=await unpackFromStorage(await packForStorage(s));assert.equal(commitIntention(s,'A',r),false);assert.equal(s.world.elapsedDays,at);
  assert.throws(()=>commitIntention(s,'A',{...r,prompt:'Wait 3 minutes'}),/retry identifier/);assert.throws(()=>act(s,'B','Wait 1 minute'),/other player/);
});
test('contact opens a perceived response before causing harm and does not grant another full turn',()=>{
  const s=ready();together(s);const start=s.world.elapsedDays;act(s,'A','Grapple Jonah');
  assert.equal(s.turn.reaction.seat,'B');assert.equal(s.world.elapsedDays,start);assert.equal(person(s,'B').injury,0);assert.equal(expectedSeat(s),'B');
  assert(playerView(s,'B','room').canSubmit);assert(!playerView(s,'A','room').canSubmit);act(s,'B','Defend myself');
  assert.equal(s.turn.reaction,null);assert.equal(s.turn.seat,'A');assert.equal(s.turn.number,1);assert(Math.abs(s.turn.usedMinutes-1)<1e-8);assert.equal(person(s,'B').sceneBody.restrained,0);
});
test('a delivered human conversation allows one brief reply, then returns control to the active player',()=>{
  const s=ready();together(s);act(s,'A','Tell Jonah: Did you see anything?');assert.equal(s.turn.reaction.seat,'B');
  act(s,'B','Tell Mara: I will check the records.');assert.equal(s.turn.seat,'A');assert.equal(s.turn.reaction,null);assert.equal(s.turn.number,1);assert(Math.abs(s.turn.usedMinutes-2)<1e-8);
  act(s,'A','Look around');assert.equal(s.turn.reaction,null);assert(s.entries.some(e=>e.audience.includes('A')&&e.text.startsWith('I will check the records')));
});
test('a delayed message can create a response after actual reading, never at send time',()=>{
  const s=ready();
  act(s,'A','Text Jonah: Meet me at the desk');assert.equal(s.turn.reaction,null);
  act(s,'A','Wait 2 minutes');assert.equal(s.turn.reaction?.seat,'B');assert(s.environment.messages[0].readAt);assert(s.turn.usedMinutes<3);
});
test('an attack offered as a response permits a counter-response before new harm resolves',()=>{
  const s=ready();together(s);act(s,'A','Tell Jonah: Did you see anything?');act(s,'B','Grapple Mara');
  assert.equal(s.turn.reaction?.seat,'A');assert.equal(person(s,'A').injury,0);act(s,'A','Defend myself');assert.equal(s.turn.reaction,null);assert.equal(s.turn.seat,'A');assert.equal(s.turn.number,1);
});
test('a day-long intention still advances only fifteen minutes on its first turn',()=>{
  const s=ready(),start=s.world.elapsedDays;act(s,'A','Wait 1440 minutes');assert(Math.abs((s.world.elapsedDays-start)*1440-15)<1e-8);assert(s.ongoing.A.duration*1440>1400);
});
test('temporary incapacity cannot strand the other seat behind a missing contribution',()=>{
  const s=ready();person(s,'A').sceneBody={reserve:.1,conscious:false,voiceBlocked:false};settleTimedIncapacity(s);
  assert(s.result||playerView(s,expectedSeat(s),'room').canSubmit);assert(s.world.elapsedDays>s.startedAt);
});
test('both incapacitated players resolve through recovery, mortality or the exact inquiry deadline',()=>{
  const s=ready();for(const id of ['A','B']){person(s,id).sceneBody={reserve:0,conscious:false,voiceBlocked:false};person(s,id).body.energy=0;person(s,id).body.water=0;}
  settleTimedIncapacity(s);assert(s.result||playerView(s,expectedSeat(s),'room').canSubmit);assert((s.world.elapsedDays-s.startedAt)/MINUTE<=180+1e-7);
});
test('permanent elimination closes the match without awarding an unsupported original goal',()=>{
  const s=ready();person(s,'B').alive=false;settleTimedIncapacity(s);assert.equal(s.result.ending,'eliminated');assert.deepEqual(s.result.winners,[]);assert(!playerView(s,'A','room').canSubmit);
});
test('an exact deadline cuts off activity and closes both unmet original goals',()=>{
  const s=ready();s.setup.deadlineMinutes=17;const start=s.world.elapsedDays;act(s,'A','Wait 30 minutes');act(s,'B','Wait 15 minutes');
  assert(Math.abs((s.world.elapsedDays-start)/MINUTE-17)<1e-8);assert.equal(s.result.ending,'limit');assert.deepEqual(s.result.winners,[]);
});
test('equal-time attempts at the same object cannot win solely by A/B processing order',()=>{
  for(const swap of [false,true]){
    const s=createCaseState(3);s.joined=true;person(s,'S').pos={x:7,y:7};const pos=person(s,'weight').pos;person(s,'A').pos={x:pos.x+(swap?.6:-.6),y:pos.y};person(s,'B').pos={x:pos.x+(swap?-.6:.6),y:pos.y};for(const id of ['A','B'])person(s,`phone${id}`).pos={x:person(s,id).pos.x+.34,y:person(s,id).pos.y};refreshAccess(s);
    for(const id of ['A','B'])s.pending[id]={requestId:crypto.randomUUID(),intent:parseCaseIntention(s,id,'Take brass weight')};resolveCaseExchange(s);
    assert(!s.world.materialCouplings.has('weight'));assert(s.entries.filter(e=>e.text.includes('same time')).length===2);
  }
});
