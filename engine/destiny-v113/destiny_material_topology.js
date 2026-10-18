// DESTINY v0.96 — CONFIGURATIONAL TOPOLOGY + VECTORIAL STRUCTURAL INTEGRATION
//
// Source-backed claim: material Forms can enter relations/configurations that alter how Force
// is transmitted and whether a structure holds or folds. Purpose is not intrinsic.
//
// Engineering layer: this module approximates material-material contact networks, retained
// low-slip joints, distributed load, and configuration history in the current 2D circular world.
// Contact/joint thresholds and formulas are NOT Theory claims.

import {clamp, intrinsicHologram} from './destiny_unified_kernel.js';
import {distance, displacement, vectorLength, formRadius, clampPosition} from './destiny_embodied_geometry.js';
import {finiteMaterialForm, materialConductance, materialResistance, materialMassLike} from './destiny_material_dynamics.js';

const EPS=1e-8;
const BRANCHES=['ground','order','process'];
const LAYERS=['C','M','P'];
const pairKey=(a,b)=>[a,b].sort().join('|');
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);

function namedLayers(h){return {consciousness:{...(h?.C||{})},mind:{...(h?.M||{})},physical:{...(h?.P||{})}};}
function aggregateHolograms(hs){
  const good=hs.filter(Boolean),out={};
  for(const l of LAYERS){out[l]={};for(const b of BRANCHES)out[l][b]=clamp(avg(good.map(h=>h?.[l]?.[b]??0)));}
  return out;
}

export function ensureMaterialTopology(w){
  if(!w.materialTopology)w.materialTopology={contacts:new Map(),joints:new Map(),configurations:new Map(),history:[]};
  if(!(w.materialTopology.contacts instanceof Map))w.materialTopology.contacts=new Map(w.materialTopology.contacts||[]);
  if(!(w.materialTopology.joints instanceof Map))w.materialTopology.joints=new Map(w.materialTopology.joints||[]);
  if(!(w.materialTopology.configurations instanceof Map))w.materialTopology.configurations=new Map(w.materialTopology.configurations||[]);
  if(!Array.isArray(w.materialTopology.history))w.materialTopology.history=[];
  return w.materialTopology;
}

export function topologyEdgeHologram(w,a,b,edge={}){
  const ah=intrinsicHologram(w,a),bh=intrinsicHologram(w,b),base=aggregateHolograms([ah,bh]);
  const persistence=clamp((edge.durationDays??0)/3),strength=clamp(edge.strength??edge.retention??0),load=clamp(edge.load??0),conduct=clamp(edge.conductance??avg([materialConductance(a),materialConductance(b)]));
  const out=JSON.parse(JSON.stringify(base));
  out.C.ground=clamp(out.C.ground*.76+(1-strength)*.24);
  out.C.order=clamp(out.C.order*.72+conduct*.28);
  out.C.process=clamp(out.C.process*.65+Math.max(load,edge.active?0.12:0)*.35);
  out.M.ground=clamp(out.M.ground*.72+persistence*.28);
  out.M.order=clamp(out.M.order*.60+strength*.24+(edge.active?.16:0));
  out.M.process=clamp(out.M.process*.72+load*.28);
  out.P.ground=clamp(out.P.ground*.62+avg([materialMassLike(a),materialMassLike(b)])*.38);
  out.P.order=clamp(out.P.order*.58+(edge.active?.24:0)+strength*.18);
  out.P.process=clamp(out.P.process*.62+load*.38);
  return out;
}

export function topologyConfigurationHologram(w,members,edges=[]){
  const forms=members.map(id=>w.forms.get(id)).filter(Boolean),base=aggregateHolograms(forms.map(f=>intrinsicHologram(w,f)));
  const edgeStrength=avg(edges.map(e=>e.strength??e.retention??0)),load=avg(edges.map(e=>e.load??0)),density=clamp(edges.length/Math.max(1,members.length));
  const out=JSON.parse(JSON.stringify(base));
  out.C.order=clamp(out.C.order*.70+(1-density)*.30);
  out.C.process=clamp(out.C.process*.72+load*.28);
  out.M.ground=clamp(out.M.ground*.72+clamp(members.length/8)*.28);
  out.M.order=clamp(out.M.order*.55+density*.25+edgeStrength*.20);
  out.M.process=clamp(out.M.process*.72+load*.28);
  out.P.ground=clamp(out.P.ground*.70+clamp(forms.reduce((s,f)=>s+materialMassLike(f),0)/4)*.30);
  out.P.order=clamp(out.P.order*.56+density*.28+edgeStrength*.16);
  out.P.process=clamp(out.P.process*.66+load*.34);
  return out;
}

