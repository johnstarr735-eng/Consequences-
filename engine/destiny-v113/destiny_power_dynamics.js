// DESTINY v1.05 — DIFFERENTIAL ACTUALITY / INSCRIPTION AUDIT
//
// Canonical v1.05 correction:
// This module no longer defines Power itself. It measures the RESULTANT inscription / differential
// actuality left by a relational actualisation. Canonical Power belongs to the whole becoming event
// (see destiny_becoming_dynamics.js). The condition is one Ground / Order / Process structure.
// Consciousness / Mental / Physical are different representations of that same inscription.
//
// `computeMomentPower` and `.power` outputs survive as historical compatibility aliases only.

import {clamp} from './destiny_unified_kernel.js';
import {singularFormCondition,representConditionAcrossRealities,REALITY_FIELDS,CONDITION_BRANCHES} from './destiny_condition_realities.js';
import {distance} from './destiny_embodied_geometry.js';

const BRANCHES=CONDITION_BRANCHES;
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const blank=()=>Object.fromEntries(BRANCHES.map(b=>[b,0]));
const clone=x=>x?JSON.parse(JSON.stringify(x)):null;
const meanT=t=>avg(BRANCHES.map(b=>t?.[b]??0));
function addT(a,b,k=1){for(const br of BRANCHES)a[br]+=Math.max(0,b?.[br]??0)*k;return a;}
function normT(t){const o=blank();for(const b of BRANCHES)o[b]=clamp(1-Math.exp(-Math.max(0,t?.[b]??0)));return o;}
function retentionT(before,after){const o=blank();for(const b of BRANCHES){const x=Math.max(.0001,before?.[b]??0),y=Math.max(0,after?.[b]??0);o[b]=clamp(Math.min(x,y)/x);}return o;}
function deltaT(before,after){const o=blank();for(const b of BRANCHES)o[b]=clamp(Math.abs((after?.[b]??0)-(before?.[b]??0))*2);return o;}
function triadFromLegacy(h){
  const out=blank();if(!h)return out;const layers=h.C?['C','M','P']:['consciousness','mind','physical'];
  for(const b of BRANCHES)out[b]=clamp(avg(layers.map(l=>h?.[l]?.[b]??0)));return out;
}
function conditionTriadFromSnapshot(x){return clone(x?.condition?.triad)||triadFromLegacy(x?.hologram);}
function conditionTriadCurrent(w,f){return f?singularFormCondition(w,f).triad:null;}

