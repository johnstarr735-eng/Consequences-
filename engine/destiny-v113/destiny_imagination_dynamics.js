// DESTINY v1.00 — IMAGINATION / SYNTHETIC POSSIBILITY / COUNTERFACTUAL CONFIGURATION
//
// SOURCE-GROUNDED LAW
// - Light & Chaos: human agency expands with experience/knowledge; will forms in relation to a
//   projected reality rather than only the immediately present world.
// - Notebook/narrative material repeatedly gives future form first as image, dream, symbol,
//   promise, plan, or reconstruction before action makes anything physical.
// - Collapse Theory's Simulation vector supplies the hard boundary: a representation can orient
//   reality, but must never be mistaken for Reality itself.
//
// ENGINE LAW
// Imagination is NOT a new Form, Force, Power, inventory, or sovereign creation ex nihilo.
// It is a Mind-layer recombination of already retained Forms + witnessed relation-patterns into a
// not-yet-actual configuration. Will may orient live Processes toward reducing the discrepancy,
// but the configuration becomes actual only when ordinary Physical relations really obtain.
//
// Engineering inference: relation templates, synthesis thresholds, confidence/decay equations,
// current contact-only template grammar, and low-level discrepancy routing.

import {clamp} from './destiny_unified_kernel.js';
import {distance, displacement, unit, formRadius} from './destiny_embodied_geometry.js';
import {finiteMaterialForm} from './destiny_material_dynamics.js';

const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const pairKey=(a,b)=>[a,b].sort().join('|');
const deep=x=>JSON.parse(JSON.stringify(x));

function named(h){return {consciousness:{...h.C},mind:{...h.M},physical:{...h.P}};}
function reflectiveAperture(entity){const a=entity?.apparatus||{};return clamp(Math.sqrt(Math.max(.001,(a.attention??.5)*(a.retention??.5)))*(.72+.28*(a.receptor??.5)));}
function bodyCrisis(es){if(!es?.body)return 0;const cold=Math.abs((es.body.warmth??.72)-.72)*.45;return clamp(Math.max(1-(es.body.energy??1),1-(es.body.water??1),1-(es.body.integrity??1),cold));}
function dominantDriver(drivers){return [...(drivers||[])].sort((a,b)=>(b.weight||0)-(a.weight||0)||String(a.kind).localeCompare(String(b.kind)))[0]||null;}
function snapshotFinite(s,id){const f=s.forms.get(id);return f&&f.alive&&f.kind!=='person'&&f.kind!=='animal'&&f.kind!=='relation'&&f.kind!=='whole'?f:null;}
function isKnown(entity,id){const k=entity.known?.get(id);return k&&(k.confidence??0)>.20;}
function isDirectlyAccessible(w,observer,id){return !!w._accessState?.get(`${observer.id}|${id}`)?.active;}
function configurationActualInSnapshot(s,config){
  // A counterfactual is not made actual by resemblance in Mind or by approximate geometry.
  // Physical relation is certified only after the material-topology layer commits it.
  return false;
}
function configurationActualInWorld(w,config){
  if(!config?.constraints?.length)return false;
  const topo=w.materialTopology;
  return config.constraints.every(c=>{
    if(c.type!=='contact')return false;
    const a=w.forms.get(c.a),b=w.forms.get(c.b);if(!a?.alive||!b?.alive)return false;
    const key=pairKey(c.a,c.b);
    const contact=topo?.contacts instanceof Map?topo.contacts.get(key):null;
    const joint=topo?.joints instanceof Map?topo.joints.get(key):null;
    return !!(contact?.active||joint);
  });
}
function relationTemplateHologram(entity,confidence){
  const r=reflectiveAperture(entity),c=clamp(confidence??.5);
  return {
    C:{ground:clamp(.10+r*.30),order:clamp(.12+c*.34),process:clamp(.08+r*.18)},
    M:{ground:clamp(.16+(entity.apparatus?.retention??.5)*.42),order:clamp(.18+c*.52),process:clamp(.10+r*.28)},
    P:{ground:.08,order:.05,process:.02}
  };
}
function projectionHologram(entity,es,projection){
  const r=reflectiveAperture(entity),conf=clamp(projection.support??.4),novel=projection.actual?0:1,crisis=bodyCrisis(es);
  return {
    C:{ground:clamp(.12+r*.34),order:clamp(.12+novel*.30+conf*.18),process:clamp(.10+conf*.30)},
    M:{ground:clamp(.16+(entity.apparatus?.retention??.5)*.44),order:clamp(.18+conf*.52+novel*.12),process:clamp(.14+r*.28+conf*.22)},
    // Physical layer is a constraint/feasibility reading, NOT the projected configuration being physically real.
    P:{ground:clamp(.06+(1-crisis)*.20),order:clamp(.04+projection.physicalFeasibility*.22),process:projection.actual?.18:.015}
  };
}

