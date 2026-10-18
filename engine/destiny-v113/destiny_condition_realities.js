// DESTINY v1.04.4 — SINGULAR CONDITION / THREE REALITY REPRESENTATIONS
//
// Canonical law:
// - A Form has one situated condition. Truth is the condition, not three independent truth-values.
// - Consciousness / Mental / Physical are three distinct, interconnected realities in which that
//   same condition is represented differently.
// - Every modeled Form participates in all three realities. A stone does not need an observer in
//   order to possess a Consciousness-side possibility/presence representation or a Mental-side
//   order/identity representation. Human acknowledgement can increase legibility/retention, but
//   does not create the Form or its condition.
// - Ground / Order / Process is the recursive structural grammar of the singular condition and is
//   preserved through each projection. The projections are not private compartments owned by Forms.
// - A representation may be incomplete, distorted, inaccessible or unacknowledged without changing
//   the singular condition to which it refers.
// - Cosmic / Social / Existential remain an orthogonal pressure grammar and are not touched here.
//
// Engineering note: numeric projection weights are falsifiable coordinates, not metaphysical laws.

import {Person,RelationForm,Whole,holographicTriadState,recursiveProcessState,orderState,groundState} from './destiny_unified_kernel.js';

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const gm=xs=>Math.pow(xs.reduce((p,x)=>p*Math.max(.0001,x),1),1/(xs.length||1));
const dist=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));

export const REALITY_FIELDS=['consciousness','mental','physical'];
export const CONDITION_BRANCHES=['ground','order','process'];

function triad(ground=0,order=0,process=0){return {ground:clamp(ground),order:clamp(order),process:clamp(process)};}
function finite(x,d=0){return Number.isFinite(x)?x:d;}
function activeAccess(w,formId,participants=[]){
  if(!(w?._accessState instanceof Map))return [];
  const allowed=new Set(participants);
  const out=[];
  for(const [key,state] of w._accessState.entries()){
    if(!state?.active)continue;
    const [observer,target]=String(key).split('|');
    if(target!==formId)continue;
    if(allowed.size&&!allowed.has(observer))continue;
    out.push({observer,target,access:clamp(state.access??0),distance:state.distance??null});
  }
  return out;
}
function mentalReferences(w,formId,participants=[]){
  const allowed=new Set(participants),out=[];
  for(const p of w?.forms?.values?.()||[]){
    if(!(p instanceof Person)||!p.alive||(allowed.size&&!allowed.has(p.id)))continue;
    const known=p.known?.get?.(formId);if(known)out.push({observer:p.id,kind:'known',confidence:clamp(known.confidence??0),direct:!!known.direct});
    for(const r of (p.renderings||[]).slice(-80))if(r.target===formId)out.push({observer:p.id,kind:'rendering',attribute:r.attribute??null,confidence:clamp(r.confidence??0)});
    for(const [key,m] of p.epistemicModels||[])if(key===formId||String(key).includes(formId))out.push({observer:p.id,kind:'model',key,confidence:clamp(m?.confidence??m?.support??.3)});
    if(p.willProjection?.target===formId)out.push({observer:p.id,kind:'will_projection',confidence:clamp(p.willProjection.commitment??0)});
    if(p.counterfactualProjection?.target===formId)out.push({observer:p.id,kind:'counterfactual_projection',confidence:clamp(p.counterfactualProjection.confidence??.3)});
  }
  return out;
}
function localRelationLoad(w,f){
  if(f instanceof RelationForm)return clamp(.08+(f.conductance||0)*.34+(f.autonomy||0)*.22+Math.min(.18,(f.coPresence||0)/24)+Math.min(.18,(f.witness||0)/24));
  let xs=[];
  for(const r of w?.relations?.values?.()||[])if(r.a===f.id||r.b===f.id)xs.push(clamp(.04+(r.conductance||0)*.45+(r.autonomy||0)*.20+Math.min(.22,(r.coPresence||0)/24)));
  return clamp(avg(xs)||0);
}
function publicRetention(f){
  if(f instanceof Person)return clamp((Math.min(1,(f.traces?.length||0)/24)+Math.min(1,(f.experienceTraces?.length||0)/20)+Math.min(1,(f.configurationMemory?.length||0)/16))/3);
  if(f instanceof RelationForm)return clamp((Math.min(1,(f.present?.length||0)/18)+Math.min(1,(f.residue?.length||0)/24)+Math.min(1,(f.history?.length||0)/30))/3);
  if(f instanceof Whole)return clamp(Math.min(1,(f.functionMemory?.length||0)/25)*.55+Math.min(1,(f.persist||0)/30)*.45);
  return clamp((Math.min(1,(f.history?.length||0)/25)+Math.min(1,(f.associations?.length||0)/12))/2);
}
function actualSupport(f){
  if(f instanceof Person)return clamp(gm([f.viability(),f.material?.integrity??1,finite(f.material?.stock,1)]));
  if(f instanceof RelationForm)return clamp(.06+Math.min(.30,(f.coPresence||0)/24)+Math.min(.24,(f.transfers||0)/12)+(f.conductance||0)*.24+(f.autonomy||0)*.16);
  if(f instanceof Whole){
    const n=Math.max(1,f.members?.length||1),assigned=f.assignments?.size||0;
    return clamp(.05+Math.min(.34,(f.persist||0)/30)+(f.boundary||0)*.28+Math.min(.28,assigned/n));
  }
  return clamp(gm([finite(f.material?.stock,1)+.02,finite(f.material?.integrity,1)+.02,finite(f.material?.visibility,.5)+.02]));
}

