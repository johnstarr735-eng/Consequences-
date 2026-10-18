// DESTINY v1.04.5 — SOVEREIGN FIELD DEMAND / CROSS-REALITY GRAMMAR
//
// Source-led law:
// - A sovereign Field is not a mood, event, object, Force or semantic label.
// - Cosmic / Social / Existential are three pressure grammars borne by a finite situated coherence.
// - Each demand is expressed differently through the same condition's Consciousness / Mental /
//   Physical representations. The Field does not create another truth.
// - Cosmic: finite-part <-> Whole / scale / origin / immanent participation.
// - Social: visibility / external legibility / retained placement / sanction of deviation.
// - Existential: mortality / absence of guaranteed warrant / compulsory agency and consequence.
// - Numeric equations below are engineering coordinates. Domain definitions above are canonical law.
// - Names of mechanisms have no causal privilege.

import {Person,Whole} from './destiny_unified_kernel.js';
import {representConditionAcrossRealities} from './destiny_condition_realities.js';

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const gm=xs=>Math.pow(xs.reduce((p,x)=>p*Math.max(.0001,x),1),1/(xs.length||1));
const dist=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));
const REALITIES=['consciousness','mental','physical'];

function relsFor(w,id){return [...(w.relations?.values?.()||[])].filter(r=>r.a===id||r.b===id);}
function personOthers(w,id){return [...(w.forms?.values?.()||[])].filter(f=>f instanceof Person&&f.alive&&f.id!==id);}
function meanReality(d){return avg(REALITIES.map(r=>d?.[r]??0));}
function field(id,domain,demandByReality,requirements={},evidence={},source=null){
  const pressure=clamp(meanReality(demandByReality));
  return {id,domain,kind:'sovereign',pressure,demandByReality:{...demandByReality},requirements,evidence,source,
    meta:{demandGrammar:true,oneCondition:true,threeRealityRepresentations:true,scalarPressureCompatibilitySummary:true}};
}

function activeWitnessAccess(w,id){
  if(!(w?._accessState instanceof Map))return [];
  const xs=[];
  for(const [key,state] of w._accessState){
    if(!state?.active)continue;
    const [observer,target]=String(key).split('|');
    if(target===id&&observer!==id)xs.push({observer,access:clamp(state.access??0),distance:state.distance??null});
  }
  return xs;
}
function retainedExternalRenderings(w,id){
  const xs=[];
  for(const p of personOthers(w,id)){
    for(const r of (p.renderings||[]).slice(-100))if(r.target===id||r.referent===id)xs.push({observer:p.id,confidence:clamp(r.confidence??0),kind:'rendering'});
    const k=p.known?.get?.(id);if(k)xs.push({observer:p.id,confidence:clamp(k.confidence??0),kind:'known'});
  }
  return xs;
}
function wholePlacement(w,id){
  const xs=[];
  for(const g of w?.wholes?.values?.()||[]){
    if(!(g instanceof Whole)||!g.alive||!g.members?.includes(id))continue;
    const assigned=[...(g.assignments?.entries?.()||[])].filter(([,holder])=>holder===id).length;
    const slotCount=Math.max(1,g.slots?.length||g.members?.length||1);
    xs.push({whole:g.id,boundary:clamp(g.boundary||0),persistence:clamp((g.persist||0)/30),assignmentDensity:clamp(assigned/slotCount)});
  }
  return xs;
}

export function cosmicDemand(w,s,entity,{representations=null}={}){
  const es=s?.forms?.get?.(entity.id);if(!es)return null;
  const reps=representations||representConditionAcrossRealities(w,entity).representations;
  const worldSpan=Math.max(1,Math.hypot(s?.w||w.w||1,s?.h||w.h||1));
  const localSpan=Math.max(.15,es.geometry?.reach??.4,es.geometry?.maxTravel??.4,(es.geometry?.radius??.2)*2);
  const scaleGap=clamp(Math.log1p(worldSpan/localSpan)/Math.log(64));
  const rels=relsFor(w,entity.id);
  const relationParticipation=clamp((avg(rels.map(r=>clamp((r.conductance||0)*.58+(r.autonomy||0)*.20+Math.min(.22,(r.coPresence||0)/24))))||0));
  const body=es.body||{};
  const embodiedParticipation=entity.kind==='person'?clamp(gm([body.integrity??1,body.energy??1,body.water??1])):clamp(es.material?.integrity??1);
  const materialParticipation=clamp(avg([es.material?.stock??0,es.material?.integrity??1,es.material?.mobility??0]));
  const participation=clamp(.34*relationParticipation+.36*embodiedParticipation+.30*materialParticipation);
  // Disclosure is epistemic/situational and deliberately does not create the structural demand.
  const attention=clamp(entity.apparatus?.attention??.25),receptor=clamp(entity.apparatus?.receptor??.25);
  const darkness=clamp(1-(s?.weather?.light??w.weather?.light??.5));
  const disclosure=clamp((attention*.52+receptor*.28)*(0.74+darkness*.26));
  const finiteFrame=clamp(1-avg([entity.apparatus?.receptor??.25,entity.apparatus?.attention??.25,entity.apparatus?.retention??.25]));
  const base=.025+scaleGap*.055+participation*.025;
  const demandByReality={
    consciousness:clamp(base+scaleGap*(reps?.consciousness?.triad?.process??.2)*.030),
    mental:clamp(base+scaleGap*(.35+finiteFrame*.65)*.035),
    physical:clamp(base+participation*.040)
  };
  return field('sovereign:cosmic','cosmic',demandByReality,
    {finitePartWhole:true,scaleAndOrigin:true,notAstronomy:true},
    {scaleGap,participation,relationParticipation,embodiedParticipation,materialParticipation,finiteFrame,disclosure,worldSpan,localSpan},'finite-part-whole');
}