function eventRawMagnitude(e){
  const keys=['impulse','magnitude','amount','strain','bodyDamage','loss','torque','delta','load','ratio','relativeSpeed','reactionDemand'];
  let s=0,n=0;for(const k of keys){const v=Math.abs(Number(e?.[k]));if(Number.isFinite(v)){s+=v;n++;}}
  if(e?.vector&&Number.isFinite(e.vector.x)&&Number.isFinite(e.vector.y)){s+=Math.hypot(e.vector.x,e.vector.y);n++;}
  return n?s:.10;
}
export function eventActualityWeight(e,resultantChange=0){
  const raw=eventRawMagnitude(e),forceTerm=(1-Math.exp(-raw*.7));
  return clamp(.06+clamp(resultantChange)*.58+forceTerm*.12,.06,.76);
}
function stateDelta(snapshotForm,currentForm,w){
  if(!snapshotForm||!currentForm)return currentForm?1:.85;
  let d=0,n=0;
  if(snapshotForm.alive!==!!currentForm.alive){d+=1;n++;}
  if(snapshotForm.pos&&currentForm.pos){d+=clamp(distance(snapshotForm.pos,currentForm.pos)/1.2);n++;}
  d+=clamp(Math.abs((snapshotForm.orientation??0)-(currentForm.orientation??0))/Math.PI);n++;
  for(const k of ['stock','integrity']){const a=snapshotForm.material?.[k],b=currentForm.material?.[k];if(Number.isFinite(a)&&Number.isFinite(b)){d+=clamp(Math.abs(a-b));n++;}}
  for(const k of ['water','energy','integrity']){const a=snapshotForm.body?.[k],b=currentForm.body?.[k];if(Number.isFinite(a)&&Number.isFinite(b)){d+=clamp(Math.abs(a-b)*2);n++;}}
  const pre=conditionTriadFromSnapshot(snapshotForm),post=conditionTriadCurrent(w,currentForm);
  if(pre&&post){d+=meanT(deltaT(pre,post));n++;}
  return clamp(d/(n||1));
}
function bearerStateDelta(b,w){
  if(!b)return 0;if(b.kind==='form')return stateDelta(b.before,b.after,w);
  if(!b.before&&b.after)return 1;if(b.before&&!b.after)return 1;
  return meanT(deltaT(b.beforeCondition,b.afterCondition));
}
function formBearer(w,s,id){
  const cur=w.forms.get(id),pre=s.forms.get(id);if(!cur&&!pre)return null;
  const condition=cur?conditionTriadCurrent(w,cur):conditionTriadFromSnapshot(pre);
  return {key:`form:${id}`,id,kind:'form',condition:clone(condition),before:pre||null,after:cur||null,beforeCondition:conditionTriadFromSnapshot(pre),afterCondition:cur?conditionTriadCurrent(w,cur):null};
}
function structureMaps(w,s){
  const maps=[];const add=(kind,cur,pre)=>maps.push({kind,cur:cur||new Map(),pre:pre||new Map()});
  add('constraint',w.constraintDynamics?.constraints,s.constraints?.constraints);add('rotational_configuration',w.constraintDynamics?.components,s.constraints?.components);
  add('material_joint',w.materialTopology?.joints,s.topology?.joints);add('material_configuration',w.materialTopology?.configurations,s.topology?.configurations);
  add('structural_edge',w.structuralMechanics?.edges,s.structural?.edges);add('structural_configuration',w.structuralMechanics?.configurations,s.structural?.configurations);return maps;
}
function structureBearer(w,s,id){
  for(const m of structureMaps(w,s)){const cur=m.cur?.get?.(id),pre=m.pre?.get?.(id);if(!cur&&!pre)continue;const x=cur||pre;
    return {key:`${m.kind}:${id}`,id,kind:m.kind,condition:triadFromLegacy(x?.hologram),before:pre||null,after:cur||null,beforeCondition:triadFromLegacy(pre?.hologram),afterCondition:triadFromLegacy(cur?.hologram)};}
  return null;
}
function referencedStructures(e){const xs=[];for(const k of ['constraint','configuration','joint','contact','edge'])if(typeof e?.[k]==='string')xs.push(e[k]);for(const k of ['constraints','configurations','joints','edges'])for(const id of e?.[k]||[])if(typeof id==='string')xs.push(id);return [...new Set(xs)];}
function eventFormIds(e,w){const raw=[e?.actor,e?.form,e?.source,e?.target,e?.a,e?.b,e?.anchor,e?.mediator,e?.rootMaterial,e?.material,...(e?.actors||[]),...(e?.near||[]),...(e?.members||[])];return [...new Set(raw.filter(id=>typeof id==='string'&&w.forms.has(id)))];}
function selfPressureFor(id,seeds,w){let q=0;for(const s of seeds){const e=s.event;if(!e)continue;if(eventFormIds(e,w).includes(id))q+=clamp(1-Math.exp(-eventRawMagnitude(e)*.7));}return clamp(q);}
function reachFor(id,seeds,w){const set=new Set();for(const s of seeds){const e=s.event;if(!e)continue;const ids=eventFormIds(e,w);if(!ids.includes(id))continue;for(const x of ids)if(x!==id)set.add(x);}return set;}
function outcomeCondition(bearers){const out=blank();for(const b of BRANCHES)out[b]=clamp(avg(bearers.map(x=>x?.condition?.[b]??0)));return out;}