export function initializeFiniteMaterialPositions(w){
  ensureMaterialTopology(w);
  if(w._materialTopologyPositionsInitialized)return;
  const solids=[...w.forms.values()].filter(f=>finiteMaterialForm(f)).sort((a,b)=>a.id.localeCompare(b.id));
  const placed=[];
  for(const f of solids){
    const r=formRadius(f),base=clampPosition(f.pos,w.w,w.h,r);
    const clear=p=>placed.every(o=>distance(p,o.pos)>=r+o.r+.01);
    let chosen=base;
    if(!clear(chosen)){
      let h=0;for(const ch of f.id)h=(h*33+ch.charCodeAt(0))>>>0;const phase=(h%360)*Math.PI/180;
      outer:for(let ring=1;ring<=18;ring++){
        const rad=.055*ring;
        for(let i=0;i<32;i++){
          const a=phase+i*Math.PI/16,c=clampPosition({x:base.x+Math.cos(a)*rad,y:base.y+Math.sin(a)*rad},w.w,w.h,r);
          if(clear(c)){chosen=c;break outer;}
        }
      }
    }
    f.pos={...chosen};f.prevPos={...chosen};placed.push({id:f.id,pos:{...chosen},r});
  }
  w._materialTopologyPositionsInitialized=true;
}

function relativeSlip(a,b,dt){
  const ap=a.prevPos||a.pos,bp=b.prevPos||b.pos;
  const av=displacement(ap,a.pos),bv=displacement(bp,b.pos);
  return vectorLength({x:av.x-bv.x,y:av.y-bv.y})/Math.max(1e-9,dt);
}

export function materialRetentionPotential(a,b){
  const A=a.material||{},B=b.material||{};
  const fiber=Math.sqrt(Math.max(0,A.fiber??0)*Math.max(0,B.fiber??0));
  const compliance=Math.sqrt(Math.max(.01,A.elasticity??.06)*Math.max(.01,B.elasticity??.06));
  const porous=Math.sqrt(Math.max(.01,A.permeability??.25)*Math.max(.01,B.permeability??.25));
  const hardPenalty=avg([A.hardness??0,B.hardness??0])*.20;
  const mismatch=Math.abs((A.rigidity??0)-(B.rigidity??0))*.12;
  return clamp(fiber*.46+compliance*.24+porous*.16-hardPenalty-mismatch);
}

function edgeConductance(a,b,retention=0){return clamp(Math.sqrt(materialConductance(a)*materialConductance(b))*(.72+.28*retention));}
function edgeStrength(a,b,retention){
  const res=Math.sqrt(materialResistance(a)*materialResistance(b));
  return clamp(.06+retention*.58+res*.24, .05,.92);
}

function currentMaterialForms(w){return [...w.forms.values()].filter(f=>finiteMaterialForm(f)).sort((a,b)=>a.id.localeCompare(b.id));}
function materialLoadMap(materialEvents=[]){
  const out=new Map();
  const add=(id,q)=>{if(!id||!Number.isFinite(q))return;out.set(id,(out.get(id)||0)+Math.max(0,q));};
  for(const e of materialEvents){
    if(e.type==='material_strain')add(e.form,Math.max(e.strain??0,(e.loss??0)*4));
    else if(e.type==='force_mediation'){add(e.mediator,e.impulse??0);if(e.targetKind==='material')add(e.target,e.impulse??0);}
    else if(e.type==='material_contact')add(e.material,(e.relativeSpeed??0)*.02);
  }
  return out;
}

function touching(a,b,edge=null){
  const d=distance(a.pos,b.pos),sum=formRadius(a)+formRadius(b);
  const tol=edge?.active?.045:.018;
  return d<=sum+tol;
}

function componentMembersFromEdges(forms,edges){
  const adj=new Map(forms.map(f=>[f.id,new Set()]));
  for(const e of edges){if(!adj.has(e.a)||!adj.has(e.b))continue;adj.get(e.a).add(e.b);adj.get(e.b).add(e.a);}
  const seen=new Set(),components=[];
  for(const id of [...adj.keys()].sort()){
    if(seen.has(id)||adj.get(id).size===0)continue;
    const q=[id],comp=[];seen.add(id);
    while(q.length){const x=q.shift();comp.push(x);for(const y of [...adj.get(x)].sort())if(!seen.has(y)){seen.add(y);q.push(y);}}
    if(comp.length>1)components.push(comp.sort());
  }
  return components;
}

function configurationId(members){return `CFG:${members.join('+')}`;}