// The condition itself is one structured snapshot. It is not a truth-score.
export function singularFormCondition(w,f){
  const h=holographicTriadState(w,f),g=groundState(w,f),o=orderState(w,f),p=recursiveProcessState(w,f);
  const tri=triad(h.ground?.reading??g.reading,h.order?.reading??o.reading,
    .05+(p.unresolvedMomentum||0)*.55+(p.chaosIntensity||0)*.22+Math.min(.18,(p.plurality||0)*.035));
  return {
    form:f.id,kind:f.kind,alive:!!f.alive,clock:w.clock,frame:w.frame??null,
    triad:tri,
    state:{
      actualSupport:actualSupport(f),relationLoad:localRelationLoad(w,f),retention:publicRetention(f),
      position:f.pos?{...f.pos}:null,materialIntegrity:finite(f.material?.integrity,1),stock:finite(f.material?.stock,0),
      processPlurality:p.plurality||0,unresolvedMomentum:p.unresolvedMomentum||0,chaosIntensity:p.chaosIntensity||0
    },
    meta:{singular:true,notScalarTruth:true,groundOrderProcess:true,precedesRealityProjection:true}
  };
}

function consciousnessProjection(w,f,c,participants=[],superpositions={}){
  const access=activeAccess(w,f.id,participants),relation=c.state.relationLoad,proc=c.triad.process;
  const participantHorizons=[];
  for(const id of participants){const h=superpositions?.[id];if(!h)continue;participantHorizons.push({observer:id,liveCount:h.liveCount??h.positions?.length??0,rawCount:h.rawCount??h.positions?.length??0,openHorizon:h.openHorizon??0});}
  // Consciousness representation is the condition as presence/potentiality: what is there to be
  // encountered/become, not a private act of awareness.
  const possibility=clamp(.12+c.triad.ground*.22+c.triad.process*.38+relation*.18+Math.min(.10,(c.state.processPlurality||0)*.025));
  const acknowledged=clamp(avg(access.map(x=>x.access))||0);
  return {reality:'consciousness',conditionRef:c.form,exists:true,mode:'presence/possibility',
    triad:triad(gm([c.triad.ground+.02,possibility+.02]),gm([c.triad.order+.02,.12+relation+.02]),gm([c.triad.process+.02,possibility+.02])),
    acknowledgement:{level:acknowledged,evidence:access,horizons:participantHorizons},
    meta:{sameCondition:true,notHumanMind:true,notPhysicalActuality:true,unacknowledgedDoesNotMeanAbsent:true}};
}
function mentalProjection(w,f,c,participants=[]){
  const refs=mentalReferences(w,f.id,participants),ret=c.state.retention,rel=c.state.relationLoad;
  // Mental representation is the condition as order/identity/meaning. The base ordering exists
  // even without a human rendering; human renderings are finite acknowledgements layered onto it.
  const identity=clamp(.10+c.triad.order*.50+c.triad.ground*.14+ret*.16+rel*.10);
  const acknowledged=clamp(avg(refs.map(x=>x.confidence))||0);
  return {reality:'mental',conditionRef:c.form,exists:true,mode:'order/identity/meaning',
    triad:triad(gm([c.triad.ground+.02,.10+ret+.02]),gm([c.triad.order+.02,identity+.02]),gm([c.triad.process+.02,.10+ret*.45+rel*.25+.02])),
    acknowledgement:{level:acknowledged,evidence:refs},
    meta:{sameCondition:true,notPrivateThought:true,humanMeaningIsFiniteRendering:true,representationDoesNotCreateReferent:true}};
}
function physicalProjection(w,f,c,events=[]){
  const related=events.filter(e=>e.actor===f.id||e.form===f.id||e.source===f.id||e.target===f.id),actual=c.state.actualSupport;
  const activity=clamp(avg(related.map(e=>Math.min(1,Math.abs(e.impulse??e.amount??e.strain??e.bodyDamage??0)*2+.08)))||0);
  return {reality:'physical',conditionRef:c.form,exists:true,mode:'actuality/consequence',
    triad:triad(gm([c.triad.ground+.02,actual+.02]),gm([c.triad.order+.02,.10+c.state.materialIntegrity*.55+.02]),gm([c.triad.process+.02,.08+activity+.02])),
    acknowledgement:{level:1,evidence:related.map(e=>({type:e.type,actor:e.actor??null,form:e.form??null,source:e.source??null,target:e.target??null}))},
    meta:{sameCondition:true,observerIndependent:true,actualityNotExhaustedByObservation:true}};
}

