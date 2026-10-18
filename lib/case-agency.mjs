import {NAMES, namesFor,MINUTE,person,visible,reachable,entry} from './case-world.mjs';
import {conscious,bodyState} from './case-life.mjs';
import {acquire} from './case-communication.mjs';
import {observationEfficiency} from './character-model.mjs';

// Attention is supported activity over physical time, not a new reservoir or bonus.
// The coefficients are app calibration; source reconciliation is in docs/SITUATED_AGENCY.md.
export function attentionRate(p){
  if(!conscious(p))return 0;
  const a=p.apparatus,b=p.body;
  return Math.max(0,Math.min(1,a.attention))*Math.max(0,Math.min(1,a.receptor))*Math.sqrt(Math.max(0,b.energy*b.water))*Math.max(0,b.integrity);
}
export function advanceAttention(s,seat,t,dtDays){
  if(!t||!['inspect','focus','purpose','self_account'].includes(t.kind))return;
  t.attentionTracked=true;t.attentionWork??=0;t.attentionElapsed??=0;t.attentionElapsed+=dtDays;
  const target=t.target,accessible=!target||(t.kind==='inspect'?reachable(s,seat,target):visible(s,seat,target));
  if(accessible)t.attentionWork+=attentionRate(person(s,seat))*dtDays/MINUTE*(t.kind==='inspect'?observationEfficiency(s,seat,target):1);
}
export function hasInspectionAttention(s,seat,t){return (t.attentionTracked?t.attentionWork:attentionRate(person(s,seat))*t.duration/MINUTE)>=1-1e-10;}
function selfState(s,seat){s.agency||={};return s.agency[seat]||=( {purpose:null,selfAccount:null,reflections:[],presentations:[],attention:[]} );}
function retainedAnchors(s,seat,words){
  const p=person(s,seat);return Object.entries(namesFor(s)).filter(([id,name])=>id!==seat&&p.known.has(id)&&new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(words)).map(([id])=>id);
}
export function completeAgencyTask(s,seat,t){
  if(t.kind==='purpose'||t.kind==='self_account'){
    const work=t.attentionTracked?t.attentionWork:attentionRate(person(s,seat))*t.duration/MINUTE;
    if(work<.15){entry(s,[seat],'consequence','You cannot sustain this reflection under your present condition. Your earlier account remains.');return true;}
    const a=selfState(s,seat),r={id:`reflection:${++s.serial}`,kind:t.kind,text:t.words,at:s.world.elapsedDays,anchors:retainedAnchors(s,seat,t.words)};
    a.reflections.push(r);a[t.kind==='purpose'?'purpose':'selfAccount']=r;
    entry(s,[seat],'private',t.kind==='purpose'?`Your present purpose: ${t.words}. Your original game objective remains the same.`:`Your account of yourself: ${t.words}. This is your account; other people retain their own encounters.`);return true;
  }
  if(t.kind!=='focus')return false;
  const work=t.attentionTracked?t.attentionWork:attentionRate(person(s,seat))*t.duration/MINUTE;
  if(!visible(s,seat,t.target)||work<.2){entry(s,[seat],'consequence',`You cannot sustain a current observation of ${namesFor(s)[t.target]}. A remembered person or place is not current access.`);return true;}
  const a=selfState(s,seat),f=person(s,t.target),r={target:t.target,at:s.world.elapsedDays,position:{...f.pos},source:'direct_attention',status:f.kind==='person'?bodyState(f):null};
  a.attention.push(r);
  if(f.kind==='person'){
    const text=`While watching, you encounter ${namesFor(s)[t.target]} ${r.status} at this position. This does not establish their thoughts or the beginning of an earlier event.`;
    acquire(s,seat,{root:`attention:${t.target}:${++s.serial}`,version:1,title:`Watching ${namesFor(s)[t.target]}`,text,category:'observation'},'direct');entry(s,[seat],'observation',text);
  }else entry(s,[seat],'observation',`You keep ${namesFor(s)[t.target]} in attention. Its presence is encountered; close inspection is still needed to acquire fine marks or writing.`);
  return true;
}
export function introductionRecord(s,seat,words){return {root:`identity-claim:${++s.serial}`,version:1,title:`${namesFor(s)[seat]}’s introduction`,text:words,category:'identity_claim',producer:seat};}
export function retainPresentation(s,seat,to,record,reached){selfState(s,seat).presentations.push({root:record.root,words:record.text,to,reached,at:s.world.elapsedDays});}

export function agencyView(s,seat){
  const a=s.agency?.[seat],p=person(s,seat),projection=p.willProjection;
  return {purpose:a?.purpose?{text:a.purpose.text,anchors:a.purpose.anchors.map(id=>({id,name:namesFor(s)[id]}))}:null,selfAccount:a?.selfAccount?.text||null,
    reflections:(a?.reflections||[]).map(r=>({kind:r.kind,text:r.text})),
    presentations:(a?.presentations||[]).map(r=>({words:r.words,to:namesFor(s)[r.to],reached:r.reached})),
    lastAttention:a?.attention.at(-1)?{name:namesFor(s)[a.attention.at(-1).target],at:a.attention.at(-1).at}:null,
    encounteredConduct:(s.encounters?.[seat]||[]).filter(e=>e.actor===seat&&e.mode==='direct').map(e=>({text:e.text,source:e.root})).slice(-8),
    heardClaims:s.discoveries[seat].filter(d=>d.category==='identity_claim').map(d=>({text:d.text,source:namesFor(s)[d.source]||null})),
    heldPossibility:projection?{target:namesFor(s)[projection.target]||'an encountered configuration',status:projection.status}:null};
}