export function ensureImaginationState(w,entity){
  if(!w._counterfactualSerial)w._counterfactualSerial=0;
  if(!entity.configurationMemory)entity.configurationMemory=[];
  if(!entity.counterfactualHistory)entity.counterfactualHistory=[];
  if(entity.counterfactualProjection===undefined)entity.counterfactualProjection=null;
}

function rememberTemplate(w,entity,a,b,type='contact',dtDays=w.time?.dtDays??1/24){
  ensureImaginationState(w,entity);
  const sourcePair=pairKey(a,b),existing=entity.configurationMemory.find(t=>t.relation===type&&t.sourcePair===sourcePair);
  const attention=clamp(entity.apparatus?.attention??.5),retention=clamp(entity.apparatus?.retention??.5);
  if(existing){
    // Continued observation strengthens memory by physical duration, not by number of solver frames.
    const last=existing.lastObservedDay??-Infinity;if(Math.abs((w.elapsedDays??0)-last)>1e-10){
      const alpha=1-Math.exp(-Math.max(0,dtDays)/.50);
      existing.confidence=clamp(existing.confidence+(1-existing.confidence)*alpha*(.24+.46*attention+.18*retention));
      existing.observedDays=(existing.observedDays||0)+dtDays;existing.lastObservedDay=w.elapsedDays;existing.lastDay=w.elapsedDays;
      existing.hologram=relationTemplateHologram(entity,existing.confidence);existing.layers=named(existing.hologram);
    }
    return null;
  }
  const confidence=clamp(.30+.38*attention+.18*retention);
  const h=relationTemplateHologram(entity,confidence);
  const rec={id:`CT:${entity.id}:${entity.configurationMemory.length+1}`,relation:type,sourcePair,sourceForms:[a,b],learnedDay:w.elapsedDays,lastDay:w.elapsedDays,lastObservedDay:w.elapsedDays,observedDays:dtDays,confidence,hologram:h,layers:named(h)};
  entity.configurationMemory.push(rec);if(entity.configurationMemory.length>96)entity.configurationMemory.splice(0,entity.configurationMemory.length-96);
  return {type:'configuration_pattern_learned',actor:entity.id,template:rec.id,relation:type,sourceForms:[a,b],confidence};
}

// Called after Physical commit. A Person can only learn a relation-pattern if both constituent
// Forms were directly accessible in the interval or the Person was itself a participant.
export function commitImaginationDynamics(w,events=[]){
  const out=[],people=[...w.forms.values()].filter(f=>f.alive&&f.kind==='person').sort((a,b)=>a.id.localeCompare(b.id));
  // Experience does not require witnessing the birth of a relation. A currently accessible
  // configuration can itself teach its pattern. Newly opened contacts are included because the
  // topology has already been committed before this function runs.
  const contacts=w.materialTopology?.contacts instanceof Map?[...w.materialTopology.contacts.values()].filter(c=>c.active):[];
  const joints=w.materialTopology?.joints instanceof Map?[...w.materialTopology.joints.values()]:[];
  const seenPairs=new Set();
  // Newly opened relations are also legitimate observed actuality. This event path mainly makes
  // the learning contract explicit and keeps laboratory/world instrumentation equivalent.
  for(const e of events){
    if(e.type!=='material_topology_contact_open'&&e.type!=='material_joint_open')continue;
    const a=e.a,b=e.b;if(!a||!b)continue;const key=pairKey(a,b);seenPairs.add(key);
    for(const p of people){const witnessed=(isDirectlyAccessible(w,p,a)&&isDirectlyAccessible(w,p,b))||p.id===a||p.id===b;if(!witnessed)continue;const evt=rememberTemplate(w,p,a,b,'contact',w.time?.dtDays??1/24);if(evt)out.push(evt);}
  }
  for(const rel of [...contacts,...joints]){
    const a=rel.a,b=rel.b,key=pairKey(a,b);if(seenPairs.has(key))continue;seenPairs.add(key);
    for(const p of people){
      const witnessed=(isDirectlyAccessible(w,p,a)&&isDirectlyAccessible(w,p,b))||p.id===a||p.id===b;
      if(!witnessed)continue;const evt=rememberTemplate(w,p,a,b,'contact',w.time?.dtDays??1/24);if(evt)out.push(evt);
    }
  }
  for(const p of people){
    ensureImaginationState(w,p);const cf=p.counterfactualProjection;if(!cf)continue;
    if(configurationActualInWorld(w,cf.configuration)){
      cf.actual=true;cf.status='actualised';cf.actualisedDay=w.elapsedDays;
      if(p.willProjection?.counterfactualId===cf.id&&p.willProjection?.projectedConfiguration){
        p.willProjection.projectedConfiguration.actual=true;
      }
      const evt={type:'counterfactual_actualised',actor:p.id,counterfactual:cf.id,forms:[...cf.configuration.nodes],template:cf.sourceTemplate};
      p.counterfactualHistory.push({clock:w.clock,...evt});out.push(evt);p.counterfactualProjection=null;
    }
  }
  for(const p of people){if((p.counterfactualHistory||[]).length>240)p.counterfactualHistory.splice(0,p.counterfactualHistory.length-240);}
  return out;
}

