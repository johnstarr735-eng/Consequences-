import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {Rooms,makeToken} from '../lib/rooms.mjs';
import {unpackFromStorage} from '../lib/game.mjs';
import {commitCase} from '../lib/case-simulation.mjs';
import {MINUTE} from '../lib/case-world.mjs';
import {encodeWorld} from '../lib/world-codec.mjs';

class LocalD1 {
  constructor(){this.sql=new DatabaseSync(':memory:');for(const name of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())this.sql.exec(fs.readFileSync(new URL(`../drizzle/${name}`,import.meta.url),'utf8'));}
  prepare(sql){const db=this.sql;return{bind(...args){return{async run(){const r=db.prepare(sql).run(...args);return{meta:{changes:r.changes}};},async first(){return db.prepare(sql).get(...args)||null;},async all(){return{results:db.prepare(sql).all(...args)};}};}};}
}
let n=0;
const request=(exchange,prompt)=>({exchange,prompt,requestId:`case_room_request_${++n}`});
async function joined(){const db=new LocalD1(),rooms=new Rooms(db),a=await rooms.create({seed:3,accountId:'account-A'}),b=await rooms.join(a.view.roomId,a.invite,null,'account-B');return{db,rooms,a,b,id:a.view.roomId};}

test('new rooms use the new case while existing ledger saves retain their scenario',async()=>{
  const rooms=new Rooms(new LocalD1()),modern=await rooms.create(),legacy=await rooms.create({scenario:'last-entry'});
  assert.equal(modern.view.scenario.id,'night-watch');assert.equal(legacy.view.scenario.title,'The last entry');
  assert((await rooms.row(modern.view.roomId)).state.startsWith('cq2:gzip:'));
  assert(!(await rooms.row(legacy.view.roomId)).state.startsWith('cq2:gzip:'));
  assert.equal((await rooms.read(legacy.view.roomId,legacy.token)).scenario.title,legacy.view.scenario.title);
});

test('account recovery restores only the linked seat and preserves its pending private intention',async()=>{
  const {db,rooms,a,b,id}=await joined();await rooms.commit(id,a.token,request(1,'Ask Nell about the key'));
  const service=new Rooms(db),recovered=await service.recover('account-A',id,'A');
  assert.notEqual(recovered.token,a.token);assert.equal(recovered.view.committed,true);assert.equal(recovered.view.ownPrompt,'Ask Nell about the key');
  assert.equal((await service.read(id,a.token)).revision,recovered.view.revision);
  assert.equal((await service.read(id,b.token)).ownPrompt,null);
  await assert.rejects(()=>service.recover('account-B',id,'A'),/not linked/);
  await assert.rejects(()=>service.recover(null,id,'A'),/Sign in/);
  assert.deepEqual((await service.listAccount('account-A')).map(s=>s.seat),['A']);
  assert.deepEqual(await service.listAccount('account-C'),[]);assert.deepEqual(await service.listAccount(null),[]);
});

test('concurrent duplicate commits advance a compressed match only once',async()=>{
  const {rooms,a,b,id}=await joined();await rooms.commit(id,a.token,request(1,'Inspect register'));
  const r=request(1,'Inspect signal log'),views=await Promise.all([rooms.commit(id,b.token,r),rooms.commit(id,b.token,r)]);
  assert.equal(views[0].revision,views[1].revision);assert.equal(views[0].exchange,2);
  const row=await rooms.row(id),s=await unpackFromStorage(row.state);assert.equal(s.history.length,1);assert.equal(row.revision,3);
});

test('the persisted practice helper permits a complete new-case ending',async()=>{
  const rooms=new Rooms(new LocalD1()),a=await rooms.create({practice:true,seed:3}),id=a.view.roomId;
  let v=a.view;
  for(const prompt of ['Inspect key register','Inspect brass weight','Inspect Rowan','File case against Nell'])v=await rooms.commit(id,a.token,request(v.exchange,prompt));
  assert(v.result?.achieved,JSON.stringify(v.entries.slice(-4)));assert.equal(v.result.debrief.culprit,'Nell');
  assert.equal((await rooms.read(id,a.token)).result.achieved,true);
});

test('resignation closes a locked exchange without advancing time or awarding a goal',async()=>{
  const {rooms,a,b,id}=await joined();await rooms.commit(id,a.token,request(1,'Inspect register'));
  const clock=(await rooms.read(id,a.token)).clock;const end=await rooms.resign(id,b.token);
  assert.equal(end.clock,clock);assert.deepEqual(end.result.winnerNames,[]);assert.equal(end.committed,false);assert.equal(end.otherCommitted,false);
  assert.equal(end.result.debrief.culprit,'Nell');await assert.rejects(()=>rooms.commit(id,b.token,request(1,'Wait')),/ended/);
  assert.equal((await rooms.resign(id,b.token)).revision,end.revision);
});

test('linking an existing authenticated capability enables recovery without changing its world',async()=>{
  const rooms=new Rooms(new LocalD1()),a=await rooms.create({scenario:'last-entry'}),id=a.view.roomId,row=await rooms.row(id);
  const seat=await rooms.seat(row,a.token);await rooms.rememberAccount(id,seat,a.token,'existing-account');
  const recovered=await rooms.recover('existing-account',id,'A');assert.equal(recovered.view.clock,a.view.clock);assert.equal(recovered.view.joined,false);
  assert.equal((await rooms.row(id)).state,row.state);await assert.rejects(()=>rooms.read(id,makeToken()),/does not belong/);
});

