// DESTINY v1.04 — MOIRA / SITUATED CARRYING LIMIT
//
// Canonical correction after v1.03 Field/Basin re-foundation:
// - Moira is not fate, a scalar trait, or an agent.
// - It is the situated measure/allotment of what a finite coherence can carry before warping.
// - Field tightening arises when actual Field-conditioned demand exceeds that situated measure.
// - This canonical audit uses direct embodied/attentional/material/relational conditions and does NOT
//   depend on the deprecated intrinsic C/M/P x Ground/Order/Process anatomy.
// - Basin limits below are contextual readings of this local configuration, never properties stored on Forms.

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const gm=xs=>Math.pow(xs.reduce((p,x)=>p*Math.max(.0001,x),1),1/(xs.length||1));
const dist=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));

function relsFor(w,id){return [...(w.relations?.values?.()||[])].filter(r=>r.a===id||r.b===id);}
function terrainAtSnapshot(s,pos){
  if(!s?.terrain?.length)return {roughness:0,exposure:0,moisture:.3};
  const x=Math.max(0,Math.min((s.w||1)-1,Math.floor(pos?.x||0))),y=Math.max(0,Math.min((s.h||1)-1,Math.floor(pos?.y||0)));
  return s.terrain?.[y]?.[x]||{roughness:0,exposure:0,moisture:.3};
}
function maxTravelOf(es){return Math.max(.0001,es?.geometry?.maxTravel??1);}

export function situatedMoira(w,s,entity,{fieldContext=null,rawCandidates=[],drivers=[]}={}){
  const es=s?.forms?.get?.(entity.id);if(!es)return null;
  const body=es.body||{};const app=entity.apparatus||es.apparatus||{};const mat=es.material||{};
  const viability=entity.kind==='person'||entity.kind==='animal'?gm([
    clamp(body.integrity??1),clamp(body.energy??1),clamp(body.water??1),clamp(body.warmth??1)
  ]):clamp(mat.integrity??1);
  const embodied=clamp(gm([
    Math.max(.001,viability),Math.max(.001,mat.integrity??1),Math.max(.001,.25+(mat.mobility??0)*.75)
  ]));
  const ordering=clamp(gm([
    Math.max(.001,app.attention??.5),Math.max(.001,app.retention??.5),Math.max(.001,body.energy??1),Math.max(.001,body.water??1)
  ]));
  const horizon=clamp(gm([
    Math.max(.001,app.receptor??.5),Math.max(.001,app.attention??.5),Math.max(.001,ordering)
  ]));

  const rels=relsFor(w,entity.id);const relationalTension=clamp(avg(rels.map(r=>r.tensionLoad||0))||0);
  const retainedOrganisation=clamp(avg(rels.map(r=>clamp((r.priorConductance??r.conductance??0)*.55+(r.priorAutonomy??r.autonomy??0)*.45)))||0);
  const terrain=terrainAtSnapshot(s,es.pos);
  const environmentalLoad=clamp((terrain.roughness??0)*.24+(terrain.exposure??0)*.20+(w.weather?.cold??0)*(1-(mat.cover??0))*.16+(w.weather?.heat??0)*.10);
  const driverMagnitude=clamp(drivers.reduce((q,d)=>q+Math.max(0,d.weight||0),0)/Math.max(1,drivers.length));
  const driverPlurality=clamp(drivers.length/6);
  const travelDemand=clamp(avg(rawCandidates.map(c=>dist(es.pos,c.to??c)/maxTravelOf(es)))||0);
  const heldLoad=entity.kind==='person'?clamp((entity.willProjection?0.18:0)+(entity.counterfactualProjection?0.16:0)+(entity.praxisEpisode?0.14:0)):0;
  const fieldPressure=clamp(fieldContext?.pressure??0);
  const realityDemand={consciousness:clamp(fieldContext?.realityDemand?.consciousness??fieldPressure),mental:clamp(fieldContext?.realityDemand?.mental??fieldPressure),physical:clamp(fieldContext?.realityDemand?.physical??fieldPressure)};
  const braidLoad=clamp(fieldContext?.braidLoad??fieldContext?.contradiction??0);
  const mechanismLoad=clamp(fieldContext?.routedLoad??avg((fieldContext?.fields||[]).filter(f=>f.kind!=='sovereign').map(f=>f.pressure))??0);

  // Direct situated demand channels. Numeric blend is engineering; ontology is load vs measure.
  const demand={
    embodied:clamp(environmentalLoad*.34+travelDemand*.22+driverMagnitude*.18+relationalTension*.14+realityDemand.physical*.12),
    ordering:clamp(driverPlurality*.23+driverMagnitude*.17+braidLoad*.18+relationalTension*.14+heldLoad*.15+realityDemand.mental*.13),
    horizon:clamp(driverPlurality*.20+braidLoad*.18+realityDemand.consciousness*.20+mechanismLoad*.16+heldLoad*.10)
  };
  // Retained organisation can support coherence but cannot erase bodily/material finitude.
  const support=clamp(retainedOrganisation*.16);
  const carrying={embodied,ordering:clamp(ordering+support),horizon:clamp(horizon+support*.65)};
  const deformation={
    embodied:clamp(Math.max(0,demand.embodied-carrying.embodied)),
    ordering:clamp(Math.max(0,demand.ordering-carrying.ordering)),
    horizon:clamp(Math.max(0,demand.horizon-carrying.horizon))
  };
  const margins={embodied:carrying.embodied-demand.embodied,ordering:carrying.ordering-demand.ordering,horizon:carrying.horizon-demand.horizon};
  const maxDeformation=Math.max(...Object.values(deformation));
  const meanDeformation=avg(Object.values(deformation));
  const narrowestMargin=Math.min(...Object.values(margins));
  // Contextual basin limit reading: not intrinsic Form anatomy.
  const basinLimits={physical:carrying.embodied,mental:carrying.ordering,consciousness:carrying.horizon};
  return {
    entity:entity.id,carrying,demand,deformation,margins,basinLimits,
    maxDeformation,meanDeformation,narrowestMargin,canCarry:maxDeformation<.000001,
    evidence:{viability,environmentalLoad,driverMagnitude,driverPlurality,travelDemand,relationalTension,retainedOrganisation,heldLoad,fieldPressure,realityDemand,braidLoad,mechanismLoad},
    meta:{situated:true,notFate:true,notScalar:true,noIntrinsicHologram:true,sourceLaw:'measure/load before warping'}
  };
}

