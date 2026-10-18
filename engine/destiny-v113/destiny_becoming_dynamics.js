// DESTINY v1.05 — BECOMING / RELATIONAL ACTUALISATION
//
// Canonical hypothesis earned from the source corpus:
// Power is not a possession, stat, or an extra force injected into a Moment. Power is the
// ontological actuality of relational becoming: possibility resolving into determinate actuality
// under Field-conditioned relation. Force, Flow, resistance/holding, and resultant inscription are
// measurable expressions of that one operation, not rival causal substances.
//
// This module is deliberately diagnostic at the Moment boundary. It does not select actions,
// manufacture routes, or certify Truth. It reads the becoming that actually occurred.

import {clamp} from './destiny_unified_kernel.js';

const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const sum=xs=>xs.reduce((s,x)=>s+x,0);
const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
const pair=(a,b)=>[a,b].sort().join('|');

function eventMagnitude(e){
  const keys=['impulse','magnitude','amount','strain','bodyDamage','loss','torque','delta','load','ratio','relativeSpeed','reactionDemand'];
  let s=0,n=0;
  for(const k of keys){const v=Math.abs(Number(e?.[k]));if(Number.isFinite(v)){s+=v;n++;}}
  if(e?.vector&&Number.isFinite(e.vector.x)&&Number.isFinite(e.vector.y)){s+=Math.hypot(e.vector.x,e.vector.y);n++;}
  return n?s:.10;
}
function eventParticipants(e,w){
  const raw=[e?.actor,e?.form,e?.source,e?.target,e?.a,e?.b,e?.anchor,e?.mediator,e?.rootMaterial,e?.material,...(e?.actors||[]),...(e?.near||[]),...(e?.members||[])];
  return [...new Set(raw.filter(id=>typeof id==='string'&&w.forms.has(id)))];
}
function relationBetween(w,a,b){return w.relations?.get?.(pair(a,b))||null;}

function fieldExpression(fieldSyntax={}){
  const contexts=Object.entries(fieldSyntax||{}).filter(([,x])=>x);
  const sovereign={cosmic:[],social:[],existential:[]};
  const reality={consciousness:[],mental:[],physical:[]};
  for(const [,fc] of contexts){
    for(const f of fc?.sovereignFields||fc?.fields||[])if(sovereign[f.domain])sovereign[f.domain].push(f.pressure||0);
    for(const r of Object.keys(reality))if(Number.isFinite(fc?.realityDemand?.[r]))reality[r].push(fc.realityDemand[r]);
  }
  return {
    contextCount:contexts.length,
    sovereign:Object.fromEntries(Object.entries(sovereign).map(([k,v])=>[k,avg(v)])),
    realityDemand:Object.fromEntries(Object.entries(reality).map(([k,v])=>[k,avg(v)])),
    braidLoad:avg(contexts.map(([,x])=>x.braidLoad||0)),
    routedMechanismLoad:avg(contexts.map(([,x])=>x.routedLoad||0)),
    meta:{fieldConditionsBecoming:true,fieldIsNotPower:true}
  };
}

function forceExpression(seeds=[]){
  const events=seeds.map(x=>x.event).filter(Boolean);
  const magnitudes=events.map(eventMagnitude);
  const byType={};
  for(let i=0;i<events.length;i++){const k=events[i].type||'event';byType[k]=(byType[k]||0)+magnitudes[i];}
  return {
    eventCount:events.length,
    transmittedMagnitude:sum(magnitudes),
    meanMagnitude:avg(magnitudes),
    peakMagnitude:Math.max(0,...magnitudes),
    byType,
    meta:{relationalTransmission:true,notPowerItself:true,notMoralized:true}
  };
}

function flowExpression(w,participants=[],seeds=[]){
  const ids=[...new Set(participants)].filter(id=>w.forms.has(id));
  const paths=[];const seen=new Set();
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=ids[i],b=ids[j],r=relationBetween(w,a,b);if(!r)continue;
    const k=pair(a,b);seen.add(k);
    paths.push({a,b,kind:'retained_relation',conductance:clamp(r.conductance||0),autonomy:clamp(r.autonomy||0),coPresence:r.coPresence||0,tensionLoad:clamp(r.tensionLoad||0)});
  }
  // A realised event is itself evidence that a conduit existed in this Moment even if no retained
  // RelationForm has yet accumulated. This records path existence; it does not create future conductance.
  for(const seed of seeds){const e=seed.event;if(!e)continue;const ps=eventParticipants(e,w);for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
    const k=pair(ps[i],ps[j]);if(seen.has(k))continue;seen.add(k);paths.push({a:ps[i],b:ps[j],kind:'actual_event_path',conductance:null,eventType:e.type||null});
  }}
  const retained=paths.filter(x=>Number.isFinite(x.conductance));
  return {
    pathCount:paths.length,
    retainedPathCount:retained.length,
    meanRetainedConductance:avg(retained.map(x=>x.conductance)),
    paths,
    meta:{topologyOfTransmission:true,notForceMagnitude:true,notPowerItself:true}
  };
}

