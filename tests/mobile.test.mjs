import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalPractice } from '../lib/local-practice.mjs';
import { invitationLink, parseInvitation, perspectiveExport, readDraft, writeDraft, readSessions, forgetDevice } from '../lib/client-state.mjs';
import { unpackFromStorage } from '../lib/game.mjs';

const ORIGIN='https://consequences.example',ID='a'.repeat(24),KEY='b'.repeat(64);
class DeviceStorage {
  values=new Map();get length(){return this.values.size;}key(i){return [...this.values.keys()][i]||null;}
  getItem(k){return this.values.get(k)||null;}setItem(k,v){this.values.set(k,String(v));}removeItem(k){this.values.delete(k);}
}
class Worlds {
  rows=new Map();fail=false;
  async get(id){return structuredClone(this.rows.get(id));}
  async put(row){if(this.fail)throw new Error('Device storage full');this.rows.set(row.id,structuredClone(row));}
}
const turn=(exchange,prompt,id='device-request-0001')=>({exchange,prompt,requestId:id});

test('invitation sharing retains a one-use fragment and rejects other origins and incomplete links',()=>{
 const link=invitationLink(ORIGIN,ID,KEY);assert.equal(new URL(link).searchParams.get('invite'),null);
 assert.deepEqual(parseInvitation(link,ORIGIN),{id:ID,invite:KEY});
 for(const link of [`https://elsewhere.example/?room=${ID}#invite=${KEY}`,`https://consequences.example.evil/?room=${ID}#invite=${KEY}`,`${ORIGIN}/?room=${ID}&invite=${KEY}`,`javascript:alert(1)`,`${ORIGIN}/path?room=${ID}#invite=${KEY}`])assert.throws(()=>parseInvitation(link,ORIGIN));
});

test('drafts and retry identifiers persist per player and exchange without another player receiving them',()=>{
 const storage=new DeviceStorage();
 const d={exchange:4,prompt:'Ask Nell about last night',notes:'My private suspicion',notesBase:'Earlier saved note',requestId:'device_retry_1234'};
 assert(writeDraft(storage,ID,'A',d));assert.deepEqual(readDraft(storage,ID,'A'),d);assert.equal(readDraft(storage,ID,'B'),null);
 storage.setItem('consequences:draft:broken:A','{"exchange":"4"}');assert.equal(readDraft(storage,'broken','A'),null);
 const denied={setItem(){throw new Error('Quota');}};assert.equal(writeDraft(denied,ID,'A',d),false);
});

test('forgetting this device removes only Consequences data, and damaged session lists fail closed',()=>{
 const storage=new DeviceStorage();storage.setItem('other-app','keep');storage.setItem('consequences:sessions:v1',JSON.stringify([{id:ID,token:KEY,seat:'A',name:'Mara'},{id:ID,token:KEY,seat:'N',name:'Nell'}]));
 assert.equal(readSessions(storage).length,1);storage.setItem('consequences:reading','large');forgetDevice(storage);
 assert.equal(storage.getItem('other-app'),'keep');assert.equal(storage.length,1);assert.deepEqual(readSessions(storage),[]);
 storage.setItem('consequences:sessions:v1','null');assert.deepEqual(readSessions(storage),[]);
});

test('the portable journal exports only the requesting perspective and excludes capabilities and hidden fields',async()=>{
 const practice=new LocalPractice(new Worlds()),a=await practice.request('create',{practice:true}),v=a.view;
 v.token='private-key';v.actuality={culprit:'hidden-person'};v.otherNotes='not yours';v.entries[0].privateProof='hidden-proof';v.discoveries.push({title:'Your trace',text:'Your finding',mode:'direct',source:null,root:'register',assertion:{culprit:true}});
 const journal=perspectiveExport(v,new Date('2026-10-17T00:00:00Z')),json=JSON.stringify(journal);
 for(const secret of [a.token,'private-key','hidden-person','not yours','hidden-proof','assertion'])assert(!json.includes(secret));
 assert.equal(journal.player,'Mara');assert.equal(journal.discoveries[0].text,'Your finding');assert.equal(journal.result,null);
});

test('on-device practice survives restart, resolves the helper and persists duplicate commits only once',async()=>{
 const store=new Worlds(),first=new LocalPractice(store),a=await first.request('create',{practice:true}),id=a.view.roomId,key=a.token;
 const preview=await first.request('preview',{id,prompt:'Inspect key register'},key);assert.equal(preview.preview.interpreted,true);
 const request={id,...turn(1,'Inspect key register')},results=await Promise.all([first.request('commit',request,key),first.request('commit',request,key)]);
 assert.equal(results[0].view.exchange,2);assert.equal(results[0].view.revision,results[1].view.revision);
 const second=new LocalPractice(store),resumed=await second.request('read',{id},key);
 assert.equal(resumed.view.exchange,2);assert.equal(resumed.view.completedExchanges.length,1);assert.equal(resumed.view.practice,true);
 await assert.rejects(()=>second.request('read',{id},'wrong'),/does not belong/);
});

test('a failed device save can be retried without consuming an extra exchange',async()=>{
 const store=new Worlds(),practice=new LocalPractice(store),a=await practice.request('create',{practice:true}),data={id:a.view.roomId,...turn(1,'Wait 1 minute')};
 store.fail=true;await assert.rejects(()=>practice.request('commit',data,a.token),/storage full/);
 assert.equal((await practice.request('read',{id:data.id},a.token)).view.exchange,1);
 store.fail=false;assert.equal((await practice.request('commit',data,a.token)).view.exchange,2);
});

test('local clarification preserves the world, and resignation closes it without awarding a goal',async()=>{
 const store=new Worlds(),practice=new LocalPractice(store),a=await practice.request('create',{practice:true}),id=a.view.roomId,before=await store.get(id);
 const result=await practice.request('preview',{id,prompt:'I bargain for a position in the council'},a.token);
 assert.equal(result.preview.interpreted,false);assert.deepEqual(await store.get(id),before);
 await practice.request('notes',{id,text:'Private device note'},a.token);assert.equal((await new LocalPractice(store).request('read',{id},a.token)).view.notes,'Private device note');
 await assert.rejects(()=>practice.request('notes',{id,text:'An overlapping edit',baseText:''},a.token),/saved note changed/);
 assert.equal((await practice.request('read',{id},a.token)).view.notes,'Private device note');
 const end=await practice.request('resign',{id},a.token);assert.deepEqual(end.view.result.winnerNames,[]);assert.equal(end.view.clock,a.view.clock);
 await assert.rejects(()=>practice.request('commit',{id,...turn(1,'Wait')},a.token),/ended/);
 const state=await unpackFromStorage((await store.get(id)).encoded);assert.equal(state.pending.A,undefined);
});

test('the device adapter refuses to create or join an authoritative multiplayer room',async()=>{
 const practice=new LocalPractice(new Worlds());await assert.rejects(()=>practice.request('create',{practice:false}),/online game/);
 await assert.rejects(()=>practice.request('join',{id:ID,invite:KEY}),/online match/);
});
