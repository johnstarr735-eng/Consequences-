import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {Rooms} from '../lib/rooms.mjs';
import {defaultRecipe} from '../lib/scenario-catalog.mjs';

class LocalD1{
  constructor(){this.sql=new DatabaseSync(':memory:');for(const n of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())this.sql.exec(fs.readFileSync(new URL(`../drizzle/${n}`,import.meta.url),'utf8'));}
  prepare(sql){const db=this.sql;return{bind(...args){return{async run(){const r=db.prepare(sql).run(...args);return{meta:{changes:r.changes}};},async first(){return db.prepare(sql).get(...args)||null;},async all(){return{results:db.prepare(sql).all(...args)};}};}};}
}
const setup={profileId:'port-serein',difficulty:'medium',character:{preset:'investigator',name:'Elena'}};
const request=(exchange,prompt)=>({exchange,prompt,requestId:crypto.randomUUID()});
async function joined(options={}){const db=new LocalD1(),rooms=new Rooms(db,options),a=await rooms.create({setup,seed:3,accountId:'A-account'}),id=a.view.roomId,b=await rooms.join(id,a.invite,null,'B-account');await rooms.character(id,b.token,{preset:'wrestler',name:'Tomas'});await rooms.ready(id,a.token);await rooms.ready(id,b.token);return{db,rooms,a,b,id};}

test('persisted timed rooms permit follow-ups and concurrent retry resolves only once',async()=>{
  const {db,rooms,a,b,id}=await joined(),r=request(1,'Ask Nell about the key'),[v,w]=await Promise.all([rooms.commit(id,a.token,r),rooms.commit(id,a.token,r)]);
  assert.equal(v.revision,w.revision);assert.equal(v.exchange,2);assert.equal(v.turn.number,1);assert(v.canSubmit);
  const restarted=new Rooms(db),next=await restarted.commit(id,a.token,request(2,'Ask Nell about the time'));assert.equal(next.turn.number,1);assert(next.turn.usedMinutes>v.turn.usedMinutes);
  await assert.rejects(()=>rooms.commit(id,b.token,request(next.exchange,'Wait 1 minute')),/other player/);assert.equal((await restarted.read(id,b.token)).name,'Tomas');assert.equal((await restarted.listAccount('A-account'))[0].name,'Elena');
});
test('unsupported characters and locked/out-of-turn reviews never reach an AI provider',async()=>{
  let calls=0;const generator=async()=>{calls++;return defaultRecipe('port-serein',3);},rooms=new Rooms(new LocalD1(),{generator});
  await assert.rejects(()=>rooms.create({setup:{...setup,character:{...setup.character,force:999}}}));assert.equal(calls,0);
  const a=await rooms.create({setup});await assert.rejects(()=>rooms.preview(a.view.roomId,a.token,'Anything'),/cannot review/);assert.equal(calls,1);
  let interpretations=0;const match=await joined({interpreter:async()=>{interpretations++;return{clarification:'Unknown',steps:[]};}});await assert.rejects(()=>match.rooms.preview(match.id,match.b.token,'Unknown request'),/cannot review/);assert.equal(interpretations,0);
});
test('generator failure or unsupported output falls back to a valid same-environment setup',async()=>{
  for(const generator of [async()=>{throw new Error('offline');},async()=>({profileId:'unsupported',force:999})]){
    const rooms=new Rooms(new LocalD1(),{generator}),a=await rooms.create({setup:{...setup,profileId:'roman-court'},seed:3});assert.equal(a.view.setup.generator,'local-fallback');assert.equal(a.view.setup.profileId,'roman-court');assert.equal(a.view.environment.handsets.length,0);assert(!JSON.stringify(a.view).includes('culpritIndex'));
  }
});
test('a connected scenario recipe is validated and survives service restart without regenerating history',async()=>{
  let calls=0;const db=new LocalD1(),rooms=new Rooms(db,{generator:async({profileId})=>{calls++;return{...defaultRecipe(profileId,3),culpritIndex:2};}}),a=await rooms.create({setup,seed:3});
  assert.equal(a.view.setup.generator,'connected-ai');const reloaded=new Rooms(db),s=await reloaded.state(await reloaded.row(a.view.roomId));assert.equal(s.actuality.culprit,'S');assert.equal(calls,1);assert.equal((await reloaded.read(a.view.roomId,a.token)).clock,a.view.clock);
});
test('automatic practice completes its interval and returns control or a real response opportunity',async()=>{
  const rooms=new Rooms(new LocalD1()),a=await rooms.create({setup,practice:true,seed:3}),id=a.view.roomId;await rooms.ready(id,a.token);
  let v=await rooms.commit(id,a.token,request(1,'Wait 15 minutes'));assert(v.canSubmit||v.result);assert(v.turn.reaction?.isYours||v.turn.seat==='A'||v.result);
  if(v.turn.reaction?.isYours)v=await rooms.commit(id,a.token,request(v.exchange,'Continue existing activity'));
  assert(v.canSubmit||v.result);assert.equal(v.turn.seat,'A');
});
test('public title variants do not provide a fixed mapping to the private prior culprit',()=>{
  const titles=new Map();for(let seed=1;seed<=180;seed++){const r=defaultRecipe('port-serein',seed);if(!titles.has(r.titleIndex))titles.set(r.titleIndex,new Set());titles.get(r.titleIndex).add(r.culpritIndex);}assert.equal(titles.size,3);assert([...titles.values()].every(c=>c.size===3));
});
test('optional dialogue sees only the addressed person’s own account and a retry does not call it again',async()=>{
  const contexts=[],match=await joined({dialogue:async input=>{contexts.push(input);return 'I know the records court from my work here.';}}),{rooms,a,b,id}=match;
  await rooms.notes(id,b.token,'PRIVATE OTHER PLAYER NOTE');const r=request(1,'Ask Nell about her daily work'),v=await rooms.commit(id,a.token,r);
  assert.equal(contexts.length,1);const data=JSON.stringify(contexts[0]);assert(!data.includes('PRIVATE OTHER PLAYER NOTE'));assert(!data.includes('wasCulprit'));assert(!data.includes('actuality'));assert(v.entries.some(e=>e.text==='I know the records court from my work here.'));
  await rooms.commit(id,a.token,r);assert.equal(contexts.length,1);await assert.rejects(()=>rooms.commit(id,b.token,request(v.exchange,'Ask Nell about her daily work')),/other player/);assert.equal(contexts.length,1);
});
