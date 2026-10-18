import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createLanguageProviders} from '../lib/language-providers.mjs';
import {createIntentInterpreter} from '../lib/intent-model.mjs';
import {PLAN_SCHEMA} from '../lib/case-plans.mjs';
import {defaultRecipe} from '../lib/scenario-catalog.mjs';
import {Rooms} from '../lib/rooms.mjs';

const plan={clarification:'',steps:[{op:'defend',target:null,instrument:null,content:'',minutes:1}]};
const ollama=value=>Response.json({message:{role:'assistant',content:JSON.stringify(value)},done:true});
const env={AI_PROVIDER:'ollama',OLLAMA_MODEL:'test-local-model',OPENAI_API_KEY:'test-cloud-key-must-not-be-sent'};
class LocalD1{
  constructor(){this.sql=new DatabaseSync(':memory:');for(const n of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())this.sql.exec(fs.readFileSync(new URL(`../drizzle/${n}`,import.meta.url),'utf8'));}
  prepare(sql){const db=this.sql;return{bind(...args){return{async run(){const r=db.prepare(sql).run(...args);return{meta:{changes:r.changes}};},async first(){return db.prepare(sql).get(...args)||null;},async all(){return{results:db.prepare(sql).all(...args)};}};}};}
}
async function match(providers){
  const db=new LocalD1(),rooms=new Rooms(db,providers),a=await rooms.create({setup:{character:{preset:'investigator',name:'Elena'}},seed:3}),id=a.view.roomId,b=await rooms.join(id,a.invite);
  await rooms.character(id,b.token,{preset:'investigator',name:'Tomas'});await rooms.ready(id,a.token);await rooms.ready(id,b.token);
  return{db,rooms,a,b,id};
}