function knownMaterials(entity,s){
  const out=[];
  for(const [id,k] of entity.known||[]){const f=snapshotFinite(s,id);if(!f||!finiteMaterialForm(f))continue;out.push({f,confidence:k.confidence??.3,lastPos:k.lastPos||f.pos,distance:distance(entity.pos||f.pos,f.pos)});}
  return out.sort((a,b)=>b.confidence-a.confidence||a.f.id.localeCompare(b.f.id));
}
function currentCoupling(w,actorId,materialId){const c=w.materialCouplings?.get(materialId);return c?.anchor===actorId?c:null;}
function goalForCounterfactual(w,entity,es,s,cf){
  const [aId,bId]=cf.configuration.nodes,a=s.forms.get(aId),b=s.forms.get(bId);if(!a?.alive||!b?.alive)return null;
  const ca=currentCoupling(w,entity.id,aId),cb=currentCoupling(w,entity.id,bId);
  const contactGap=(a.geometry?.radius??.2)+(b.geometry?.radius??.2)+.006;
  if(ca){
    let d=unit(displacement(b.pos,a.pos));if(Math.hypot(d.x,d.y)<1e-9)d={x:1,y:0};
    const desiredA={x:b.pos.x+d.x*contactGap,y:b.pos.y+d.y*contactGap};
    return {x:desiredA.x-(ca.offset?.x||0),y:desiredA.y-(ca.offset?.y||0),phase:'transport_a'};
  }
  if(cb){
    let d=unit(displacement(a.pos,b.pos));if(Math.hypot(d.x,d.y)<1e-9)d={x:-1,y:0};
    const desiredB={x:a.pos.x+d.x*contactGap,y:a.pos.y+d.y*contactGap};
    return {x:desiredB.x-(cb.offset?.x||0),y:desiredB.y-(cb.offset?.y||0),phase:'transport_b'};
  }
  // No retained physical coupling yet: imagination does not invent one. The next discrepancy is
  // simply getting the body into ordinary manipulation/contact range of the focus Form.
  const focus=s.forms.get(cf.focus);if(!focus)return null;
  let d=unit(displacement(focus.pos,es.pos));if(Math.hypot(d.x,d.y)<1e-9)d={x:-1,y:0};
  const gap=(es.geometry?.reach??.5)+(focus.geometry?.radius??.2)-.015;
  return {x:focus.pos.x+d.x*Math.max(.05,gap),y:focus.pos.y+d.y*Math.max(.05,gap),phase:'approach_focus'};
}
function chooseTemplate(entity){return [...(entity.configurationMemory||[])].filter(t=>t.relation==='contact').sort((a,b)=>(b.confidence||0)-(a.confidence||0)||a.id.localeCompare(b.id))[0]||null;}
function projectionCandidate(w,entity,es,s,drivers){
  const will=entity.willProjection;if(!will?.target||will.counterfactualId)return null;
  // Imagination elaborates a projected future only after a simple Will has persisted long enough to
  // remain unresolved. This is a conservative bridge, not a claim that imagination only exists under Will.
  if((will.supportedDays||0)<.12||(will.commitment||0)<.10)return null;
  const focus=snapshotFinite(s,will.target);if(!focus||!finiteMaterialForm(focus)||!isKnown(entity,focus.id))return null;
  const template=chooseTemplate(entity);if(!template)return null;
  const materials=knownMaterials(entity,s).filter(x=>x.f.id!==focus.id&&pairKey(x.f.id,focus.id)!==template.sourcePair);
  if(!materials.length)return null;
  // Prefer a well-known, nearby constituent whose current relation to focus does NOT already instantiate the template.
  const secondary=materials.find(x=>distance(x.f.pos,focus.pos)>(x.f.geometry?.radius??.2)+(focus.geometry?.radius??.2)+.08);if(!secondary)return null;
  const reflective=reflectiveAperture(entity),crisis=bodyCrisis(es);if(reflective<.42||crisis>.62)return null;
  const maxDistance=(focus.geometry?.radius??.2)+(secondary.f.geometry?.radius??.2)+.025;
  const configuration={synthetic:true,actual:false,nodes:[focus.id,secondary.f.id],constraints:[{type:'contact',a:focus.id,b:secondary.f.id,maxDistance}],sourceTemplate:template.id};
  const physicalFeasibility=clamp(avg([1-crisis,entity.capacities?.manipulation??.5,template.confidence??.4,secondary.confidence]));
  const support=clamp((template.confidence??.4)*.34+(secondary.confidence??.3)*.20+reflective*.30+physicalFeasibility*.16);
  return {focus:focus.id,secondary:secondary.f.id,configuration,sourceTemplate:template.id,support,physicalFeasibility};
}

