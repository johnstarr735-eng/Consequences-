// DESTINY v0.99 — WILL / PROJECTED POSSIBILITY / PRE-COLLAPSE ORIENTATION
//
// SOURCE-GROUNDED LAW:
// - Mature Collapse into Form explicitly treats Will as a finite local valve/deflector: it can absorb,
//   angle, refuse or reroute a limited amount of Force before Collapse, but it is not sovereign autonomy.
// - Light & Chaos: will is not independent of condition; it is a synthesis of world-pressure, projected
//   reality, human structure/history and desire, becoming action in the present; agency exists before action.
// - Blue/Burgundy/Black notebook material: Will appears between competing pressures, can be weakened by
//   hunger/fatigue/doubt, and can require sustained action/refusal to keep another possibility live.
//
// ENGINE LAW:
// Will is NOT a scalar stat, Force, Power, Desire, Fate, or sovereign choice ex nihilo.
// It is a finite, future-facing organisation of a still-unactualised possibility by a reflective Form.
// It is built from current accessibility, body, attention/retention, history and competing live possibilities.
// It may bias which Process is opened, but Collapse may still defeat it.
//
// Engineering inference: all thresholds, rates, weights and numerical hologram projection below.

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const dist=(a,b)=>Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));
const disp=(a,b)=>({x:(b.x||0)-(a.x||0),y:(b.y||0)-(a.y||0)});
const len=v=>Math.hypot(v.x||0,v.y||0);
const unit=v=>{const m=len(v);return m>1e-12?{x:v.x/m,y:v.y/m}:{x:0,y:0}};
const dot=(a,b)=>(a.x||0)*(b.x||0)+(a.y||0)*(b.y||0);
const avg=xs=>xs.reduce((a,b)=>a+b,0)/(xs.length||1);
const deep=x=>JSON.parse(JSON.stringify(x));

