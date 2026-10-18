import { createState, packForStorage, unpackFromStorage, playerView, previewIntention, commitIntention, expectedSeat, practicePrompt, resignState, GameError } from './game.mjs';
import { encodeWorld } from './world-codec.mjs';
import {configureCharacter,confirmSetup,configurePractice} from './game-setup.mjs';

const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');

// Device-only practice. This adapter is never a source of online match state.
// Its storage is separate from both the website and the production database.
export class LocalPractice {
  /** @param {{get:Function,put:Function}} store */
  constructor(store) { this.store=store; this.queues=new Map(); }
  async save(row,state){
    const encoded=typeof CompressionStream==='function'?await packForStorage(state):JSON.stringify(encodeWorld(state));
    await this.store.put({...row,encoded});
  }
  async load(id,key){
    const row=await this.store.get(id);
    if(!row)throw new GameError('This practice save is no longer on this device.',404);
    if(row.token!==key)throw new GameError('This key does not belong to this practice save.',403);
    return{row,state:await unpackFromStorage(row.encoded)};
  }
  serial(id,operation){
    const previous=this.queues.get(id)||Promise.resolve(),next=previous.catch(()=>{}).then(operation);
    this.queues.set(id,next);
    const cleanup=()=>{if(this.queues.get(id)===next)this.queues.delete(id);};
    next.then(cleanup,cleanup);return next;
  }
  async flush(){await Promise.allSettled(this.queues.values());}
  async mutate(id,key,change){
    return this.serial(id,async()=>{
      const {row,state}=await this.load(id,key);
      if(!change(state))return{view:playerView(state,'A',id,row.revision)};
      let guard=0;
      while(state.setup?.phase!=='setup'&&!state.result&&expectedSeat(state)==='B'&&!state.pending.B&&guard++<(state.turn?32:2))commitIntention(state,'B',{exchange:state.exchange,prompt:practicePrompt(state),requestId:`practice_${token().slice(0,24)}`});
      row.revision++;await this.save(row,state);
      return{view:playerView(state,'A',id,row.revision)};
    });
  }
  /** @param {string} action @param {any} [data] @param {string} [key] */
  async request(action,data={},key=''){
    if(action==='list')return{sessions:[],signedIn:false};
    if(action==='attach')return{linked:false};
    if(action==='create'){
      if(data.practice!==true)throw new GameError('Multiplayer currently opens in the online game.');
      const id=token().slice(0,24),playerToken=token(),state=createState({seed:crypto.getRandomValues(new Uint32Array(1))[0],setup:data.setup||null});
      configurePractice(state);
      const row={id,token:playerToken,revision:0};await this.save(row,state);
      return{token:playerToken,invite:null,view:playerView(state,'A',id,0)};
    }
    if(action==='read'){const {row,state}=await this.load(data.id,key);return{view:playerView(state,'A',data.id,row.revision)};}
    if(action==='preview'){
      const {state}=await this.load(data.id,key);
      if(typeof data.prompt!=='string'||!data.prompt.trim()||data.prompt.trim().length>600)throw new GameError('Write one intention, up to 600 characters.');
      if(!playerView(state,'A',data.id).canSubmit)throw new GameError('This seat cannot review a new intention right now.',409);
      try{return{preview:{...previewIntention(state,'A',data.prompt),interpreted:true}};}
      catch(error){if(!(error instanceof GameError))throw error;return{preview:{interpreted:false,modelRequired:true,clarification:'This wording could not be interpreted in on-device practice. No turn was used. The connected language interpreter will be available in the online game once enabled.'}};}
    }
    if(action==='commit')return this.mutate(data.id,key,s=>commitIntention(s,'A',data));
    if(action==='character')return this.mutate(data.id,key,s=>configureCharacter(s,'A',data.character));
    if(action==='ready')return this.mutate(data.id,key,s=>confirmSetup(s,'A'));
    if(action==='notes'){
      if(typeof data.text!=='string'||data.text.length>4000)throw new GameError('Keep private notes within 4,000 characters.');
      if(data.baseText!==undefined&&(typeof data.baseText!=='string'||data.baseText.length>4000))throw new GameError('The saved note reference is invalid.');
      return this.mutate(data.id,key,s=>{if(s.notes.A===data.text)return false;if(data.baseText!==undefined&&s.notes.A!==data.baseText)throw new GameError('Your saved note changed. Your local draft is kept. Choose which version to keep.',409);s.notes.A=data.text;return true;});
    }
    if(action==='resign')return this.mutate(data.id,key,s=>resignState(s,'A'));
    throw new GameError('This action belongs to an online match.');
  }
}
