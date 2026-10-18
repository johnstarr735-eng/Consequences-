// DESTINY v1.04.4 — THREE REALITIES AS REPRESENTATIONS OF ONE CONDITION
//
// v1.04.3 correctly separated Consciousness / Mental / Physical as distinct realities, but its
// `truthByReality` interface risked treating them as three independent truths. v1.04.4 corrects this:
// every modeled Form has ONE situated condition and that condition is represented differently in
// all three realities. Acknowledgement changes legibility/retention of a representation, not the
// underlying condition itself.

import {Person} from './destiny_unified_kernel.js';
import {contextualConditionRealityMap,REALITY_FIELDS,CONDITION_BRANCHES} from './destiny_condition_realities.js';

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);

export const ACKNOWLEDGEMENT_FIELDS=REALITY_FIELDS;
export const HOLOGRAPHIC_BRANCHES=CONDITION_BRANCHES;

function triadMean(reps){
  return {ground:clamp(avg(reps.map(x=>x?.triad?.ground??0))),order:clamp(avg(reps.map(x=>x?.triad?.order??0))),process:clamp(avg(reps.map(x=>x?.triad?.process??0)))};
}
function unboundMentalRepresentations(w,participants=[],conditionMap={}){
  const out=[],allowed=new Set(participants),knownForms=new Set(Object.keys(conditionMap));
  for(const p of w?.forms?.values?.()||[]){
    if(!(p instanceof Person)||!p.alive||(allowed.size&&!allowed.has(p.id)))continue;
    for(const [target,k] of p.known||[])if(!knownForms.has(target))out.push({observer:p.id,target,kind:'known',confidence:clamp(k?.confidence??0),direct:!!k?.direct,referentPresent:false});
    if(p.willProjection?.target&&!knownForms.has(p.willProjection.target))out.push({observer:p.id,target:p.willProjection.target,kind:'will_projection',confidence:clamp(p.willProjection.commitment??0),referentPresent:false});
    if(p.counterfactualProjection?.target&&!knownForms.has(p.counterfactualProjection.target))out.push({observer:p.id,target:p.counterfactualProjection.target,kind:'counterfactual_projection',confidence:clamp(p.counterfactualProjection.confidence??.3),referentPresent:false});
  }
  return out;
}
function representationList(map,reality){
  return Object.values(map).map(x=>({form:x.form,conditionRef:x.condition.form,representation:x.representations[reality]}));
}

export function contextualAcknowledgementFields(w,s,{participants=[],processes=[],events=[],fieldContexts={},superpositions={},label='local'}={}){
  const mapped=contextualConditionRealityMap(w,s,{participants,events,superpositions});
  const consciousnessForms=representationList(mapped.byForm,'consciousness');
  const mentalForms=representationList(mapped.byForm,'mental');
  const physicalForms=representationList(mapped.byForm,'physical');
  const unboundMental=unboundMentalRepresentations(w,participants,mapped.byForm);
  const fields={
    consciousness:{id:'ack:consciousness',reality:'consciousness',kind:'reality_representation_field',represented:consciousnessForms.length>0,
      triad:triadMean(consciousnessForms.map(x=>x.representation)),representations:consciousnessForms,
      evidence:{formCount:consciousnessForms.length,acknowledgedCount:consciousnessForms.filter(x=>(x.representation.acknowledgement?.level||0)>0).length},
      truths:{forms:consciousnessForms,liveHorizons:consciousnessForms.flatMap(x=>x.representation.acknowledgement?.horizons||[])},
      meta:{truthMode:'presence/possibility',allFormsRepresented:true,conditionPrimary:true}},
    mental:{id:'ack:mental',reality:'mental',kind:'reality_representation_field',represented:mentalForms.length>0,
      triad:triadMean(mentalForms.map(x=>x.representation)),representations:mentalForms,unboundRepresentations:unboundMental,
      evidence:{formCount:mentalForms.length,acknowledgedCount:mentalForms.filter(x=>(x.representation.acknowledgement?.level||0)>0).length,unboundCount:unboundMental.length},
      truths:{forms:mentalForms,known:mentalForms.flatMap(x=>(x.representation.acknowledgement?.evidence||[]).filter(e=>e.kind==='known')),
        projections:[...mentalForms.flatMap(x=>(x.representation.acknowledgement?.evidence||[]).filter(e=>String(e.kind||'').includes('projection'))),...unboundMental]},
      meta:{truthMode:'order/identity/meaning',allFormsRepresented:true,conditionPrimary:true,unboundRenderingDoesNotCreateReferent:true}},
    physical:{id:'ack:physical',reality:'physical',kind:'reality_representation_field',represented:physicalForms.length>0,
      triad:triadMean(physicalForms.map(x=>x.representation)),representations:physicalForms,
      evidence:{formCount:physicalForms.length,observerIndependent:true},
      truths:{forms:physicalForms,actualForms:physicalForms.map(x=>({id:x.form,actual:true})),actualEvents:events.filter(e=>!e?.numerical)},
      meta:{truthMode:'actuality/consequence',allFormsRepresented:true,conditionPrimary:true,observerIndependent:true}}
  };
  const representationsByReality={consciousness:consciousnessForms,mental:mentalForms,physical:physicalForms};
  const singularConditions=Object.fromEntries(Object.entries(mapped.byForm).map(([id,x])=>[id,x.condition]));
  return {
    label,participants:[...new Set(participants)].sort(),fields,
    singularConditions,representationsByReality,conditionRealityMap:mapped.byForm,
    // Compatibility alias only. Do not interpret as three ontologically independent truths.
    truthByReality:representationsByReality,
    triads:{consciousness:{...fields.consciousness.triad},mental:{...fields.mental.triad},physical:{...fields.physical.triad}},
    meta:{contextual:true,intrinsicCompartments:false,oneConditionManyRepresentations:true,threeDistinctRealities:true,
      allFormsParticipateInAllThree:true,representationsMayDiffer:true,acknowledgementIsRealisationNotActualisation:true,
      acknowledgementChangesLegibilityNotCondition:true,absenceOfAcknowledgementIsNotAbsenceOfRepresentation:true,
      holography:'ground/order/process structures the singular condition and recurs through each projection',
      orthogonalPressureAxis:['cosmic','social','existential'],orthogonalHolographicAxis:['ground','order','process'],
      truthByRealityCompatibilityOnly:true}
  };
}

export function acknowledgementAudit(w){
  const last=w?._lastAcknowledgementFields||null;
  return {hasContext:!!last,fields:last?Object.keys(last.fields||{}):[],formConditions:last?Object.keys(last.singularConditions||{}).length:0,meta:last?.meta||null};
}
