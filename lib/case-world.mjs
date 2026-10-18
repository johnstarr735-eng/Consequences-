import {createEnvironmentWorld} from './environment-model.mjs';
import {nightWatchDefinition,NIGHT_WATCH_NAMES,NIGHT_WATCH_MATERIAL_POSITIONS} from './night-watch-profile.mjs';
import {initializeEnvironment} from './case-environment.mjs';
import {conscious,canSpeak} from './case-life.mjs';
import { World, Person, Form } from '../engine/destiny-v113/destiny_unified_kernel.js';
import { initializeWorldTime, deriveWorldConditions, snapshotReality, accessibilityPhase } from '../engine/controlled-moment-engine.js';
import { distance, reachRadius, formRadius } from '../engine/scene-geometry.js';
import { GameError } from './simulation.mjs';
import {nameKey,TARGET_ALIASES} from './name-resolution.mjs';

export const MINUTE = 1 / 1440;
export const NAMES = NIGHT_WATCH_NAMES;
export const namesFor = s => s.names || NAMES;
export const NPC_IDS = ['N', 'D', 'S'];
export const HUMAN_IDS = ['A', 'B'];
export const inhabitantIds = s => [...HUMAN_IDS,...NPC_IDS,...(s.environment?['P']:[])];
export const nonPlayerIds = s => inhabitantIds(s).filter(id=>!HUMAN_IDS.includes(id));
export const CASE = {
  id: 'night-watch', title: 'The Night Watch', subtitle: 'A death at the observatory. Three witnesses. Two competing accounts.',
  goal: 'Be first to establish who killed Rowan, supported by acquired evidence.',
  rules: 'Name the killer and lodge your case at the case desk. Your acquired trace records are attached automatically. You need three different original sources covering access to the scene, the material means, and the timeline; at least two must be inspected firsthand. Testimony and shared copies keep their original sources. The first valid case wins; valid cases established at the same in-world time draw. The match closes after 30 exchanges or three simulated hours. Resigning closes the match without awarding an unearned goal to either player. The closed-case debrief reveals the prior events to both players.',
  maxExchanges: 30,
};
const artifactPositions = NIGHT_WATCH_MATERIAL_POSITIONS;

export function entry(state, audience, kind, text, extra = {}) {
  const e = { id: `case:${++state.serial}`, audience: [...new Set(audience)], kind, text, exchange: state.exchange, at: state.world.elapsedDays, ...extra };
  state.entries.push(e); return e;
}
export function person(state, id) { return state.world.forms.get(id); }
export function visible(state, observer, target) {
  const a=person(state,observer), b=person(state,target);
  // Retained knowledge survives incapacity; current sensory access does not.
  if(!conscious(a))return false;
  const radius=3+Math.floor((a?.apparatus?.receptor||0)*2)+.45;
  if(b&&!b.alive&&b._matterReturned){const carrier=[...state.world.forms.values()].find(f=>f.alive&&f.id.startsWith(`remains:${target}:`));return !!(carrier&&a?.alive&&state.world._accessState?.get(`${observer}|${carrier.id}`)?.active&&distance(a.pos,carrier.pos)<=radius);}
  return !!(a?.alive && b?.alive && (observer===target || (state.world._accessState?.get(`${observer}|${target}`)?.active&&distance(a.pos,b.pos)<=radius)));
}
export function reachable(state, observer, target) {
  const a=person(state,observer), b=person(state,target);
  return !!(a?.alive && (b?.alive||b?._matterReturned) && visible(state,observer,target) && distance(a.pos,b.pos)<=reachRadius(a)+formRadius(b)+.04);
}
export function hears(state, from, to) {
  const a=person(state,from), b=person(state,to);
  return !!(canSpeak(a) && conscious(b) && distance(a.pos,b.pos)<=2.1 && b.apparatus?.receptor>.1);
}
export function observers(state, actor) { return HUMAN_IDS.filter(s=>s!==actor && visible(state,s,actor)); }
export function refreshAccess(state) { accessibilityPhase(state.world,snapshotReality(state.world)); }
export function rootForCarrier(state, carrier) { return state.patterns[carrier]?.root || carrier; }