function named(h){return {consciousness:{...h.C},mind:{...h.M},physical:{...h.P}};}
function dominantDriver(drivers){return [...(drivers||[])].sort((a,b)=>(b.weight||0)-(a.weight||0)||String(a.kind).localeCompare(String(b.kind)))[0]||null;}
function driverSig(d){return d?`${d.kind}|${d.target||''}|${d.toward===false?'away':'toward'}`:'inertial';}
function bodyCrisis(es){
  if(!es?.body)return 0;
  const cold=Math.abs((es.body.warmth??.72)-.72)*.45;
  return clamp(Math.max(1-(es.body.energy??1),1-(es.body.water??1),1-(es.body.integrity??1),cold));
}
function reflectiveAperture(entity,es){
  const a=entity?.apparatus||es?.apparatus||{};
  return clamp(Math.sqrt(Math.max(.001,(a.attention??.5)*(a.retention??.5)))*(.72+.28*(a.receptor??.5)));
}
function liveHorizon(positions){
  if(!positions?.length)return [];
  const top=positions[0]?.score??0,floor=Math.max(.008,top*.70);
  return positions.filter(x=>(x.score??0)>=floor);
}
function goalFor(entity,es,s,w,driver,rawTop){
  if(driver?.target){
    const state=w._accessState?.get(`${entity.id}|${driver.target}`);
    const target=s.forms.get(driver.target);
    if(state?.active&&target)return {pos:{...target.pos},source:'direct',target:driver.target,toward:driver.toward!==false};
    const known=entity.known?.get(driver.target);
    if(known?.lastPos)return {pos:{...known.lastPos},source:'retained',target:driver.target,toward:driver.toward!==false};
  }
  // Mere continuation of a trajectory is Process-momentum, not Will.
  // V0.99 only opens a Will projection when a not-yet-actual possibility is representable
  // through an accessible or retained target. Future work may admit richer represented configurations.
  return null;
}
function projectionDirection(es,projection){
  if(projection?.goalPos){
    const d=unit(disp(es.pos,projection.goalPos));
    return projection.toward===false?{x:-d.x,y:-d.y}:d;
  }
  return projection?.direction||{x:0,y:0};
}
function projectionGap(es,p){return p?.goalPos?dist(es.pos,p.goalPos):Infinity;}
function driverKindPressure(drivers,kind){return (drivers||[]).filter(d=>d.kind===kind).reduce((q,d)=>q+Math.max(0,d.weight||0),0);}
function conditionResolutionSpec(es,driver,drivers){
  if(!driver||!es?.body)return null;
  let channel=null,value=null;
  if(driver.kind==='material_water'){channel='water';value=es.body.water??1;}
  else if(driver.kind==='material_assimilation'){channel='energy';value=es.body.energy??1;}
  else return null;
  const pressure=driverKindPressure(drivers,driver.kind);
  // Will is toward a changed condition, not ownership of a named target. The named source remains
  // one currently live route. Required change scales with the unresolved bodily gap.
  const requiredDelta=Math.max(.006,(1-value)*.035);
  return {kind:driver.kind,channel,baseline:value,requiredDelta,pressureAtFormation:pressure};
}
function conditionResolutionReached(es,p,drivers){
  const c=p?.conditionResolution;if(!c||p?.projectedConfiguration?.synthetic||!es?.body)return false;
  const now=es.body[c.channel];if(!Number.isFinite(now))return false;
  const delta=now-c.baseline,currentPressure=driverKindPressure(drivers,c.kind);
  return delta>=c.requiredDelta||((c.pressureAtFormation||0)>.01&&currentPressure<=(c.pressureAtFormation||0)*.45);
}
function projectedConfigurationActual(s,pc){
  if(!pc?.synthetic||!pc?.constraints?.length)return false;
  // Synthetic possibility is fulfilled only after the Physical topology layer has explicitly
  // certified the relation and commitImaginationDynamics has marked this representation actual.
  return pc.actual===true;
}
function willHologram(entity,es,{reflective,horizonBreadth,commitment,crisis,projection,override=false}){
  const a=entity.apparatus||{};
  const viability=es?.body?Math.pow(Math.max(.0001,(es.body.energy??1)*(es.body.water??1)*(es.body.integrity??1)),1/3):1;
  const physicalCapacity=clamp((es?.material?.mobility??.5)*.35+(es?.force??.4)*.20+viability*.45);
  const C={
    ground:clamp(.12+(a.receptor??.5)*.45+reflective*.18),
    order:clamp(.08+horizonBreadth*.62+reflective*.18),
    process:clamp(.06+commitment*.52+(1-crisis)*.18)
  };
  const M={
    ground:clamp(.10+(a.retention??.5)*.52+(a.attention??.5)*.16),
    order:clamp(.08+commitment*.62+(projection?.target?.length? .08:0)),
    process:clamp(.06+commitment*.48+reflective*.22+(override?.12:0))
  };
  const P={
    ground:clamp(.10+viability*.62),
    order:clamp(.08+physicalCapacity*.58+(1-crisis)*.12),
    process:clamp(.05+physicalCapacity*.42+commitment*.24)
  };
  return {C,M,P};
}

export function ensureWillState(w,entity){
  if(!w._willCandidateState)w._willCandidateState=new Map();
  if(!w._willSerial)w._willSerial=0;
  if(!entity.willHistory)entity.willHistory=[];
  if(entity.willProjection===undefined)entity.willProjection=null;
}