test('disabled AI performs no requests and explicit disabled overrides an existing cloud key',()=>{
  const fetcher=()=>{throw new Error('Must not be called');};
  for(const config of [{},{AI_PROVIDER:'disabled',OPENAI_API_KEY:'test-only'}])assert.deepEqual(createLanguageProviders(config,fetcher),{interpreter:null,generator:null,dialogue:null});
});
test('Ollama preserves the existing schema, filtered input and provider boundary without sending a cloud credential',async()=>{
  let sent;
  const providers=createLanguageProviders(env,async(url,options)=>{sent={url:String(url),options,body:JSON.parse(options.body)};return ollama(plan);});
  const result=await providers.interpreter({prompt:'I ready myself for whatever they try',perspective:{name:'Elena',surroundings:[]}});
  assert.deepEqual(result,plan);assert.equal(sent.url,'http://127.0.0.1:11434/api/chat');assert.deepEqual(sent.body.format,PLAN_SCHEMA);assert.equal(sent.body.stream,false);assert.equal(sent.body.think,false);assert.equal(sent.body.model,'test-local-model');
  assert(!JSON.stringify(sent).includes(env.OPENAI_API_KEY));assert.equal(sent.options.headers.Authorization,undefined);assert.equal(sent.options.redirect,'error');assert(!sent.body.tools);
});
test('all three AI operations use the selected local provider with no paid fallback',async()=>{
  const calls=[],providers=createLanguageProviders(env,async(url,options)=>{
    const body=JSON.parse(options.body);calls.push({url:String(url),body});
    if(body.format.required.includes('clarification'))return ollama(plan);
    if(body.format.required.includes('profileId'))return ollama(defaultRecipe('port-serein',3));
    return ollama({words:'I can only speak from what I encountered.'});
  });
  await providers.interpreter({prompt:'An unusual immediate action',perspective:{}});
  assert.equal((await providers.generator({profileId:'port-serein',difficulty:'medium',seed:3})).profileId,'port-serein');
  assert.equal(await providers.dialogue({prompt:'What do you know?',perspective:{}}),'I can only speak from what I encountered.');
  assert.equal(calls.length,3);assert(calls.every(c=>c.url==='http://127.0.0.1:11434/api/chat'));assert(!JSON.stringify(calls).includes(env.OPENAI_API_KEY));
});
test('a valid local clarification with zero steps leaves the persisted world and revision untouched',async()=>{
  const {rooms,a,id}=await match(createLanguageProviders(env,async()=>ollama({clarification:'Which person do you mean?',steps:[]}))),before=await rooms.read(id,a.token);
  const review=await rooms.preview(id,a.token,'I bargain for protection and offer an unusual deal');
  assert.equal(review.interpreted,false);assert.equal(review.clarification,'Which person do you mean?');assert.deepEqual(await rooms.read(id,a.token),before);
});
test('malformed responses and state-edit parameters never become executable plans',async()=>{
  for(const value of [null,[],{clarification:'',steps:[]},{...plan,health:0},{clarification:'',steps:[{...plan.steps[0],health:0}]},{clarification:'',steps:[{...plan.steps[0],minutes:-1}]},{clarification:'',steps:[{op:'defend',content:'',minutes:1}]}]){
    const interpret=createIntentInterpreter({provider:'ollama',model:'test-local-model',fetcher:async()=>ollama(value)});
    await assert.rejects(()=>interpret({prompt:'Something',perspective:{}}),/invalid|unsupported/);
  }
});
test('unreachable Ollama fails review without changing the match or falling back to OpenAI',async()=>{
  const urls=[],providers=createLanguageProviders(env,async url=>{urls.push(String(url));throw new Error('offline');}),{rooms,a,id}=await match(providers),before=await rooms.read(id,a.token);
  urls.length=0;await assert.rejects(()=>rooms.preview(id,a.token,'I bargain for protection and offer an unusual deal'),/Ollama/);
  assert.deepEqual(urls,['http://127.0.0.1:11434/api/chat']);assert.deepEqual(await rooms.read(id,a.token),before);
});
test('local addresses are checked before any private perspective is transmitted',()=>{
  for(const baseUrl of ['https://example.com','http://192.168.1.2:11434','http://user:password@localhost:11434'])assert.throws(()=>createIntentInterpreter({provider:'ollama',model:'test-local-model',baseUrl}),/loopback/);
  for(const baseUrl of ['http://localhost:11434','http://127.0.0.1:11434','http://[::1]:11434'])assert.equal(typeof createIntentInterpreter({provider:'ollama',model:'test-local-model',baseUrl}),'function');
  for(const model of ['gpt-oss:120b-cloud','example:cloud','cloud/example'])assert.throws(()=>createIntentInterpreter({provider:'ollama',model}),/cloud model/);
});
test('a missing model or invalid provider leaves existing matches readable and direct actions playable',async()=>{
  for(const config of [{AI_PROVIDER:'ollama'},{AI_PROVIDER:'unknown',OPENAI_API_KEY:'test-only'}]){
    const providers=createLanguageProviders(config,async()=>{throw new Error('No network allowed');}),{rooms,a,id}=await match(providers),before=await rooms.read(id,a.token);
    await assert.rejects(()=>rooms.preview(id,a.token,'An unusual invitation and bargain'),/OLLAMA_MODEL|AI_PROVIDER/);
    assert.equal((await rooms.read(id,a.token)).clock,before.clock);
    const after=await rooms.commit(id,a.token,{exchange:before.exchange,prompt:'Wait 1 minute',requestId:crypto.randomUUID()});assert.notEqual(after.clock,before.clock);
  }
});
test('an already reviewed plan survives a provider switch and is not reinterpreted on commit',async()=>{
  let calls=0;const providers=createLanguageProviders({AI_PROVIDER:'openai',OPENAI_API_KEY:'test-only'},async()=>{calls++;return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(plan)}]}]});});
  // Keep scenario generation out of this fixture: it tests a reviewed attempt.
  const {db,rooms,a,id}=await match({interpreter:providers.interpreter}),prompt='I ready myself for whatever they try',review=await rooms.preview(id,a.token,prompt),before=await rooms.read(id,a.token);
  const changed=new Rooms(db,createLanguageProviders(env,async()=>{throw new Error('An accepted plan must not call a new model');}));
  const after=await changed.commit(id,a.token,{exchange:before.exchange,prompt,reviewId:review.reviewId,requestId:crypto.randomUUID()});
  assert.equal(calls,1);assert.equal(after.exchange,before.exchange+1);assert.equal(after.name,before.name);assert.equal(after.scenario.goal,before.scenario.goal);assert.equal(after.completedExchanges.at(-1).ownPrompt,prompt);
});
test('invalid HTTP and incomplete JSON responses produce a controlled interpreter failure',async()=>{
  for(const fetcher of [async()=>new Response('offline',{status:500}),async()=>Response.json({message:{content:'{unfinished'}}),async()=>Response.json({message:{}}),async()=>new Response('not-json')]){
    const interpret=createIntentInterpreter({provider:'ollama',model:'test-local-model',fetcher});
    await assert.rejects(()=>interpret({prompt:'Something',perspective:{}}),error=>error.status===503);
  }
});