export function candidateMoiraLoad(es,candidate,fieldContext,moira,drivers=[]){
  const d=clamp(dist(es.pos,candidate.to??candidate)/maxTravelOf(es));
  const novelty=clamp(drivers.length?1/(1+drivers.length*.35):.45);
  const mechanismLoad=clamp(fieldContext?.routedLoad??avg((fieldContext?.fields||[]).filter(f=>f.kind!=='sovereign').map(f=>f.pressure))??0);
  const braidLoad=clamp(fieldContext?.braidLoad??fieldContext?.contradiction??0);
  // v1.04.5 correction: these are MARGINAL candidate burdens. Present Field/braid/mechanism
  // demand has already consumed situated measure in `moira.demand` and must not be counted twice.
  const marginal={
    embodied:clamp(d*.42+mechanismLoad*d*.08),
    ordering:clamp(novelty*.28+braidLoad*novelty*.08+d*.12),
    horizon:clamp(novelty*.30+(fieldContext?.pressure??0)*novelty*.07+braidLoad*novelty*.06)
  };
  const present={embodied:Math.max(0,moira?.demand?.embodied??0),ordering:Math.max(0,moira?.demand?.ordering??0),horizon:Math.max(0,moira?.demand?.horizon??0)};
  const totalDemand={};const excess={};
  for(const k of Object.keys(marginal)){totalDemand[k]=present[k]+marginal[k];excess[k]=Math.max(0,totalDemand[k]-(moira?.carrying?.[k]??1));}
  const maxExcess=Math.max(...Object.values(excess)),meanExcess=avg(Object.values(excess));
  return {requirements:marginal,marginal,presentDemand:present,totalDemand,excess,maxExcess,meanExcess,tightening:clamp(maxExcess*.78+meanExcess*.42),
    meta:{candidateBurdenIsMarginal:true,presentDemandConsumesMeasureFirst:true,noFieldDoubleCount:true}};
}

export function moiraAuditSummary(w){
  const x=w._moiraState instanceof Map?[...w._moiraState.entries()]:[];
  return {tracked:x.length,limited:x.filter(([,m])=>(m.maxDeformation||0)>0).length,maxDeformation:Math.max(0,...x.map(([,m])=>m.maxDeformation||0)),
    legacyIntrinsicHologramUsed:false};
}
