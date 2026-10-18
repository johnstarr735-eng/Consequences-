import {compilePlan,privateInterpretationContext} from './case-plans.mjs';
import {normalizeSetup,configureCharacter,confirmSetup,configurePractice} from './game-setup.mjs';
import {parseCaseIntention} from './case-intentions.mjs';
import {person,namesFor} from './case-world.mjs';
import { createState, packForStorage, unpackFromStorage, playerView, previewIntention, commitIntention, expectedSeat, practicePrompt, resignState, GameError } from './game.mjs';

const ROOM = /^[a-f0-9]{24}$/;
const TOKEN = /^[a-f0-9]{64}$/;
export const makeToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');
const roomId = () => makeToken().slice(0, 24);
export async function hashToken(token) {
  if (!TOKEN.test(token || '')) throw new GameError('A valid player key is required.', 401);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map(b => b.toString(16).padStart(2, '0')).join('');
}

export class Rooms {
  /** @param {any} db @param {{interpreter?: Function|null,generator?: Function|null,dialogue?: Function|null}} [options] */
  constructor(db,{interpreter=null,generator=null,dialogue=null}={}) { this.db = db; this.interpreter=interpreter;this.generator=generator;this.dialogue=dialogue; }
  async state(row){
    let encoded=row.state;
    if(encoded.startsWith('cq2:chunks:')){
      const [, ,snapshot,count]=encoded.split(':');
      const rows=await this.db.prepare('SELECT part,payload FROM consequence_state_chunks WHERE room_id=? AND snapshot_id=? ORDER BY part').bind(row.id,snapshot).all();
      if(rows.results.length!==Number(count)||rows.results.some((r,i)=>r.part!==i))throw new GameError('The saved history is temporarily unavailable. Please retry.',503);
      encoded=rows.results.map(r=>r.payload).join('');
    }
    return unpackFromStorage(encoded);
  }
  async storageState(id,state){
    const encoded=await packForStorage(state);if(encoded.length<=1_500_000)return encoded;
    // Immutable chunks are written fully before a room revision can reference them.
    // Earlier published snapshots remain readable by concurrent requests; no history
    // is truncated, and a losing CAS writer cannot overwrite another writer's data.
    const snapshot=makeToken(),parts=Math.ceil(encoded.length/750_000);
    for(let part=0;part<parts;part++)await this.db.prepare('INSERT INTO consequence_state_chunks (snapshot_id,room_id,part,payload,created_at) VALUES (?,?,?,?,?)').bind(snapshot,id,part,encoded.slice(part*750_000,(part+1)*750_000),Date.now()).run();
    return `cq2:chunks:${snapshot}:${parts}`;
  }
  /** @param {{practice?: boolean, scenario?: string, seed?: number|null, accountId?: string|null,setup?:any}} [options] */
  async create({ practice = false, scenario = 'night-watch', seed = null, accountId = null,setup=null } = {}) {
    const id = roomId(), a = makeToken(), invite = makeToken(), now = Date.now();
    const chosenSeed=seed??crypto.getRandomValues(new Uint32Array(1))[0],choice=setup?normalizeSetup(setup):null;
    let recipe=null,generationFailed=false;
    if(choice&&this.generator){try{recipe=await this.generator({...choice,seed:chosenSeed});}catch{generationFailed=true;}}
    let state;
    try{state=createState({scenario,seed:chosenSeed,setup:choice,recipe});}catch(error){if(!recipe)throw error;generationFailed=true;state=createState({scenario,seed:chosenSeed,setup:choice});}
    if(state.setup&&generationFailed)state.setup.generator='local-fallback';
    if (practice) configurePractice(state);
    await this.db.prepare('INSERT INTO consequence_rooms (id,revision,state,seat_a_hash,invite_hash,created_at,updated_at) VALUES (?,0,?,?,?,?,?)')
      .bind(id, await this.storageState(id,state), await hashToken(a), practice ? null : await hashToken(invite), now, now).run();
    if(accountId)await this.rememberAccount(id,'A',a,accountId);
    return { token: a, invite: practice ? null : invite, view: playerView(state, 'A', id, 0) };
  }
  async row(id) {
    if (!ROOM.test(id || '')) throw new GameError('Match not found.', 404);
    const row = await this.db.prepare('SELECT * FROM consequence_rooms WHERE id=?').bind(id).first();
    if (!row) throw new GameError('Match not found.', 404);
    return row;
  }
  async seat(row, token) {
    const hash = await hashToken(token);
    if (hash === row.seat_a_hash) return 'A';
    if (row.seat_b_hash && hash === row.seat_b_hash) return 'B';
    const extra=await this.db.prepare('SELECT seat FROM consequence_seat_keys WHERE room_id=? AND key_hash=?').bind(row.id,hash).first();
    if(extra)return extra.seat;
    throw new GameError('This key does not belong to either player in this match.', 403);
  }
  async read(id, token) {
    const row = await this.row(id), seat = await this.seat(row, token);
    return playerView(await this.state(row), seat, id, row.revision);
  }
  /** @param {string} id @param {string} invite @param {string|null} [playerToken] @param {string|null} [accountId] */
  async join(id, invite, playerToken = null, accountId = null) {
    const hash = await hashToken(invite), token = playerToken || makeToken(), tokenHash = await hashToken(token);
    for (let attempt = 0; attempt < 5; attempt++) {
      const row = await this.row(id);
      if (row.seat_b_hash === tokenHash) {if(accountId)await this.rememberAccount(id,'B',token,accountId);return { token, view: playerView(await this.state(row), 'B', id, row.revision) };}
      if (row.seat_a_hash === tokenHash) throw new GameError('The second player needs a distinct player key.');
      if (row.invite_hash !== hash || row.seat_b_hash) throw new GameError('This invitation is invalid or has already been used.', 403);
      const state = await this.state(row); state.joined = true;
      const written = await this.db.prepare('UPDATE consequence_rooms SET state=?,seat_b_hash=?,invite_hash=NULL,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND seat_b_hash IS NULL AND invite_hash=? RETURNING revision')
        .bind(await this.storageState(id,state), tokenHash, Date.now(), id, row.revision, hash).first();
      if (written) {if(accountId)await this.rememberAccount(id,'B',token,accountId);return { token, view: playerView(state, 'B', id, written.revision) };}
    }
    throw new GameError('The match changed while joining. Try again.', 409);
  }
  async preview(id, token, prompt) {
    const row = await this.row(id), seat = await this.seat(row, token);
    const state=await this.state(row);
    if(typeof prompt!=='string'||!prompt.trim()||prompt.trim().length>600)throw new GameError('Write one intention, up to 600 characters.');
    if(!playerView(state,seat,id,row.revision).canSubmit)throw new GameError('This seat cannot review a new intention right now.',409);
    try{return {...previewIntention(state,seat,prompt),interpreted:true};}catch(error){
      if(state.scenarioId!=='night-watch'||!(error instanceof GameError))throw error;
      if(!this.interpreter)return{interpreted:false,modelRequired:true,clarification:'The free-form interpreter is not connected yet. No time has passed and nothing is committed. You can describe a direct physical attempt, or return after language interpretation is enabled.'};
    }
    if(!state.joined||state.result||state.pending[seat])throw new GameError('This seat cannot review a new intention right now.',409);
    const plan=await this.interpreter({prompt,perspective:privateInterpretationContext(playerView(state,seat,id,row.revision))});
    if(plan?.clarification)return{interpreted:false,clarification:String(plan.clarification).slice(0,600)};
    const intent=compilePlan(state,seat,String(prompt).trim(),plan),reviewId=makeToken();
    state.preparedIntents||={};state.preparedIntents[seat]={reviewId,exchange:state.exchange,prompt:String(prompt).trim(),intent};
    const written=await this.db.prepare('UPDATE consequence_rooms SET state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING revision').bind(await this.storageState(id,state),Date.now(),id,row.revision).first();
    if(!written)throw new GameError('The match changed during interpretation. Review the intention again.',409);
    return{interpreted:true,reviewId,summary:intent.summary,minutes:Math.round(intent.duration*14400)/10,steps:intent.tasks.map(t=>({kind:t.kind,summary:t.summary,minutes:Math.round(t.duration*14400)/10})),warning:'This interpretation describes attempts. The world determines feasibility, resistance and who encounters the result.'};
  }
  async invitation(id,token){
    const invite=makeToken(),hash=await hashToken(invite);
    for(let attempt=0;attempt<5;attempt++){
      const row=await this.row(id),seat=await this.seat(row,token),state=await this.state(row);
      if(seat!=='A')throw new GameError('Only the host can replace the open-seat invitation.',403);
      if(state.joined||state.result||state.practice||row.seat_b_hash)throw new GameError('This match no longer has an open second seat.',409);
      const written=await this.db.prepare('UPDATE consequence_rooms SET invite_hash=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND seat_b_hash IS NULL RETURNING revision').bind(hash,Date.now(),id,row.revision).first();
      if(written)return{invite,view:playerView(state,seat,id,written.revision)};
    }
    throw new GameError('The match changed while preparing the invitation. Refresh and try again.',409);
  }
  async mutate(id, token, action) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const row = await this.row(id), seat = await this.seat(row, token), state = await this.state(row);
      const changed = action(state, seat);
      if (!changed) return playerView(state, seat, id, row.revision);
      if (state.practice && !state.result) {
        // Clearly labelled practice partner. It acts from its own discoveries; it receives
        // no access to A's notes, prompt or private evidence when choosing its intention.
        let guard = 0;
        while (state.setup?.phase!=='setup'&&expectedSeat(state) === 'B' && !state.pending.B && !state.result && guard++ < (state.turn?32:2)) {
          const prompt = practicePrompt(state);
          commitIntention(state, 'B', { exchange: state.exchange, requestId: `practice_${makeToken().slice(0,24)}`, prompt });
        }
      }
      const encoded = await this.storageState(id,state);
      const written = await this.db.prepare('UPDATE consequence_rooms SET state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING revision')
        .bind(encoded, Date.now(), id, row.revision).first();
      if (written) return playerView(state, seat, id, written.revision);
    }
    throw new GameError('The match changed while saving. Retry your existing request.', 409);
  }
  async commit(id, token, request) {
    let interpreted=null,snapshot=null;
    if(this.dialogue){
      const row=await this.row(id),seat=await this.seat(row,token),state=await this.state(row);
      if(state.turn&&!state.receipts[request.requestId]&&state.exchange===request.exchange&&playerView(state,seat,id,row.revision).canSubmit&&!/^(?:continue|end turn|pass turn)/i.test(request.prompt||'')){
        const prepared=request.reviewId?state.preparedIntents?.[seat]:null;
        if(request.reviewId&&(!prepared||prepared.reviewId!==request.reviewId||prepared.exchange!==request.exchange||prepared.prompt!==request.prompt))throw new GameError('That interpretation is stale. Review again.',409);
        const plan=structuredClone(prepared?.intent||parseCaseIntention(state,seat,request.prompt));
        for(const task of plan.tasks.filter(t=>t.kind==='ask'&&['N','D','S'].includes(t.to)).slice(0,1)){
          const k=state.npcKnowledge[task.to],role=state.environment.roles[task.to],p=person(state,task.to);
          try{task.dialogueReply=await this.dialogue({prompt:task.words,perspective:{name:namesFor(state)[task.to],role,goal:k.goal,account:k.account,condition:{alive:p.alive,energy:p.body.energy},heard:k.memory.slice(-8).map(m=>({from:namesFor(state)[m.from],words:m.words})),ownWork:task.to==='N'?{keyBorrower:k.keyBorrower?namesFor(state)[k.keyBorrower]:null}:null}});}catch{/* Existing situated replies remain available during AI failure. */}
        }
        if(plan.tasks.some(t=>t.dialogueReply)){interpreted={seat,intent:plan};snapshot={exchange:state.exchange,at:state.world.elapsedDays,serial:state.serial};}
      }
    }
    return this.mutate(id,token,(state,seat)=>{
      let action=request;
      if(interpreted&&interpreted.seat===seat&&snapshot.exchange===state.exchange&&snapshot.at===state.world.elapsedDays&&snapshot.serial===state.serial){
        const reviewId=makeToken();state.preparedIntents||={};state.preparedIntents[seat]={reviewId,exchange:state.exchange,prompt:String(request.prompt).trim(),intent:interpreted.intent};action={...request,reviewId};
      }
      return commitIntention(state,seat,action);
    });
  }
  async character(id,token,character){return this.mutate(id,token,(state,seat)=>configureCharacter(state,seat,character));}
  async ready(id,token){return this.mutate(id,token,(state,seat)=>confirmSetup(state,seat));}
  async notes(id, token, text, baseText=undefined) {
    if (typeof text !== 'string' || text.length > 4000) throw new GameError('Keep private notes within 4,000 characters.');
    if(baseText!==undefined&&(typeof baseText!=='string'||baseText.length>4000))throw new GameError('The saved note reference is invalid.');
    return this.mutate(id, token, (state, seat) => {
      if (state.notes[seat] === text) return false;
      if(baseText!==undefined&&state.notes[seat]!==baseText)throw new GameError('Your saved note changed on another device. Your local draft is kept. Choose which version to keep.',409);
      state.notes[seat] = text; return true;
    });
  }
  async resign(id,token){
    return this.mutate(id,token,(state,seat)=>resignState(state,seat));
  }
  async rememberAccount(id,seat,token,accountId){
    await this.db.prepare('INSERT OR IGNORE INTO consequence_seat_keys (key_hash,room_id,seat,account_id,created_at) VALUES (?,?,?,?,?)').bind(await hashToken(token),id,seat,accountId,Date.now()).run();
  }
  async listAccount(accountId){
    if(!accountId)return[];
    const rows=await this.db.prepare('SELECT DISTINCT r.id,k.room_id,k.seat,r.state,r.revision,r.updated_at FROM consequence_seat_keys k JOIN consequence_rooms r ON r.id=k.room_id WHERE k.account_id=? ORDER BY r.updated_at DESC LIMIT 12').bind(accountId).all();
    const sessions=[];
    for(const row of rows.results){const s=await this.state(row),v=playerView(s,row.seat,row.room_id,row.revision);sessions.push({id:row.room_id,seat:row.seat,name:v.name,title:v.scenario.title,practice:!!s.practice,ended:!!s.result});}
    return sessions;
  }
  async recover(accountId,id,seat){
    if(!accountId)throw new GameError('Sign in to recover an account-linked seat.',401);
    if(!['A','B'].includes(seat))throw new GameError('Choose an existing player seat.');
    const link=await this.db.prepare('SELECT key_hash FROM consequence_seat_keys WHERE room_id=? AND seat=? AND account_id=? LIMIT 1').bind(id,seat,accountId).first();
    if(!link)throw new GameError('That seat is not linked to your signed-in account.',403);
    const key=makeToken();await this.rememberAccount(id,seat,key,accountId);
    return{token:key,view:await this.read(id,key)};
  }
}