// Called during Process generation. This changes Mind/Will horizon only; it never mutates Physical Forms.
export function prepareSyntheticPossibility(w,entity,es,s,drivers,{dtDays=1/24}={}){
  if(entity?.kind!=='person')return {projection:null,events:[]};ensureImaginationState(w,entity);
  let cf=entity.counterfactualProjection;const events=[];
  if(cf){
    const forms=cf.configuration.nodes.map(id=>s.forms.get(id));
    if(forms.some(f=>!f?.alive)){
      const evt={type:'counterfactual_projection_close',actor:entity.id,counterfactual:cf.id,reason:'form_loss'};entity.counterfactualHistory.push({clock:w.clock,...evt});events.push(evt);entity.counterfactualProjection=null;cf=null;
    }else if(configurationActualInSnapshot(s,cf.configuration)){
      cf.actual=true; // Physical actualisation will be recorded by commitImaginationDynamics if not already recorded.
    }else{
      const dom=dominantDriver(drivers),stillRelevant=entity.willProjection?.target===cf.focus||dom?.target===cf.focus;
      const reflective=reflectiveAperture(entity),crisis=bodyCrisis(es);
      cf.support=clamp((cf.support||0)+dtDays*(stillRelevant?.22:-.34)*reflective-dtDays*crisis*.42);
      cf.lastDay=w.elapsedDays;cf.physicalFeasibility=clamp((cf.physicalFeasibility||.4)*(1-dtDays*.04)+(1-crisis)*dtDays*.04);
      const g=goalForCounterfactual(w,entity,es,s,cf);if(g){cf.goalPos={x:g.x,y:g.y};cf.phase=g.phase;}
      cf.hologram=projectionHologram(entity,es,cf);cf.layers=named(cf.hologram);
      if(cf.support<.04||crisis>.93){const evt={type:'counterfactual_projection_close',actor:entity.id,counterfactual:cf.id,reason:crisis>.93?'bodily_crisis':'loss_of_support'};entity.counterfactualHistory.push({clock:w.clock,...evt});events.push(evt);entity.counterfactualProjection=null;cf=null;}
    }
  }
  if(!cf){
    const cand=projectionCandidate(w,entity,es,s,drivers);
    if(cand){
      const id=`CF${++w._counterfactualSerial}`;cf={id,formedDay:w.elapsedDays,lastDay:w.elapsedDays,status:'counterfactual',actual:false,...cand};
      const g=goalForCounterfactual(w,entity,es,s,cf);if(g){cf.goalPos={x:g.x,y:g.y};cf.phase=g.phase;}
      cf.hologram=projectionHologram(entity,es,cf);cf.layers=named(cf.hologram);entity.counterfactualProjection=cf;
      const evt={type:'counterfactual_projection_open',actor:entity.id,counterfactual:id,forms:[...cf.configuration.nodes],sourceTemplate:cf.sourceTemplate,phase:cf.phase};
      entity.counterfactualHistory.push({clock:w.clock,...evt});events.push(evt);
    }
  }
  return {projection:cf?deep(cf):null,events};
}

export function imaginationAudit(w){
  const people=[...w.forms.values()].filter(f=>f.kind==='person'),active=people.filter(p=>p.counterfactualProjection),history=people.flatMap(p=>p.counterfactualHistory||[]),mem=people.flatMap(p=>p.configurationMemory||[]);
  return {active:active.length,templates:mem.length,opens:history.filter(e=>e.type==='counterfactual_projection_open').length,
    actualised:history.filter(e=>e.type==='counterfactual_actualised').length,closes:history.filter(e=>e.type==='counterfactual_projection_close').length,
    meanSupport:active.length?avg(active.map(p=>p.counterfactualProjection.support||0)):0,
    representedAsForms:[...w.forms.values()].filter(f=>String(f.kind).includes('counterfactual')||String(f.kind).includes('imagination')).length};
}