function resistanceExpression(actualityAudit,seeds=[]){
  const bearers=actualityAudit?.bearers||[];
  const holdings=bearers.map(b=>b.holdingInscription||0),persistence=bearers.map(b=>b.selfPersistence||0);
  const reactions=seeds.map(x=>x.event).filter(e=>e&&['constraint_reaction','orientation_shift','structural_overload','material_strain','bodily_strain'].includes(e.type));
  return {
    bearerCount:bearers.length,
    meanPersistence:avg(persistence),
    holdingInscription:sum(holdings),
    reactionSurfaceCount:reactions.length,
    reactionMagnitude:sum(reactions.map(eventMagnitude)),
    meta:{resistanceCanExpressPower:true,resistanceIsNotForceSourceByDefinition:true,notPowerItself:true}
  };
}

function inscriptionExpression(actualityAudit){
  const a=actualityAudit||{bearers:[]};
  const bs=a.bearers||[];
  return {
    bearerCount:bs.length,
    strongest:a.strongest||null,
    meanActuality:avg(bs.map(x=>x.actuality||0)),
    maxActuality:Math.max(0,...bs.map(x=>x.actuality||0)),
    conditionInscription:Object.fromEntries(bs.map(x=>[x.key,clone(x.conditionInscription)])),
    relativeShares:clone(a.relativeShares||{}),
    meta:{resultantDifferentialActuality:true,postCollapseAudit:true,notPowerItself:true,certifiesTruth:false}
  };
}

export function computeRelationalActualisation(w,s,{participants=[],seeds=[],processes=[],fieldSyntax={},actualityAudit=null,label=null}={}){
  const eventSeeds=seeds.filter(x=>x.event||x.process||x.activation||x.fieldActivation);
  const actualized=eventSeeds.length>0;
  const field=fieldExpression(fieldSyntax),force=forceExpression(seeds),flow=flowExpression(w,participants,seeds),resistance=resistanceExpression(actualityAudit,seeds),inscription=inscriptionExpression(actualityAudit);
  return {
    id:label||null,
    operation:'relational_actualisation',
    power:{
      ontology:'actuality_of_becoming',
      actualized,
      eventBound:true,
      relational:true,
      scalar:false,
      storedOnForm:false,
      possession:false,
      certifiesTruth:false,
      distinctFromTruth:true,
      notAnExtraForce:true
    },
    expressions:{field,force,flow,resistance,inscription},
    // A descriptive intensity can help audits, but MUST NOT be read as "amount of Power".
    actualityIntensity:actualized?clamp(avg([
      1-Math.exp(-force.transmittedMagnitude),
      flow.pathCount?clamp(.2+.8*flow.meanRetainedConductance):0,
      resistance.holdingInscription?clamp(resistance.holdingInscription):0,
      inscription.meanActuality
    ])):0,
    participants:[...participants],
    processCount:processes.length,
    meta:{
      oneOperationManyExpressions:true,
      forceFlowResistanceInscriptionAreMeasurements:true,
      actualityIntensityIsDiagnosticNotPowerScalar:true,
      representationCanBeConsequentialWithoutBecomingTrue:true,
      postCollapseDiagnostic:true
    }
  };
}

export function becomingAudit(w,{last=200}={}){
  const ms=(w.moments||[]).slice(-last).filter(m=>m.becoming);
  return {
    moments:ms.length,
    allRelationalActualisation:ms.every(m=>m.becoming?.operation==='relational_actualisation'),
    allPowerNonScalar:ms.every(m=>m.becoming?.power?.scalar===false),
    allPowerEventBound:ms.every(m=>m.becoming?.power?.eventBound===true&&m.becoming?.power?.storedOnForm===false),
    allTruthDistinct:ms.every(m=>m.becoming?.power?.certifiesTruth===false&&m.becoming?.power?.distinctFromTruth===true),
    allExpressionsPresent:ms.every(m=>['field','force','flow','resistance','inscription'].every(k=>m.becoming?.expressions?.[k])),
    meanActualityIntensity:avg(ms.map(m=>m.becoming.actualityIntensity||0))
  };
}