// Called after raw possibilities are scored but before a new motion Process is opened.
// Returns re-scored positions and a structured projection. It never mutates Force/Power.
export function orientPotentialByWill(w,entity,es,s,drivers,positions,{dtDays=1/24,syntheticPossibility=null}={}){
  if(entity?.kind!=='person'||!positions?.length)return {positions,projection:null,event:null,effectiveSignature:null,rawTop:positions?.[0]||null,override:false};
  ensureWillState(w,entity);
  const raw=[...positions].sort((a,b)=>(b.score||0)-(a.score||0));
  const rawTop=raw[0],horizon=liveHorizon(raw),reflective=reflectiveAperture(entity,es),crisis=bodyCrisis(es);
  const dom=dominantDriver(drivers),sig=driverSig(dom),candidate=w._willCandidateState.get(entity.id);
  const sameCandidate=candidate?.signature===sig;
  const heldDays=sameCandidate?(candidate.heldDays||0)+dtDays:dtDays;
  w._willCandidateState.set(entity.id,{signature:sig,heldDays,lastDay:w.elapsedDays,driver:dom});

  let p=entity.willProjection,evt=null;
  // v1.00: a counterfactual configuration may elaborate an already-live Will. The projected
  // relation stays in Mind; this only updates the discrepancy Will is orienting toward.
  if(p&&syntheticPossibility&&syntheticPossibility.focus===p.target){
    p.counterfactualId=syntheticPossibility.id;p.kind='synthetic_configuration';p.source='counterfactual';
    if(syntheticPossibility.goalPos)p.goalPos={...syntheticPossibility.goalPos};
    p.projectedConfiguration=deep(syntheticPossibility.configuration);
    p.projectedConfiguration.counterfactualId=syntheticPossibility.id;
    p.projectedConfiguration.actual=projectedConfigurationActual(s,p.projectedConfiguration);
  }
  // A Will horizon needs plurality. With only one materially live route there is no meaningful pre-collapse selection.
  const plural=horizon.length>=2;
  const goal=goalFor(entity,es,s,w,dom,rawTop);
  const canForm=plural&&goal&&reflective>.28&&crisis<.78&&heldDays>=.08;
  if(!p&&canForm){
    const d=goal.pos?unit(disp(es.pos,goal.pos)):goal.direction;
    const reach=es.geometry?.reach??.5;
    p={id:`W${++w._willSerial}`,signature:sig,kind:dom?.kind||'inertial',target:goal.target||null,toward:goal.toward!==false,
      goalPos:goal.pos?{...goal.pos}:null,direction:{...d},source:goal.source,formedDay:w.elapsedDays,lastDay:w.elapsedDays,
      supportedDays:heldDays,commitment:clamp(.10+reflective*.18),status:'projected',
      // The target may already exist; this relational configuration does not. It is the
      // not-yet-actual future state held across layers until fulfilled, revised or lost.
      conditionResolution:conditionResolutionSpec(es,dom,drivers),
      projectedConfiguration:{actor:entity.id,target:goal.target||null,actorGoalPos:goal.pos?{...goal.pos}:null,
        targetKnownPos:goal.pos?{...goal.pos}:null,distanceMax:goal.target?Math.max(.22,reach*.8):null,toward:goal.toward!==false,actual:false}};
    entity.willProjection=p;
    evt={type:'will_projection_open',actor:entity.id,projection:p.id,target:p.target,signature:p.signature};
  }

  if(p){
    // Refresh remembered target only through direct accessibility; otherwise Will acts on retained projection, not omniscience.
    if(p.target&&!(syntheticPossibility&&p.counterfactualId===syntheticPossibility.id)){
      const state=w._accessState?.get(`${entity.id}|${p.target}`),target=s.forms.get(p.target);
      if(state?.active&&target){p.goalPos={...target.pos};p.source='direct';}
    }
    // Once a synthetic possibility has been coherently represented, its support is the retained
    // discrepancy between that projected configuration and Reality. It must not disappear merely
    // because the sensory/locomotor driver which first opened Will is no longer dominant.
    const syntheticSupported=!!(p.projectedConfiguration?.synthetic&&syntheticPossibility&&
      p.counterfactualId===syntheticPossibility.id&&!projectedConfigurationActual(s,p.projectedConfiguration));
    const driverSupported=sig===p.signature;
    const support=(syntheticSupported||driverSupported)?1:.22;
    const plurality=clamp((horizon.length-1)/4);
    const grow=dtDays*(.72*reflective*support+.18*plurality)*(1-crisis*.72);
    const decay=dtDays*(((syntheticSupported||driverSupported)?.08:.42)+crisis*.70+(plural?0:.22));
    p.commitment=clamp((p.commitment||0)+grow-decay);
    p.supportedDays=(p.supportedDays||0)+((syntheticSupported||driverSupported)?dtDays:0);
    p.lastDay=w.elapsedDays;

    const gap=projectionGap(es,p),conditionReached=conditionResolutionReached(es,p,drivers);
    const reached=p.projectedConfiguration?.synthetic
      ?projectedConfigurationActual(s,p.projectedConfiguration)
      :(conditionReached||(p.goalPos&&gap<Math.max(.22,(es.geometry?.reach??.5)*.8)));
    if(reached){
      if(p.projectedConfiguration)p.projectedConfiguration.actual=true;
      evt={type:'will_projection_fulfilled',actor:entity.id,projection:p.id,target:p.target,commitment:p.commitment,
        resolution:conditionReached?'condition_change':'projected_configuration'};
      entity.willHistory.push({clock:w.clock,...evt});entity.willProjection=null;p=null;
    }else if(p.commitment<.025||crisis>.94){
      evt={type:'will_projection_close',actor:entity.id,projection:p.id,target:p.target,reason:crisis>.94?'bodily_crisis':'loss_of_orientation'};
      entity.willHistory.push({clock:w.clock,...evt});entity.willProjection=null;p=null;
    }
  }

  if(!p){if(evt&&entity.willHistory.at(-1)?.projection!==evt.projection)entity.willHistory.push({clock:w.clock,...evt});return {positions:raw,projection:null,event:evt,effectiveSignature:null,rawTop,override:false};}

  const pd=projectionDirection(es,p),maxTravel=Math.max(.001,es.geometry?.maxTravel??1);
  const causalScope=clamp(reflective*(1-crisis)*(p.commitment||0));
  const rescored=raw.map(x=>{
    const mv=disp(es.pos,x.to),m=len(mv),align=m>1e-9?dot(unit(mv),pd):-.15;
    let progress=align;
    if(p.goalPos){
      const before=dist(es.pos,p.goalPos),after=dist(x.to,p.goalPos),delta=(before-after)/maxTravel;
      progress=p.toward===false?-delta:delta;
    }
    // Will routes/selects an available Process. It adds no physical Force.
    const willBias=causalScope*.24*clamp((progress+1)/2,0,1)-causalScope*.06*clamp((-progress),0,1);
    return {...x,rawScore:x.score,willBias,score:(x.score||0)+willBias};
  }).sort((a,b)=>(b.score||0)-(a.score||0)||`${a.to.x},${a.to.y}`.localeCompare(`${b.to.x},${b.to.y}`));
  const top=rescored[0],override=dist(top.to,rawTop.to)>1e-7 && causalScope>.015;
  const h=willHologram(entity,es,{reflective,horizonBreadth:clamp((horizon.length-1)/4),commitment:p.commitment,crisis,projection:p,override});
  p.hologram=h;p.layers=named(h);p.reflectiveAperture=reflective;p.crisis=crisis;p.horizon=horizon.length;p.causalScope=causalScope;
  if(override){
    // Sustained refusal/orientation is one continuing Process. A new event is warranted only
    // when refusal opens or the materially competing pressure/route changes kind/target.
    const againstSig=dom?.kind||'inertial';
    if(!p.overrideActive||p.lastOverrideAgainst!==againstSig){
      const oe={type:'will_projection_override',actor:entity.id,projection:p.id,target:p.target,against:againstSig,rawTo:rawTop.to,projectedTo:top.to,commitment:p.commitment,causalScope};
      if(!evt)evt=oe;
    }
    p.overrideActive=true;p.lastOverrideAgainst=againstSig;
  }else{p.overrideActive=false;p.lastOverrideAgainst=null;}
  if(evt)entity.willHistory.push({clock:w.clock,...evt});
  if(entity.willHistory.length>260)entity.willHistory.splice(0,entity.willHistory.length-260);
  const praxisSig=syntheticPossibility?.praxis?`:praxis:${syntheticPossibility.praxis.id}:r${syntheticPossibility.praxis.revisions||0}:${syntheticPossibility.praxis.waypoint?'detour':'base'}`:'';
  return {positions:rescored,projection:{...p},event:evt,effectiveSignature:causalScope>.015?`will:${p.id}:${p.counterfactualId||p.signature}${praxisSig}`:null,rawTop,override};
}

export function willAudit(w){
  const people=[...w.forms.values()].filter(f=>f.kind==='person');
  const active=people.filter(p=>p.willProjection);
  const history=people.flatMap(p=>p.willHistory||[]);
  return {active:active.length,meanCommitment:active.length?avg(active.map(p=>p.willProjection.commitment||0)):0,
    opens:history.filter(e=>e.type==='will_projection_open').length,
    overrides:history.filter(e=>e.type==='will_projection_override').length,
    fulfilled:history.filter(e=>e.type==='will_projection_fulfilled').length,
    closes:history.filter(e=>e.type==='will_projection_close').length,
    syntheticActive:active.filter(p=>p.willProjection?.projectedConfiguration?.synthetic).length,
    storedWillStats:people.filter(p=>Object.prototype.hasOwnProperty.call(p,'will')).length};
}
