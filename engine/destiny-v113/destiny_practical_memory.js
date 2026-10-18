// DESTINY v1.02 — PRACTICAL TRACE / HABITUAL CONDUCTANCE
//
// SOURCE-GROUNDED LAW
// - Light & Chaos: repeated actions that secure being become habits, making later action more efficient
//   and affirming a way the world "is and can be dealt with".
// - Collapse into Form / Repetition: repeated collapse can become an internalised groove; repetition can
//   reveal the system but can also narrow freedom. A habit is therefore retained conductance, not truth.
// - Praxis v1.01: Reality must first answer an attempt. Practical memory may only be written from committed
//   episodes; it cannot pre-author an unexperienced solution.
//
// ENGINE LAW
// Practical memory stores low-level familiarity with a structurally similar impasse. It can make a later
// Praxis system recognise/reopen an already-available revision route sooner. It cannot create a target,
// Force, material coupling, semantic recipe, profession, Tool, or guaranteed success.
//
// Engineering inference: situation signatures, familiarity/efficacy update equations and threshold scaling.

import {clamp} from './destiny_unified_kernel.js';
import {formRadius} from './destiny_embodied_geometry.js';

const deep=x=>JSON.parse(JSON.stringify(x));

export function ensurePracticalMemory(p){
  if(!Array.isArray(p.practicalTraces))p.practicalTraces=[];
  if(!Array.isArray(p.practicalHistory))p.practicalHistory=[];
}

function bin(x,cuts){for(let i=0;i<cuts.length;i++)if(x<cuts[i])return i;return cuts.length;}

export function practicalSituationSignature(w,p,cf,blockerId){
  const b=w.forms.get(blockerId);if(!b)return null;
  const relation=cf?.configuration?.edges?.[0]?.relation||'contact';
  const phase=cf?.phase||'unknown';
  const cls=(b.kind==='person'||b.kind==='animal')?'living':'matter';
  const envelope=Math.max(.08,formRadius(p));
  const sizeRatio=formRadius(b)/envelope;
  const rigidity=b.rigidity??b.material?.rigidity??0;
  const permeability=b.permeability??b.material?.permeability??1;
  return `${relation}|${phase}|${cls}|sz${bin(sizeRatio,[.7,1.25,2.2])}|rg${bin(rigidity,[.35,.7])}|pm${bin(permeability,[.2,.55])}`;
}

export function practicalConductance(p,signature){
  ensurePracticalMemory(p);if(!signature)return {familiarity:0,efficacy:0,exposures:0};
  const t=p.practicalTraces.find(x=>x.signature===signature);
  if(!t)return {familiarity:0,efficacy:0,exposures:0};
  return {familiarity:clamp(t.familiarity||0),efficacy:Math.max(-1,Math.min(1,t.efficacy||0)),exposures:t.exposures||0};
}

export function retainPracticalEpisode(w,p,ep,record){
  ensurePracticalMemory(p);
  const signatures=[...new Set(ep.situationSignatures||[])].filter(Boolean);
  const changed=[];
  for(const signature of signatures){
    let t=p.practicalTraces.find(x=>x.signature===signature);
    if(!t){t={signature,exposures:0,successes:0,failures:0,familiarity:0,efficacy:0,lastDay:w.elapsedDays};p.practicalTraces.push(t);}
    const before=deep(t);t.exposures++;
    if(record.success)t.successes++;else t.failures++;
    const progress=clamp(1-(record.bestDiscrepancy??1));
    // Familiarity can grow even through failure: this is the source's double edge of habit/repetition.
    const famGain=.11+.07*progress+(record.success?.10:.025);
    t.familiarity=clamp((t.familiarity||0)+famGain*(1-(t.familiarity||0)*.55));
    const outcome=record.success?1:(progress>.12?progress*.45:-.18);
    t.efficacy=((t.efficacy||0)*(t.exposures-1)+outcome)/t.exposures;
    t.meanRevisions=((t.meanRevisions||0)*(t.exposures-1)+(record.revisions||0))/t.exposures;
    t.lastDay=w.elapsedDays;
    changed.push({signature,before,after:deep(t)});
  }
  p.practicalTraces.sort((a,b)=>(b.familiarity||0)-(a.familiarity||0));
  if(p.practicalTraces.length>96)p.practicalTraces.splice(96);
  for(const c of changed)p.practicalHistory.push({clock:w.clock,type:'practical_trace_update',...c});
  if(p.practicalHistory.length>220)p.practicalHistory.splice(0,p.practicalHistory.length-220);
  return changed;
}

export function practicalMemoryAudit(w){
  const ps=[...w.forms.values()].filter(f=>f.kind==='person');
  const traces=ps.flatMap(p=>p.practicalTraces||[]),hist=ps.flatMap(p=>p.practicalHistory||[]);
  return {peopleWithTraces:ps.filter(p=>(p.practicalTraces||[]).length).length,traces:traces.length,
    meanFamiliarity:traces.length?traces.reduce((s,t)=>s+(t.familiarity||0),0)/traces.length:0,
    successfulEvidence:traces.filter(t=>(t.successes||0)>0).length,failedOnlyGrooves:traces.filter(t=>(t.failures||0)>0&&!(t.successes||0)).length,
    updates:hist.filter(e=>e.type==='practical_trace_update').length,
    storedSkillStats:ps.filter(p=>Object.prototype.hasOwnProperty.call(p,'skill')||Object.prototype.hasOwnProperty.call(p,'habitSkill')).length};
}
