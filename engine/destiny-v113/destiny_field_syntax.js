import {candidateMoiraLoad} from './destiny_moira_dynamics.js';
import {sovereignFieldDemand} from './destiny_sovereign_field_demand.js';
// DESTINY v1.04.3 — PRESSURE FIELDS / ACKNOWLEDGEMENT-AXIS SEPARATION
//
// A Field is not a place, mood, named scenario, or Force. Sovereign Fields are pre-subjective
// pressure-syntaxes that condition what can coherently enter a live horizon before Collapse.
//
// Canonical restraint in v1.04.2:
// - Cosmic / Social / Existential remain the only sovereign pressure sources represented here.
// - retained relations, collective structures and inscriptions are mechanisms/conduits. They may
//   localise/reroute sovereign pressure but do not mint an independent quantum of pressure.
// - local Field-expressions are therefore routed profiles of sovereign pressure through an actual
//   mechanism, not extra sovereign-like terms added to the pressure sum.
// - cross-Field co-activation is exposed as `braidLoad`. The engine does NOT yet claim to know
//   whether different Field grammars are semantically incompatible; `contradiction` is held at zero
//   rather than manufactured from simple scalar spread.
//
// Numeric proxies remain engineering diagnostics, not definitions of the metaphysical Fields.

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const dist=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));

function field(id,domain,pressure,requirements={},source=null){return {id,domain,kind:'sovereign',pressure:clamp(pressure),requirements,source};}
function mechanism(id,kind,{retention=0,conductance=0,constraint=0,evidence={},source=null}={}){
  return {id,kind,retention:clamp(retention),conductance:clamp(conductance),constraint:clamp(constraint),evidence,source};
}
function relsFor(w,id){return [...w.relations.values()].filter(r=>r.a===id||r.b===id);}

export function routeFieldMechanism(mech,sovereignFields){
  // Kind/name has no causal privilege: routing depends only on the mechanism's actual retained
  // topology and on pressure already supplied by sovereign Fields.
  const aperture=clamp(mech?.retention*.55+mech?.conductance*.45);
  const routes={};
  for(const f of sovereignFields||[])routes[f.domain]=clamp((f.pressure||0)*aperture);
  const routedLoad=clamp(avg(Object.values(routes))||0);
  return {...mech,aperture,routes,routedLoad};
}

function mechanismInventory(w,s,entity,es,sovereign){
  const out=[];
  for(const r of relsFor(w,entity.id)){
    const other=s.forms.get(r.a===entity.id?r.b:r.a);if(!other)continue;
    const retention=clamp((r.autonomy||0)*.30+Math.min(.28,(r.coPresence||0)/24)+Math.min(.22,(r.witness||0)/24)+(r.tensionLoad||0)*.20);
    const conductance=clamp((r.conductance||0)*.76+Math.min(.24,(r.coPresence||0)/24));
    if(retention>.04||conductance>.04)out.push(mechanism(`relation:${r.id}`,'relation_history',{retention,conductance,constraint:r.tensionLoad||0,
      evidence:{relation:r.id,coPresence:r.coPresence||0,witness:r.witness||0,autonomy:r.autonomy||0},source:r.id}));
  }
  for(const whole of w.wholes?.values?.()||[]){
    if(!whole.alive||!whole.members?.includes(entity.id))continue;
    const assignmentDensity=clamp((whole.assignments?.size||0)/Math.max(1,whole.members?.length||1));
    const retention=clamp(Math.min(.55,(whole.persist||0)/24)+assignmentDensity*.22+(whole.boundary||0)*.23);
    const conductance=clamp((whole.boundary||0)*.58+assignmentDensity*.42);
    if(retention>.04||conductance>.04)out.push(mechanism(`collective:${whole.id}`,'collective_structure',{retention,conductance,constraint:whole.boundary||0,
      evidence:{whole:whole.id,persist:whole.persist||0,assignments:whole.assignments?.size||0,boundary:whole.boundary||0},source:whole.id}));
  }
  // A material inscription is only a conduit when it is physically accessible and actually carries
  // retained associations. `inscription` is structural, not a declaration that a Linguistic Field exists.
  for(const f of s.forms.values()){
    if(!f.alive||f.kind!=='mark'||dist(es.pos,f.pos)>4||(f.material?.visibility??0)<=.1)continue;
    const source=w.forms.get(f.id),assoc=(source?.associations||[]).length;if(!assoc)continue;
    const proximity=clamp(1-dist(es.pos,f.pos)/4),retention=clamp(Math.min(1,assoc/8)*.70+(f.material?.integrity??1)*.30);
    const conductance=clamp((f.material?.visibility??0)*.65+proximity*.35);
    out.push(mechanism(`inscription:${f.id}`,'inscription',{retention,conductance,evidence:{mark:f.id,associations:assoc,visibility:f.material?.visibility??0,proximity},source:f.id}));
  }
  return out.map(m=>routeFieldMechanism(m,sovereign));
}

