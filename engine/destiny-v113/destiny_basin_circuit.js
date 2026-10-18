import {contextualAcknowledgementFields} from './destiny_acknowledgement_fields.js';
// DESTINY v1.04.4 — INTER-REALITY CIRCUIT / SINGULAR CONDITION REPRESENTATIONS
//
// Canonical correction after v1.02 audit:
// - Consciousness, Mental, Physical are distinct interconnected acknowledgement realities.
// - They are NOT intrinsic scalar compartments owned by every Form.
// - Participation in the circuit is universal; ownership of every basin is not.
// - Ground / Order / Process is the recursive holographic grammar used to READ a local basin/configuration.
// - Basin flow is explicit transformation/history between registers, not multiplication of static cells.

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const gm=xs=>Math.pow(xs.reduce((p,x)=>p*Math.max(.0001,x),1),1/(xs.length||1));
const deep=x=>JSON.parse(JSON.stringify(x));
const dist=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));

export const BASINS=['consciousness','mental','physical'];
export const HOLOGRAPHIC_BRANCHES=['ground','order','process'];

function blankTriad(){return {ground:0,order:0,process:0};}
function personLike(f){return f?.kind==='person';}
function living(f){return !!f?.alive;}

function localForms(s,participants=[],radius=3){
  const ids=new Set(participants);const anchors=participants.map(id=>s?.forms?.get(id)).filter(Boolean);
  if(!s?.forms)return [];
  if(!anchors.length)return [...s.forms.values()].filter(living).slice(0,24);
  for(const f of s.forms.values())if(living(f)&&anchors.some(a=>dist(a.pos,f.pos)<=radius))ids.add(f.id);
  return [...ids].map(id=>s.forms.get(id)).filter(Boolean);
}

export function contextualBasinCircuit(w,s,{participants=[],processes=[],events=[],fieldContexts={},superpositions={},label='local'}={}){
  const moiras=participants.map(id=>fieldContexts?.[id]?.moira).filter(Boolean);
  const basinLimits=moiras.length?{
    consciousness:clamp(avg(moiras.map(m=>m.basinLimits?.consciousness??1))),
    mental:clamp(avg(moiras.map(m=>m.basinLimits?.mental??1))),
    physical:clamp(avg(moiras.map(m=>m.basinLimits?.physical??1)))
  }:null;
  const acknowledgement=contextualAcknowledgementFields(w,s,{participants,processes,events,fieldContexts,superpositions,label});
  w._lastAcknowledgementFields=acknowledgement;
  const circuit={
    label,participants:[...new Set(participants)].sort(),
    // Backward-compatible basin triads now read directly from the three acknowledgement realities.
    consciousness:{...acknowledgement.triads.consciousness},
    mental:{...acknowledgement.triads.mental},
    physical:{...acknowledgement.triads.physical},
    acknowledgementFields:acknowledgement.fields,singularConditions:acknowledgement.singularConditions,representationsByReality:acknowledgement.representationsByReality,
    truthByReality:acknowledgement.truthByReality,
    moiraLimits:basinLimits,flows:[],
    meta:{...acknowledgement.meta,basinIsInterRealityFlowTopology:true,moiraLimitsContextual:true}
  };
  return circuit;
}

export function ensureBasinCircuit(w){
  if(!w.basinCircuit)w.basinCircuit={flows:[],contexts:[],lastByKey:new Map()};
  if(!(w.basinCircuit.lastByKey instanceof Map))w.basinCircuit.lastByKey=new Map(w.basinCircuit.lastByKey||[]);
  return w.basinCircuit;
}

function pushFlow(w,flow){
  const bc=ensureBasinCircuit(w);const x={clock:w.clock,frame:w.frame,elapsedDays:w.elapsedDays,...flow};bc.flows.push(x);
  if(bc.flows.length>6000)bc.flows.splice(0,bc.flows.length-6000);return x;
}
function pushFlowOnChange(w,key,flow,signature,threshold=.06){
  const bc=ensureBasinCircuit(w),prev=bc.lastByKey.get(key);let changed=!prev;
  if(prev&&typeof signature==='number'&&typeof prev.signature==='number')changed=Math.abs(signature-prev.signature)>threshold;
  else if(prev&&JSON.stringify(signature)!==JSON.stringify(prev.signature))changed=true;
  if(!changed)return null;bc.lastByKey.set(key,{signature,frame:w.frame,day:w.elapsedDays});return pushFlow(w,flow);
}