export function socialDemand(w,s,entity,{representations=null}={}){
  const es=s?.forms?.get?.(entity.id);if(!es)return null;
  const reps=representations||representConditionAcrossRealities(w,entity).representations;
  const rels=relsFor(w,entity.id),access=activeWitnessAccess(w,entity.id),renderings=retainedExternalRenderings(w,entity.id),placements=wholePlacement(w,entity.id);
  const exposure=clamp(avg(access.map(x=>x.access))||0);
  const relationLegibility=clamp((avg(rels.map(r=>clamp(Math.min(.26,(r.witness||0)/20)+Math.min(.20,(r.encounters||0)/20)+(r.conductance||0)*.34+(r.autonomy||0)*.20)))||0));
  const externalPlacement=clamp(avg(renderings.map(x=>x.confidence))||0);
  const collectivePlacement=clamp(avg(placements.map(x=>clamp(x.assignmentDensity*.42+x.persistence*.28+x.boundary*.30)))||0);
  const sanction=clamp(avg([
    avg(rels.map(r=>r.tensionLoad||0))||0,
    avg(placements.map(x=>x.boundary*x.assignmentDensity))||0,
    clamp(entity.mismatchDebt?entity.mismatchDebt/3:0)
  ]));
  const topologyPresent=rels.length+renderings.length+placements.length+access.length>0;
  const base=topologyPresent?.012:0;
  const demandByReality={
    consciousness:clamp(base+exposure*.055+relationLegibility*.035),
    mental:clamp(base+relationLegibility*.040+externalPlacement*.060+collectivePlacement*.050+(reps?.mental?.acknowledgement?.level??0)*.010),
    physical:clamp(base+sanction*.070+collectivePlacement*.035)
  };
  return field('sovereign:social','social',demandByReality,
    {visibility:true,legibility:true,recognition:true,sanction:true,notSocietyObject:true},
    {exposure,relationLegibility,externalPlacement,collectivePlacement,sanction,relations:rels.length,externalRenderings:renderings.length,placements:placements.length},'social-legibility-lattice');
}

export function existentialDemand(w,s,entity,{drivers=[]}={}){
  const es=s?.forms?.get?.(entity.id);if(!es)return null;
  const body=es.body||{};
  const viability=entity.kind==='person'?gm([body.integrity??1,body.energy??1,body.water??1,body.warmth??1]):clamp(es.material?.integrity??1);
  const age=Math.max(0,entity.age??entity.baseAge??20),longevity=Math.max(1,entity.longevity??76);
  const ageFraction=clamp(age/longevity);
  // Mortality is structural, not an injury meter. Depletion changes its intensity, not its existence.
  const mortality=clamp(.62+ageFraction*.22+(1-viability)*.16);
  const warrantAbsence=1; // no external guarantee is encoded as a source law, not a mood or belief.
  const mobility=clamp(es.material?.mobility??0);
  const driverPlurality=clamp((drivers?.length||0)/6);
  const compulsoryAgency=clamp(.48+mobility*.24+driverPlurality*.18+(entity.alive?.10:0));
  const consequenceExposure=clamp((1-viability)*.45+mobility*.18+Math.min(.20,(entity.history?.length||0)/50));
  const demandByReality={
    consciousness:clamp(.028+mortality*.060+compulsoryAgency*.040),
    mental:clamp(.028+warrantAbsence*.058+compulsoryAgency*.026),
    physical:clamp(.028+mortality*.052+compulsoryAgency*.040+consequenceExposure*.030)
  };
  return field('sovereign:existential','existential',demandByReality,
    {mortality:true,noGuaranteedWarrant:true,agencyRemainsCompulsory:true},
    {mortality,warrantAbsence,compulsoryAgency,consequenceExposure,viability,ageFraction,driverPlurality},'finite-agency-without-guarantee');
}

export function sovereignFieldDemand(w,s,entity,{drivers=[]}={}){
  if(!entity||!s?.forms?.get?.(entity.id))return {entity:entity?.id??null,fields:[],realityDemand:{consciousness:0,mental:0,physical:0},pressure:0};
  // The three named sovereign Fields are presently source-earned for finite experiencing human systems.
  // Other Forms still participate in one Reality and may enter these Fields relationally; they do not
  // receive private Cosmic/Social/Existential stats merely to fill a cube.
  if(!(entity instanceof Person)&&entity.kind!=='person')return {entity:entity.id,fields:[],realityDemand:{consciousness:0,mental:0,physical:0},pressure:0,
    meta:{namedSovereignDemandsUnresolvedForNonHuman:true}};
  const reps=representConditionAcrossRealities(w,entity,{participants:[entity.id]}).representations;
  const fields=[cosmicDemand(w,s,entity,{representations:reps}),socialDemand(w,s,entity,{representations:reps}),existentialDemand(w,s,entity,{drivers})].filter(Boolean);
  const realityDemand=Object.fromEntries(REALITIES.map(r=>[r,clamp(avg(fields.map(f=>f.demandByReality?.[r]??0)))]));
  return {entity:entity.id,fields,realityDemand,pressure:clamp(avg(fields.map(f=>f.pressure))),representations:reps,
    meta:{sourceLedDemandGrammar:true,conditionPrimary:true,threeRealityDemand:true,scalarPressureIsSummary:true,notForce:true,notMood:true}};
}