function braidOf(sovereign){
  const pairs=[];
  for(let i=0;i<sovereign.length;i++)for(let j=i+1;j<sovereign.length;j++){
    const a=sovereign[i],b=sovereign[j];
    pairs.push({a:a.domain,b:b.domain,coactivation:clamp(Math.sqrt(Math.max(0,a.pressure*b.pressure)))});
  }
  return {pairs,load:clamp(avg(pairs.map(x=>x.coactivation))||0)};
}

export function activeFieldContext(w,s,entity,{drivers=[]}={}){
  const es=s.forms.get(entity.id);if(!es)return {entity:entity.id,fields:[],pressureFields:[],sovereignFields:[],mechanisms:[],localExpressions:[],pressure:0,braidLoad:0,contradiction:0,routedLoad:0,grammarOpenness:1,coherenceAperture:1,openHorizon:.2};
  const demandGrammar=sovereignFieldDemand(w,s,entity,{drivers});
  const sovereign=demandGrammar.fields||[];
  const mechanisms=entity.kind==='person'?mechanismInventory(w,s,entity,es,sovereign):[];
  const localExpressions=mechanisms.filter(m=>m.routedLoad>.015).map(m=>({
    id:`local:${m.id}`,kind:'localized_expression',sourceMechanism:m.id,routes:{...m.routes},pressure:m.routedLoad,
    meta:{derivedFromSovereign:true,notIndependentSource:true,mechanismKindDiagnostic:m.kind}
  }));
  const pressure=clamp(avg(sovereign.map(f=>f.pressure))||0);
  const braid=braidOf(sovereign),braidLoad=braid.load;
  const routedLoad=clamp(avg(localExpressions.map(x=>x.pressure))||0);
  // True contradiction requires incompatible requirements. The present engine does not yet possess
  // a source-earned common demand-space in which to prove that incompatibility, so do not fake one.
  const contradiction=0;
  const grammarOpenness=clamp(.72-pressure*.34-braidLoad*.08-routedLoad*.10,.18,.98);
  return {entity:entity.id,fields:sovereign,pressureFields:sovereign,sovereignFields:sovereign,mechanisms,localExpressions,pressure,realityDemand:demandGrammar.realityDemand,braidLoad,braidPairs:braid.pairs,contradiction,routedLoad,grammarOpenness,
    coherenceAperture:grammarOpenness,openHorizon:clamp(.18+(entity.apparatus?.receptor??.3)*.25+(entity.apparatus?.attention??.3)*.20),
    meta:{preSubjective:true,notForce:true,sovereignDomains:['cosmic','social','existential'],mechanismsAreNotFields:true,localExpressionsDerived:true,
      contradictionUnresolved:true,localExpressionCount:localExpressions.length,nonHumanFieldSyntaxUnresolved:entity.kind!=='person',
      distinctFromAcknowledgementFields:true,acknowledgementAxis:['consciousness','mental','physical'],sovereignDemandGrammar:true,scalarPressureCompatibilitySummary:true}};
}

function demandOfCandidate(es,pos,drivers=[]){
  const d=dist(es.pos,pos),max=Math.max(.0001,es.geometry?.maxTravel??1);
  const travel=clamp(d/max),novelty=clamp(drivers.length?1/(1+drivers.length*.35):.45);
  return {travel,novelty,coherence:clamp(travel*.55+novelty*.15)};
}

