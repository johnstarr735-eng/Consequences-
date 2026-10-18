import * as legacy from './simulation.mjs';
import * as current from './case-simulation.mjs';
import { encodeWorld,decodeWorld } from './world-codec.mjs';
import {createConfiguredState} from './game-setup.mjs';
export { GameError } from './simulation.mjs';
const isCase=s=>s.scenarioId==='night-watch';
export function createState({scenario='night-watch',seed=1,setup=null,recipe=null}={}){return scenario==='last-entry'?legacy.createState():setup?createConfiguredState(seed,setup,recipe):current.createCaseState(seed);}
export function playerView(s,...args){return isCase(s)?current.caseView(s,...args):legacy.playerView(s,...args);}
export function previewIntention(s,...args){return isCase(s)?current.previewCase(s,...args):legacy.previewIntention(s,...args);}
export function commitIntention(s,...args){return isCase(s)?current.commitCase(s,...args):legacy.commitIntention(s,...args);}
export function expectedSeat(s){return isCase(s)?current.expectedSeat(s):legacy.expectedSeat(s);}
export function resignState(state,seat){
  if(state.result)return false;
  const name=state.names?.[seat]||(seat==='A'?'Mara':'Jonah');
  state.result={winners:[],reason:`${name} resigned before a case was established. The match is closed; neither starting goal is awarded without its evidence.`,exchange:state.exchange,ending:'resigned',resigned:seat};
  state.pending={};return true;
}
export function practicePrompt(s){
  if(isCase(s))return current.practicePrompt(s);
  const b=legacy.playerView(s,'B','practice');return !b.discoveries.some(d=>d.root==='docket')?'Read counterfoil':!s.signals.some(e=>e.producer==='B'&&e.root==='docket')?'Share counterfoil with Mara':'Wait';
}
export async function packForStorage(s){
  const text=JSON.stringify(encodeWorld(s,{compact:isCase(s)}));if(!isCase(s))return text;
  const stream=new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return 'cq2:gzip:'+btoa(binary);
}
export async function unpackFromStorage(text){
  if(!text.startsWith('cq2:gzip:'))return legacy.unpackState(text);
  const binary=atob(text.slice(9)),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const json=await new Response(stream).text();if(json.length>32_000_000)throw new Error('World save exceeds supported size');
  return decodeWorld(JSON.parse(json));
}