export function recordPreCollapseBasinFlows(w,{activations=[],processes=[],fieldContexts={},superpositions={}}={}){
  const out=[];
  // Perception first acknowledges Physical presence in Consciousness. The same encounter may then
  // be ordered/retained Mentally. This is not a fixed universal ring; it is the actual translation
  // opened by this event family.
  for(const a of activations)if(a.kind?.startsWith('perception_')&&a.kind!=='perception_close'){
    const participants=[a.observer,a.target].filter(Boolean),strength=clamp(a.access??.25);
    out.push(pushFlow(w,{from:'physical',to:'consciousness',kind:'presence_acknowledgement',participants,strength}));
    const observer=w.forms.get(a.observer),retention=observer?.apparatus?.retention??.5;
    out.push(pushFlow(w,{from:'consciousness',to:'mental',kind:'perceptual_ordering',participants,strength:clamp(strength*(.62+retention*.28))}));
  }
  // A held Mental projection can bias which already-live Physical process becomes enacted.
  for(const p of processes)if(p.form&&p.willProjection&&p.willEvent)
    out.push(pushFlow(w,{from:'mental',to:'physical',kind:'will_deflection',participants:[p.form],strength:clamp(p.willProjection?.commitment??.35),cause:p.willEvent.type}));
  // Field-conditioned horizon enters Mental attention/order only when its organisation materially changes.
  for(const [id,h] of Object.entries(superpositions||{}))if(h?.fieldConditioned&&h.liveCount>0){
    const strength=clamp((h.fieldPressure??0)*.45+(h.contraction??0)*.35),sig={live:h.liveCount,contraction:Math.round((h.contraction||0)*20)/20,pressure:Math.round((h.fieldPressure||0)*20)/20};
    const f=pushFlowOnChange(w,`C>M:horizon:${id}`,{from:'consciousness',to:'mental',kind:'horizon_ordering',participants:[id],strength},sig);if(f)out.push(f);
  }
  return out;
}

export function recordPostCollapseBasinFlows(w,{events=[],moments=[]}={}){
  const out=[];const correction=new Set(['material_contact','bodily_contact','material_fracture','material_coupling_break','praxis_impasse','praxis_revision_open','counterfactual_actualised','counterfactual_projection_close','death','animal_death']);
  for(const e of events)if(correction.has(e.type)&&e.momentId)
    out.push(pushFlow(w,{from:'physical',to:'mental',kind:'reality_correction',participants:[e.actor,e.form,e.source,e.target,e.a,e.b].filter(x=>typeof x==='string'),strength:clamp(.18+Math.abs(e.impulse??e.strain??e.bodyDamage??0)*1.5),momentId:e.momentId}));
  for(const e of events)if((e.type==='configuration_pattern_learned'||e.type==='counterfactual_projection_open')&&e.momentId)
    out.push(pushFlow(w,{from:'mental',to:'consciousness',kind:'horizon_expansion',participants:[e.actor,e.person].filter(x=>typeof x==='string'),strength:clamp(.25+(e.confidence??.3)*.35),momentId:e.momentId}));
  return out;
}

export function storeBasinContext(w,circuit){
  const bc=ensureBasinCircuit(w);const x={clock:w.clock,frame:w.frame,elapsedDays:w.elapsedDays,...deep(circuit)};bc.contexts.push(x);
  if(bc.contexts.length>2500)bc.contexts.splice(0,bc.contexts.length-2500);return x;
}

export function basinCircuitAudit(w){
  const bc=ensureBasinCircuit(w),counts={};for(const f of bc.flows){const k=`${f.from}->${f.to}:${f.kind}`;counts[k]=(counts[k]||0)+1;}
  return {flowCount:bc.flows.length,contextCount:bc.contexts.length,flowsByKind:counts,
    intrinsicFormBasins:[...w.forms.values()].filter(f=>Object.prototype.hasOwnProperty.call(f,'basins')||Object.prototype.hasOwnProperty.call(f,'basinCircuit')).map(f=>f.id)};
}