export function conditionSuperposition(w,s,entity,fieldContext,positions,drivers=[],moira=null){
  const es=s.forms.get(entity.id);if(!es)return {positions,rawCount:positions.length,liveCount:positions.length,fieldConditioned:false,openHorizon:.2};
  const crossLoad=clamp(fieldContext?.braidLoad??fieldContext?.contradiction??0);
  const scored=positions.map(x=>{
    const demand=demandOfCandidate(es,x.to??x,drivers),ml=candidateMoiraLoad(es,x,fieldContext,moira,drivers);
    // Field pressure alone never closes a route. Tightening remains demand relative to situated Moira.
    const grammarPenalty=(1-(fieldContext.grammarOpenness??1))*demand.novelty*.10;
    const admissibility=clamp(Math.exp(-ml.tightening*3.2)-grammarPenalty);
    const pressurePenalty=(fieldContext.pressure||0)*demand.travel*.06+crossLoad*demand.novelty*.05+ml.tightening*.20;
    return {...x,fieldDemand:demand,moiraLoad:ml,fieldAdmissibility:admissibility,fieldPressure:fieldContext.pressure,score:(x.score??0)-pressurePenalty};
  });
  let live=scored.filter(x=>x.fieldAdmissibility>.18);
  if(!live.length&&scored.length)live=[[...scored].sort((a,b)=>b.fieldAdmissibility-a.fieldAdmissibility||b.score-a.score)[0]];
  live=live.sort((a,b)=>b.score-a.score);
  const contraction=scored.length?clamp(1-live.length/scored.length):0;
  const tightening=scored.length?clamp(scored.reduce((q,x)=>q+(x.moiraLoad?.tightening||0),0)/scored.length):0;
  const maxTightening=Math.max(0,...scored.map(x=>x.moiraLoad?.tightening||0));
  return {positions:live,rawCount:scored.length,liveCount:live.length,fieldConditioned:true,contraction,tightening,maxTightening,fieldPressure:fieldContext.pressure,
    braidLoad:fieldContext.braidLoad??0,contradiction:fieldContext.contradiction??0,routedLoad:fieldContext.routedLoad??0,openHorizon:fieldContext.openHorizon,
    moira:moira?{carrying:moira.carrying,demand:moira.demand,deformation:moira.deformation,narrowestMargin:moira.narrowestMargin}:null,
    unrepresentedPotential:true};
}

export function assessFieldActivation(w,entity,fieldContext,superposition,moira=null){
  if(!w._fieldSyntaxState)w._fieldSyntaxState=new Map();const prev=w._fieldSyntaxState.get(entity.id);
  // This record marks a material tightening/reorganisation of the situated grammar; it does not mean
  // a Field was created at this instant.
  const crossLoad=clamp(fieldContext?.braidLoad??fieldContext?.contradiction??0);
  const demand=clamp((superposition?.maxTightening??0)*.55+(superposition?.contraction??0)*.30+crossLoad*.15);
  const changed=!prev||Math.abs(demand-prev.demand)>.06||Math.abs((superposition?.liveCount||0)-(prev.liveCount||0))>=2||Math.abs((superposition?.maxTightening||0)-(prev.tightening||0))>.07;
  const activation=demand>.10&&changed?{kind:'field_activation',actor:entity.id,participants:[entity.id],demand,pressure:fieldContext.pressure,braidLoad:crossLoad,
    contradiction:fieldContext.contradiction??0,routedLoad:fieldContext.routedLoad??0,tightening:superposition?.maxTightening||0,moiraDeformation:moira?.maxDeformation||0,moiraMargin:moira?.narrowestMargin??null,
    rawHorizon:superposition?.rawCount||0,liveHorizon:superposition?.liveCount||0,fields:(fieldContext.sovereignFields||fieldContext.fields||[]).map(f=>({id:f.id,domain:f.domain,kind:f.kind,pressure:f.pressure})),
    mechanisms:(fieldContext.mechanisms||[]).map(m=>({id:m.id,kind:m.kind,routedLoad:m.routedLoad}))}:null;
  w._fieldSyntaxState.set(entity.id,{demand,pressure:fieldContext.pressure,braidLoad:crossLoad,routedLoad:fieldContext.routedLoad??0,tightening:superposition?.maxTightening||0,liveCount:superposition?.liveCount||0});return activation;
}

export function fieldSyntaxAudit(w){
  const st=w._fieldSyntaxState instanceof Map?[...w._fieldSyntaxState.entries()]:[];
  return {trackedEntities:st.length,states:st.slice(0,20).map(([id,x])=>({id,...x}))};
}