// Compatibility projection: the canonical inscription is ONE G/O/P triad. This view shows how
// that same inscription would be legible in each reality using current reality representations.
function realityProjection(w,bearer,conditionInscription){
  const raw={C:blank(),M:blank(),P:blank()};
  let reps=null;
  if(bearer.kind==='form'&&bearer.after){reps=representConditionAcrossRealities(w,bearer.after).representations;}
  const fallback={consciousness:{triad:bearer.condition},mental:{triad:bearer.condition},physical:{triad:bearer.condition}};
  const rr=reps||fallback;const map={C:'consciousness',M:'mental',P:'physical'};
  for(const [l,r] of Object.entries(map))for(const b of BRANCHES)raw[l][b]=clamp((conditionInscription?.[b]??0)*(.5+.5*(rr?.[r]?.triad?.[b]??bearer.condition?.[b]??0)));
  return raw;
}
function named(h){return {consciousness:{...(h?.C||{})},mind:{...(h?.M||{})},physical:{...(h?.P||{})}};}
function fieldActualityFor(id,realityMatrix,fieldProjections){
  const p=fieldProjections?.[id];if(!p)return null;const out={};
  for(const fld of ['cosmic','social','existential']){let num=0,den=0;for(const l of ['C','M','P'])for(const br of BRANCHES){const wgt=Math.max(.0001,p?.[`${l}.${fld}`]?.[br]??0);num+=(realityMatrix?.[l]?.[br]??0)*wgt;den+=wgt;}out[fld]=den?num/den:0;}return out;
}

