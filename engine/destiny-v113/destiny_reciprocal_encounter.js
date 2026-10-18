// DESTINY v1.07 — RECIPROCAL ENCOUNTER / RELATIONAL ACTUALITY
//
// Acknowledgement can be unilateral. Reciprocal encounter is a stricter event: two finite Persons
// are simultaneously accessible to one another inside a close relational aperture and the encounter
// activates actual structural potency. The engine does not call this conversation, affection, threat,
// friendship, touch, trade or cooperation. Those are possible retrospective descriptions of later
// trajectories, not causal primitives.
//
// The event is non-directional by default. Reciprocal presence can deepen acknowledgement and
// representation-level relational history; it does not by itself create Physical consequence,
// benefit/harm or forced movement.

import {Person,clamp,relationalPotencyActivation} from './destiny_unified_kernel.js';

const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const key=(a,b)=>[a,b].sort().join('|');
const dist=(a,b)=>Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));

function accessState(w,a,b){return w._accessState?.get(`${a}|${b}`)||{active:false,access:0,distance:Infinity};}
function currentState(w,a,b){return w._reciprocalEncounterState?.get(key(a,b))||null;}

export function reciprocalEncounterProcesses(w,s){
  const out=[],people=[...w.forms.values()].filter(f=>f instanceof Person&&f.alive).sort((a,b)=>a.id.localeCompare(b.id));
  for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
    const a=people[i],b=people[j],as=s.forms.get(a.id),bs=s.forms.get(b.id);if(!as||!bs)continue;
    const ab=accessState(w,a.id,b.id),ba=accessState(w,b.id,a.id),d=dist(as.pos,bs.pos),prev=currentState(w,a.id,b.id);
    const mutual=!!(ab.active&&ba.active),close=d<=1.35;
    let active=mutual&&close;
    let magnitude=0,activationA=0,activationB=0;
    if(active){
      const aa=relationalPotencyActivation(w,a,b),bb=relationalPotencyActivation(w,b,a);activationA=aa.meanActivation;activationB=bb.meanActivation;
      const mutualAccess=Math.min(ab.access||0,ba.access||0),proximity=clamp(1-d/1.35);
      magnitude=clamp(avg([activationA,activationB])*.58+mutualAccess*.24+proximity*.18);
      // reciprocal presence with effectively no activated structure is not promoted into an event.
      if(magnitude<.025)active=false;
    }
    if(active&&!prev?.active){out.push({type:'reciprocal_encounter',phase:'open',actors:[a.id,b.id],magnitude,distance:d,mutualAccess:Math.min(ab.access||0,ba.access||0),activation:{[a.id]:activationA,[b.id]:activationB}});continue;}
    // Continuous variation inside an already-open encounter is state, not a new ontological event.
    // Only opening/closing the reciprocal configuration creates a new encounter Moment.
    if(active&&prev?.active)continue;
    if(!active&&prev?.active)out.push({type:'reciprocal_encounter',phase:'close',actors:[a.id,b.id],magnitude:clamp((prev.magnitude||0)*.35),distance:d,mutualAccess:0,activation:{[a.id]:0,[b.id]:0}});
  }
  return out;
}

export function commitReciprocalEncounterProcesses(w,processes=[],emit=x=>x){
  if(!w._reciprocalEncounterState)w._reciprocalEncounterState=new Map();
  const events=[];
  for(const p of processes||[]){
    const [a,b]=[...(p.actors||[])].sort();if(!a||!b)continue;const k=key(a,b);
    const e=emit({type:`reciprocal_encounter_${p.phase}`,actor:a,target:b,actors:[a,b],magnitude:p.magnitude,distance:p.distance,mutualAccess:p.mutualAccess,activation:p.activation,
      relational:true,benefit:0,harm:0,semantic:false});
    events.push(e);
    if(p.phase==='close')w._reciprocalEncounterState.set(k,{active:false,magnitude:0,distance:p.distance,mutualAccess:0,clock:w.clock});
    else w._reciprocalEncounterState.set(k,{active:true,magnitude:p.magnitude,distance:p.distance,mutualAccess:p.mutualAccess,clock:w.clock});
  }
  return events;
}

export function reciprocalEncounterAudit(w){
  const states=[...(w._reciprocalEncounterState?.values?.()||[])],events=(w.actualHistory||[]).filter(e=>String(e.type||'').startsWith('reciprocal_encounter_'));
  return {states:states.length,activeStates:states.filter(x=>x.active).length,events:events.length,
    semanticKindsAbsent:events.every(e=>e.semantic===false&&!['friend','enemy','love','trade','conversation','fight','help'].includes(e.type)),
    neutralByDefault:events.every(e=>(e.benefit||0)===0&&(e.harm||0)===0),
    grounded:events.every(e=>Array.isArray(e.actors)&&e.actors.length===2&&Number.isFinite(e.distance)&&Number.isFinite(e.magnitude))};
}