export function createCaseState(seed = 1) {
  const chosen=Math.abs(Math.trunc(Number(seed)||1)); const culprit=NPC_IDS[chosen%3];
  const coats={N:'blue wool',D:'green cotton',S:'red linen'};
  const world=createEnvironmentWorld(nightWatchDefinition(),{seed:chosen});
  initializeWorldTime(world,{dtDays:MINUTE/2});deriveWorldConditions(world);accessibilityPhase(world,snapshotReality(world));
  const patterns={
    register:{root:'register',title:'Service-key register',text:`Last night, 20:03 — ${NAMES[culprit]} signed out the map-room service key. The key was returned at 20:26.`,category:'access',event:'prior:key',supports:culprit,version:1},
    clock:{root:'clock',title:'Signal-room log',text:'20:16–20:19 — The automatic call recorder captured the map-room clock striking once, a heavy impact, then footsteps leaving by the open court. The recorder’s time mark is 20:17.',category:'timeline',event:'prior:impact',supports:culprit,version:1},
    weight:{root:'weight',title:'Marks on the brass weight',text:`A fresh dent carries a strand of ${coats[culprit]}. Its narrow edge matches the visible impression beside Rowan’s temple. The same fabric is visible on ${NAMES[culprit]}'s coat.`,category:'means',event:'prior:weight',supports:culprit,version:1},
    body:{root:'body',title:'Rowan’s visible injuries',text:'There is a single narrow-edged impression beside the temple. Rowan’s broken watch is stopped at 20:17. These are observable marks, rather than a medical determination of the precise time of death.',category:'timeline',event:'prior:body',supports:culprit,version:1},
    manifest:{root:'manifest',title:'Cargo tally',text:`The stores list records the brass weight missing between 19:50 and 20:30. ${NAMES[culprit]} countersigned the correction that morning. A countersignature alone does not establish a killing.`,category:'access',event:'prior:cargo',supports:culprit,version:1},
    noteA:{root:'noteA:blank',title:'Unmarked paper',text:'This sheet has no inscription.',category:null,event:null,version:0},
    noteB:{root:'noteB:blank',title:'Unmarked paper',text:'This sheet has no inscription.',category:null,event:null,version:0},
  };
  const npcKnowledge={};
  for(const id of NPC_IDS){
    const innocent=id!==culprit;
    npcKnowledge[id]={goal:id==='N'?'preserve records and prevent an unsupported accusation':id==='D'?'keep her account intact and get a fair hearing':'avoid being detained on a rumour',
      wasCulprit:!innocent,heardImpact:true,heldKey:!innocent,
      account:innocent?`${NAMES[id]} remembers the impact after the single clock strike. The court was open. Nobody’s voice identified the person who struck Rowan.`:`${NAMES[id]} claims to have been away from the map room before the clock struck.`,
      keyBorrower:id==='N'?culprit:null,memory:[],promises:{},breaches:[],seenRoots:[],lastReaction:null};
  }
  const state={format:4,scenarioId:CASE.id,world,startedAt:world.elapsedDays,exchange:1,serial:0,joined:false,pending:{},receipts:{},entries:[],signals:[],discoveries:{A:[],B:[]},notes:{A:'',B:''},history:[],result:null,
    patterns,originalPatterns:Object.fromEntries(Object.values(patterns).filter(p=>p.event).map(p=>[p.root,{...p}])),npcKnowledge,commitments:{A:[],B:[]},evidenceReviews:{A:[],B:[]},locations:artifactPositions,
    actuality:{culprit,method:'brass weight',at:'previous night, 20:17',events:[{id:'prior:key',actor:culprit},{id:'prior:impact',actor:culprit},{id:'prior:weight',actor:culprit},{id:'prior:body',actor:culprit},{id:'prior:cargo',actor:culprit}]}};
  initializeEnvironment(state);refreshAccess(state);
  entry(state,HUMAN_IDS,'opening','Rowan was found in the observatory after last night’s watch. By noon, three incompatible accounts have spread through the court. Mara and Jonah have each been asked to establish the killing before the afternoon inquiry closes.');
  entry(state,['A'],'private','You arrived through the west court. Nell mentioned a service-key register. That is a lead, not proof. Jonah has received a different starting briefing.');
  entry(state,['B'],'private','You arrived through the east court. Ada mentioned the signal recorder and a weight in the north court. That is a lead, not proof. Mara has received a different starting briefing.');
  return state;
}

export function resolveName(state, seat, raw) {
  const normal=nameKey;
  const text=normal(raw);
  const aliases=Object.fromEntries(Object.entries(TARGET_ALIASES).map(([id,words])=>[id,[...words]]));
  for(const [id,name] of Object.entries(namesFor(state)))(aliases[id]||=[]).push(normal(name));
  if(/\bmy (?:phone|handset)\b|^phone$|^handset$/.test(text)){const id=`phone${seat}`;if(person(state,id))return id;}
  if(/\b(my|blank|writing) paper\b|^paper$|\bmy sheet\b/.test(text))return seat==='A'?'noteA':'noteB';
  if(/\bmy pen\b|^pen$/.test(text))return seat==='A'?'penA':'penB';
  let best=null, length=0;
  for(const [id, words] of Object.entries(aliases))for(const word of words)if((` ${text} `).includes(` ${word} `)&&word.length>length){best=id;length=word.length;}
  if(!best||(!visible(state,seat,best)&&!person(state,seat).known.has(best)))throw new GameError('Name a person or object you have encountered. You can use the surroundings or known-places list.');
  return best;
}