export function computeActualityAudit(w,s,{participants=[],seeds=[],processes=[],momentHologram=null,fieldProjections={}}={}){
  const bearerMap=new Map();const ensure=b=>{if(b&&!bearerMap.has(b.key))bearerMap.set(b.key,{...b,raw:blank(),surfaces:0,eventWeight:0,reach:new Set(),pressureEvidence:0,selfPersistence:0,stateChange:0});return b?bearerMap.get(b.key):null;};
  for(const id of participants)ensure(formBearer(w,s,id));
  let totalSurfaceWeight=0;
  for(const seed of seeds){
    const e=seed.event;if(!e)continue;const forms=eventFormIds(e,w).map(id=>ensure(formBearer(w,s,id))).filter(Boolean),structures=referencedStructures(e).map(id=>ensure(structureBearer(w,s,id))).filter(Boolean);
    const bs=[...new Map([...forms,...structures].map(b=>[b.key,b])).values()];if(!bs.length)continue;
    const resultantChange=avg(bs.map(b=>bearerStateDelta(b,w))),ew=eventActualityWeight(e,resultantChange);totalSurfaceWeight+=ew;const outcome=outcomeCondition(bs);
    for(const br of BRANCHES){const denom=bs.reduce((q,b)=>q+Math.max(.0001,b.condition?.[br]??0),0);for(const b of bs){const cell=Math.max(.0001,b.condition?.[br]??0),share=cell/denom;b.raw[br]+=ew*share*(.55+.45*(outcome?.[br]??0));}}
    for(const b of bs){b.surfaces++;b.eventWeight+=ew;}for(const b of forms)for(const o of forms)if(o.id!==b.id)b.reach.add(o.id);
  }
  for(const id of participants){
    const b=ensure(formBearer(w,s,id));if(!b)continue;const p=selfPressureFor(id,seeds,w);b.pressureEvidence=p;b.stateChange=stateDelta(b.before,b.after,w);
    const pre=b.beforeCondition,post=b.afterCondition;
    if(pre&&post&&p>0&&b.after?.alive!==false){const r=retentionT(pre,post);b.selfPersistence=meanT(r);b.holdingInscription=clamp(p*b.selfPersistence*(1-b.stateChange*.68));addT(b.raw,r,b.holdingInscription*.58);totalSurfaceWeight+=b.holdingInscription*.58;}else{b.selfPersistence=0;b.holdingInscription=0;}
    for(const x of reachFor(id,seeds,w))b.reach.add(x);
  }
  for(const seed of seeds){const p=seed.process;if(!p?.form)continue;const b=ensure(formBearer(w,s,p.form));if(!b?.condition)continue;const alt=clamp((p.liveAlternatives?.length||0)/5),wgt=.10+.18*alt;addT(b.raw,b.condition,wgt);b.surfaces++;b.eventWeight+=wgt;totalSurfaceWeight+=wgt;}
  const entries=[];
  for(const b of bearerMap.values()){
    const conditionInscription=normT(b.raw),actuality=meanT(conditionInscription),legacyRealityInscription=realityProjection(w,b,conditionInscription);
    const layerActuality={C:avg(BRANCHES.map(br=>legacyRealityInscription.C[br])),M:avg(BRANCHES.map(br=>legacyRealityInscription.M[br])),P:avg(BRANCHES.map(br=>legacyRealityInscription.P[br]))};
    const realityActuality={consciousness:layerActuality.C,mental:layerActuality.M,physical:layerActuality.P};
    const fieldActuality=b.kind==='form'?fieldActualityFor(b.id,legacyRealityInscription,fieldProjections):null;
    entries.push({key:b.key,id:b.id,kind:b.kind,actuality,conditionInscription,condition:clone(b.condition),realityActuality,
      // legacy compatibility outputs
      inscription:legacyRealityInscription,layers:named(legacyRealityInscription),layerActuality,fieldActuality,
      selfPersistence:b.selfPersistence,holdingInscription:b.holdingInscription||0,stateChange:b.stateChange,pressureEvidence:b.pressureEvidence,
      relationalReach:b.reach.size,eventSurfaces:b.surfaces,eventWeight:b.eventWeight,meta:{canonicalPowerBasis:'singular_condition',legacy3x3CompatibilityOnly:true}});
  }
  entries.sort((a,b)=>b.actuality-a.actuality||a.key.localeCompare(b.key));const denom=entries.reduce((q,x)=>q+x.actuality,0)||1;for(const x of entries)x.relativeShare=x.actuality/denom;
  return {definition:'differential_actuality_singular_condition_inscription',momentRelative:true,storedOnForm:false,usesPrestige:false,certifiesTruth:false,notPowerSubstance:true,
    canonicalPowerOntology:'relational_actualisation',canonicalBasis:'singular_condition_ground_order_process',legacy3x3CompatibilityOnly:true,resultantHologram:clone(momentHologram),totalSurfaceWeight,bearers:entries,strongest:entries[0]?.key||null,relativeShares:Object.fromEntries(entries.map(x=>[x.key,x.relativeShare]))};
}

export function actualityAuditSummary(w,{last=200}={}){
  const ms=(w.moments||[]).slice(-last).filter(m=>m.actualityAudit||m.power),audits=ms.map(m=>m.actualityAudit||m.power),readings=audits.flatMap(a=>a?.bearers||[]);
  return {moments:ms.length,bearerReadings:readings.length,maxActuality:Math.max(0,...readings.map(x=>x.actuality||0)),meanActuality:avg(readings.map(x=>x.actuality||0)),
    formsHaveStoredPower:[...w.forms.values()].some(f=>Object.prototype.hasOwnProperty.call(f,'power')||Object.prototype.hasOwnProperty.call(f,'hasPower')),
    allMomentRelative:audits.every(a=>a?.momentRelative===true&&a?.storedOnForm===false),allConditionBased:readings.every(x=>x.conditionInscription&&x.meta?.canonicalPowerBasis==='singular_condition'),allHolographic:readings.every(x=>x.inscription&&x.layers),
    canonicalPowerOntology:'relational_actualisation',auditIsNotPowerSubstance:true};
}

// Historical API aliases. No new causal code should use these names.
export function computeMomentPower(w,s,o={}){
  return {...computeActualityAudit(w,s,o),compatibilityOnly:true,canonicalPowerRef:'becoming.power'};
}
export function powerAuditSummary(w,o={}){return actualityAuditSummary(w,o);}