function refreshConfigurations(w){
  const topo=ensureMaterialTopology(w),forms=currentMaterialForms(w);
  const activeEdges=[...topo.contacts.values()].filter(e=>e.active).concat([...topo.joints.values()].filter(e=>e.active));
  const comps=componentMembersFromEdges(forms,activeEdges),next=new Map(),events=[];
  for(const members of comps){
    const edges=activeEdges.filter(e=>members.includes(e.a)&&members.includes(e.b)),id=configurationId(members),prev=topo.configurations.get(id);
    const rec={id,members,edges:edges.map(e=>e.id),active:true,since:prev?.since??(w.elapsedDays??0),last:w.elapsedDays??0,
      load:avg(edges.map(e=>e.load??0)),hologram:null,layers:null};
    rec.hologram=topologyConfigurationHologram(w,members,edges);rec.layers=namedLayers(rec.hologram);next.set(id,rec);
    if(!prev)events.push({type:'material_configuration_open',configuration:id,members:[...members]});
  }
  for(const [id,prev] of topo.configurations)if(!next.has(id))events.push({type:'material_configuration_close',configuration:id,members:[...(prev.members||[])]});
  topo.configurations=next;return events;
}

function maybeOpenJoint(w,contact){
  const topo=ensureMaterialTopology(w),a=w.forms.get(contact.a),b=w.forms.get(contact.b);if(!a?.alive||!b?.alive)return null;
  const key=pairKey(a.id,b.id);if(topo.joints.has(key))return null;
  // Retention is an engineering bridge: sustained low-slip contact under real load plus compatible
  // material structure may create a retained material relation. It is not a Theory statement that
  // touching matter "wants" to bind.
  const retention=materialRetentionPotential(a,b);
  if(contact.durationDays<.12||contact.load<.08||contact.maxSlip>.28||retention<.48)return null;
  const offset=displacement(a.pos,b.pos),strength=edgeStrength(a,b,retention),conductance=edgeConductance(a,b,retention);
  const j={id:`MJ:${key}`,a:a.id,b:b.id,active:true,opened:w.elapsedDays??0,last:w.elapsedDays??0,offset:{...offset},strength,retention,conductance,load:contact.load,hologram:null,layers:null};
  j.hologram=topologyEdgeHologram(w,a,b,j);j.layers=namedLayers(j.hologram);topo.joints.set(key,j);
  return {type:'material_joint_open',joint:j.id,a:j.a,b:j.b,strength,retention};
}

function breakJointIfNeeded(w,j,loadMap,dt){
  const a=w.forms.get(j.a),b=w.forms.get(j.b);if(!a?.alive||!b?.alive)return {type:'material_joint_break',joint:j.id,a:j.a,b:j.b,reason:'form_loss'};
  const d=distance(a.pos,b.pos),rest=vectorLength(j.offset),stretch=Math.abs(d-rest)/Math.max(.03,rest),load=(loadMap.get(a.id)||0)+(loadMap.get(b.id)||0);
  const alpha=1-Math.exp(-Math.max(0,dt)/.12);j.load=clamp(j.load*(1-alpha)+load*alpha,0,4);j.last=w.elapsedDays??0;
  if(stretch>j.strength*(.32+.28*(1-j.retention))||j.load>j.strength*3.8)return {type:'material_joint_break',joint:j.id,a:j.a,b:j.b,reason:stretch>.2?'separation_strain':'distributed_load',stretch,load:j.load};
  j.hologram=topologyEdgeHologram(w,a,b,j);j.layers=namedLayers(j.hologram);return null;
}

function propagateDistributedLoad(w,loadMap){
  const topo=ensureMaterialTopology(w),events=[];
  if(!loadMap.size)return events;
  const edges=[...topo.contacts.values()].filter(e=>e.active).map(e=>({...e,edgeType:'contact',conductance:e.conductance??.35}))
    .concat([...topo.joints.values()].filter(e=>e.active).map(e=>({...e,edgeType:'joint',conductance:e.conductance??.5})));
  const adj=new Map();for(const e of edges){if(!adj.has(e.a))adj.set(e.a,[]);if(!adj.has(e.b))adj.set(e.b,[]);adj.get(e.a).push({edge:e,to:e.b});adj.get(e.b).push({edge:e,to:e.a});}
  const received=new Map();
  for(const [source,q0] of loadMap){
    if(q0<.025)continue;
    const queue=[{id:source,q:q0,depth:0}],best=new Map([[source,q0]]);
    while(queue.length){const cur=queue.shift();if(cur.depth>=3)continue;
      for(const x of adj.get(cur.id)||[]){
        const transmitted=cur.q*x.edge.conductance*(x.edge.edgeType==='joint'?.62:.34);
        if(transmitted<.012)continue;
        if(transmitted<=(best.get(x.to)||0)*1.02)continue;best.set(x.to,transmitted);
        if(x.to!==source)received.set(x.to,(received.get(x.to)||0)+transmitted);
        queue.push({id:x.to,q:transmitted,depth:cur.depth+1});
      }
    }
  }
  for(const [id,q] of received){
    const f=w.forms.get(id);if(!f?.alive||!finiteMaterialForm(f))continue;
    const resistance=materialResistance(f),mass=materialMassLike(f),strain=q/Math.max(.04,mass*(.8+resistance));
    // v0.96 compatibility trace only. Canonical structural consequence is now directional and lives
    // in destiny_structural_mechanics.js. Do not let this legacy scalar path apply a second injury.
    if(strain>.035)events.push({type:'distributed_material_load',form:id,load:q,strain,loss:0,integrity:f.material.integrity??1,numerical:true,legacyScalar:true});
  }
  return events;
}