test('a busy match reaches its exact deadline and a large immutable save remains fully recoverable',async()=>{
  const {rooms,a,id}=await joined(),s=await rooms.state(await rooms.row(id));
  while(!s.result){
    const odd=s.exchange%2,aPrompt=odd?'Approach Nell':'Approach Silas',bPrompt=odd?'Approach Ada':'Approach Mara',first=odd?'A':'B';
    for(const seat of [first,first==='A'?'B':'A'])commitCase(s,seat,request(s.exchange,seat==='A'?aPrompt:bPrompt));
  }
  assert(Math.abs(s.world.elapsedDays-s.startedAt-180*MINUTE)<1e-10);
  assert.equal(s.result.ending,'limit');
  await rooms.mutate(id,a.token,current=>{Object.assign(current,s);return true;});
  const old=await rooms.row(id);assert(old.state.startsWith('cq2:chunks:'));
  const restored=await rooms.state(old);assert.deepEqual(encodeWorld(restored.world),encodeWorld(s.world));
  await rooms.notes(id,a.token,'A note after the inquiry');
  assert.equal((await rooms.state(old)).notes.A,'');
  assert.equal((await rooms.read(id,a.token)).notes,'A note after the inquiry');
  assert.equal((await rooms.listAccount('account-A'))[0].ended,true);
});

test('free-form review without a language connection asks for clarification without advancing anything',async()=>{
 const {rooms,a,id}=await joined(),before=await rooms.row(id);
 const review=await rooms.preview(id,a.token,'I bargain for protection and offer an unusual deal');
 assert.equal(review.interpreted,false);assert.equal(review.modelRequired,true);
 const after=await rooms.row(id);assert.equal(after.revision,before.revision);assert.equal(after.state,before.state);
});

test('a reviewed model plan is private, bound to its seat and prompt, and survives a service restart',async()=>{
 const {db,rooms,a,b,id}=await joined(),before=(await rooms.read(id,a.token)).clock;
 const interpreted=new Rooms(db,{interpreter:async({perspective})=>{assert.equal(perspective.name,'Mara');assert(!('actuality' in perspective));return{clarification:'',steps:[{op:'defend',target:null,instrument:null,content:'',minutes:1}]};}});
 const review=await interpreted.preview(id,a.token,'I ready myself for whatever they try');
 assert(review.reviewId);assert.equal((await rooms.read(id,a.token)).clock,before);
 assert(!JSON.stringify(await rooms.read(id,b.token)).includes(review.reviewId));
 await assert.rejects(()=>rooms.commit(id,a.token,{...request(1,'A changed prompt'),reviewId:review.reviewId}),/stale|another seat/);
 const resumed=new Rooms(db);await resumed.commit(id,a.token,{...request(1,'I ready myself for whatever they try'),reviewId:review.reviewId});
 const view=await resumed.commit(id,b.token,request(1,'Wait 1 minute'));assert.equal(view.exchange,2);
});

test('a recovered host can replace a lost invitation without advancing the world or granting another account a seat',async()=>{
 const db=new LocalD1(),rooms=new Rooms(db),a=await rooms.create({accountId:'host'}),id=a.view.roomId;
 const recovered=await rooms.recover('host',id,'A'),before=await rooms.row(id),next=await rooms.invitation(id,recovered.token),after=await rooms.row(id);
 assert.notEqual(next.invite,a.invite);assert.equal(next.view.clock,a.view.clock);assert.equal(before.state,after.state);assert.equal(after.revision,before.revision+1);
 await assert.rejects(()=>rooms.join(id,a.invite),/invalid|used/);
 const b=await rooms.join(id,next.invite);assert.equal(b.view.seat,'B');
 await assert.rejects(()=>rooms.invitation(id,b.token),/Only the host/);
 await assert.rejects(()=>rooms.invitation(id,a.token),/no longer has an open/);
});

test('concurrent note edits from the same saved base preserve one version and report a conflict for the other',async()=>{
 const {rooms,a,b,id}=await joined(),clock=a.view.clock;
 const results=await Promise.allSettled([rooms.notes(id,a.token,'My first draft',''),rooms.notes(id,a.token,'My second draft','')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
 const failed=results.find(r=>r.status==='rejected');assert.equal(failed.reason.status,409);
 const saved=await rooms.read(id,a.token);assert(['My first draft','My second draft'].includes(saved.notes));assert.equal(saved.clock,clock);assert.equal((await rooms.read(id,b.token)).notes,'');
 const replay=await rooms.notes(id,a.token,saved.notes,'');assert.equal(replay.revision,saved.revision);
 const replacement=await rooms.notes(id,a.token,'Chosen final draft',saved.notes);assert.equal(replacement.notes,'Chosen final draft');
});

test('invalid, locked and out-of-turn reviews fail before reaching a language provider',async()=>{
 const {db,rooms,a,b,id}=await joined();let calls=0;
 const interpreted=new Rooms(db,{interpreter:async()=>{calls++;return{clarification:'Which person?',steps:[]};}});
 await assert.rejects(()=>interpreted.preview(id,a.token,''),/one intention/);
 await assert.rejects(()=>interpreted.preview(id,a.token,'x'.repeat(601)),/600 characters/);
 await assert.rejects(()=>interpreted.preview(id,b.token,'Invent an unusual arrangement'),/right now/);
 await rooms.commit(id,a.token,request(1,'Wait'));
 await assert.rejects(()=>interpreted.preview(id,a.token,'Make an unusual arrangement'),/right now/);
 assert.equal(calls,0);
});