export function representConditionAcrossRealities(w,f,{participants=[],events=[],superpositions={}}={}){
  const condition=singularFormCondition(w,f);
  const representations={
    consciousness:consciousnessProjection(w,f,condition,participants,superpositions),
    mental:mentalProjection(w,f,condition,participants),
    physical:physicalProjection(w,f,condition,events)
  };
  return {form:f.id,condition,representations,
    meta:{oneCondition:true,threeRepresentations:true,allFormsInAllThreeRealities:true,representationsMayDiffer:true,
      disagreementDoesNotMultiplyTruth:true,acknowledgementChangesLegibilityNotCondition:true}};
}

export function contextualConditionRealityMap(w,s,{participants=[],events=[],superpositions={},radius=3}={}){
  const anchors=participants.map(id=>w.forms?.get(id)).filter(Boolean);const forms=[];
  for(const f of w.forms?.values?.()||[]){
    if(!f.alive)continue;
    if(f instanceof Whole){if(!participants.length||f.members?.some(id=>participants.includes(id)))forms.push(f);continue;}
    if(f instanceof RelationForm){if(!participants.length||participants.includes(f.a)||participants.includes(f.b))forms.push(f);continue;}
    if(!anchors.length||anchors.some(a=>dist(a.pos,f.pos)<=radius)||participants.includes(f.id))forms.push(f);
  }
  forms.sort((a,b)=>a.id.localeCompare(b.id));
  const byForm={};for(const f of forms)byForm[f.id]=representConditionAcrossRealities(w,f,{participants,events,superpositions});
  return {byForm,formIds:Object.keys(byForm),meta:{oneConditionPerForm:true,allThreeRealityRepresentations:true,contextualProjectionNotOwnedCompartments:true}};
}