export function commitMaterialTopology(w,materialEvents=[]){
  const topo=ensureMaterialTopology(w),dt=w.time?.dtDays??1/24,forms=currentMaterialForms(w),loadMap=materialLoadMap(materialEvents),events=[];
  const present=new Set();
  for(let i=0;i<forms.length;i++)for(let j=i+1;j<forms.length;j++){
    const a=forms[i],b=forms[j],key=pairKey(a.id,b.id),prev=topo.contacts.get(key),active=touching(a,b,prev);
    if(!active){if(prev?.active){prev.active=false;prev.last=w.elapsedDays??0;events.push({type:'material_topology_contact_close',a:a.id,b:b.id});}continue;}
    present.add(key);const slip=relativeSlip(a,b,dt),load=(loadMap.get(a.id)||0)+(loadMap.get(b.id)||0);
    const rec=prev||{id:`MT:${key}`,a:a.id,b:b.id,active:true,since:w.elapsedDays??0,durationDays:0,maxSlip:0,load:0};
    const opened=!prev?.active;rec.active=true;rec.last=w.elapsedDays??0;rec.durationDays=(prev?.active?rec.durationDays:0)+dt;
    const slipDecay=Math.exp(-Math.max(0,dt)/.50),loadAlpha=1-Math.exp(-Math.max(0,dt)/.12);
    rec.maxSlip=Math.max((prev?.active?rec.maxSlip:0)*slipDecay,slip);rec.load=clamp(rec.load*(1-loadAlpha)+load*loadAlpha,0,4);
    rec.retention=materialRetentionPotential(a,b);rec.conductance=edgeConductance(a,b,0);rec.hologram=topologyEdgeHologram(w,a,b,rec);rec.layers=namedLayers(rec.hologram);topo.contacts.set(key,rec);
    if(opened)events.push({type:'material_topology_contact_open',a:a.id,b:b.id,contact:rec.id});
    const jointEvent=maybeOpenJoint(w,rec);if(jointEvent)events.push(jointEvent);
  }
  for(const [key,c] of topo.contacts)if(c.active&&!present.has(key)){c.active=false;c.last=w.elapsedDays??0;events.push({type:'material_topology_contact_close',a:c.a,b:c.b});}
  for(const [key,j] of [...topo.joints]){const br=breakJointIfNeeded(w,j,loadMap,dt);if(br){topo.joints.delete(key);events.push(br);}}
  events.push(...propagateDistributedLoad(w,loadMap));
  events.push(...refreshConfigurations(w));
  for(const e of events)topo.history.push({time:w.elapsedDays??0,...e});if(topo.history.length>4000)topo.history.splice(0,topo.history.length-4000);
  return events;
}

export function snapshotMaterialTopology(w){
  const topo=ensureMaterialTopology(w);
  const clone=e=>({id:e.id,a:e.a,b:e.b,active:e.active,since:e.since,opened:e.opened,last:e.last,durationDays:e.durationDays,maxSlip:e.maxSlip,load:e.load,strength:e.strength,retention:e.retention,conductance:e.conductance,offset:e.offset?{...e.offset}:undefined,hologram:e.hologram?JSON.parse(JSON.stringify(e.hologram)):null,layers:e.layers?JSON.parse(JSON.stringify(e.layers)):null});
  return Object.freeze({contacts:new Map([...topo.contacts].filter(([,e])=>e.active).map(([k,e])=>[k,clone(e)])),joints:new Map([...topo.joints].map(([k,e])=>[k,clone(e)])),configurations:new Map([...topo.configurations].map(([k,e])=>[k,{...e,members:[...e.members],edges:[...e.edges],hologram:JSON.parse(JSON.stringify(e.hologram)),layers:JSON.parse(JSON.stringify(e.layers))}]))});
}

export function materialTopologyAudit(w){
  const topo=ensureMaterialTopology(w);
  return {activeContacts:[...topo.contacts.values()].filter(e=>e.active).length,activeJoints:topo.joints.size,configurations:topo.configurations.size,
    largestConfiguration:Math.max(0,...[...topo.configurations.values()].map(c=>c.members.length)),history:topo.history.length,
    holographicEdges:[...topo.contacts.values()].filter(e=>e.active&&e.hologram&&e.layers).length+[...topo.joints.values()].filter(e=>e.hologram&&e.layers).length,
    holographicConfigurations:[...topo.configurations.values()].filter(e=>e.hologram&&e.layers).length};
}
