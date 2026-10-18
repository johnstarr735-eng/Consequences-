// DESTINY v0.96 — VECTORIAL FORCE / STRUCTURAL STRESS
//
// Source-backed claim: Force has direction and moves through relational conduits; a material
// configuration may transmit pressure differently according to its relations and material Form.
// This module therefore distinguishes compression, tension and transverse/shear demand across
// material topology. It does NOT introduce Beam, Rope, Wall, Bridge, Tool or Building kinds.
//
// Engineering inference (not Theory): vector decomposition, numerical capacities, stress-memory
// constants, overload thresholds, and the present 2D contact/joint mechanics.

import {clamp, intrinsicHologram} from './destiny_unified_kernel.js';
import {distance, displacement, vectorLength, unit, dot} from './destiny_embodied_geometry.js';
import {finiteMaterialForm, materialResistance, materialConductance, materialMassLike} from './destiny_material_dynamics.js';

const LAYERS=['C','M','P'];
const BRANCHES=['ground','order','process'];
const pairKey=(a,b)=>[a,b].sort().join('|');
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const vadd=(a,b)=>({x:(a?.x||0)+(b?.x||0),y:(a?.y||0)+(b?.y||0)});
const vscale=(a,k)=>({x:(a?.x||0)*k,y:(a?.y||0)*k});
const vsub=(a,b)=>({x:(a?.x||0)-(b?.x||0),y:(a?.y||0)-(b?.y||0)});
const vmagnitude=vectorLength;
const normalized=(v)=>unit(v);

function namedLayers(h){return {consciousness:{...(h?.C||{})},mind:{...(h?.M||{})},physical:{...(h?.P||{})}};}
function aggregateHolograms(hs){
  const good=hs.filter(Boolean),out={};
  for(const l of LAYERS){out[l]={};for(const b of BRANCHES)out[l][b]=clamp(avg(good.map(h=>h?.[l]?.[b]??0)));}
  return out;
}

export function ensureStructuralMechanics(w){
  if(!w.structuralMechanics)w.structuralMechanics={edges:new Map(),configurations:new Map(),history:[],lastNodeLoads:new Map()};
  if(!(w.structuralMechanics.edges instanceof Map))w.structuralMechanics.edges=new Map(w.structuralMechanics.edges||[]);
  if(!(w.structuralMechanics.configurations instanceof Map))w.structuralMechanics.configurations=new Map(w.structuralMechanics.configurations||[]);
  if(!(w.structuralMechanics.lastNodeLoads instanceof Map))w.structuralMechanics.lastNodeLoads=new Map(w.structuralMechanics.lastNodeLoads||[]);
  if(!Array.isArray(w.structuralMechanics.history))w.structuralMechanics.history=[];
  return w.structuralMechanics;
}

function materialPairProperties(a,b){
  const A=a?.material||{},B=b?.material||{};
  const resistance=Math.sqrt(materialResistance(a)*materialResistance(b));
  const conductance=Math.sqrt(materialConductance(a)*materialConductance(b));
  const fiber=Math.sqrt(Math.max(0,A.fiber??0)*Math.max(0,B.fiber??0));
  const elasticity=Math.sqrt(Math.max(.001,A.elasticity??.04)*Math.max(.001,B.elasticity??.04));
  const hardness=Math.sqrt(Math.max(.001,A.hardness??.04)*Math.max(.001,B.hardness??.04));
  const rigidity=Math.sqrt(Math.max(.001,A.rigidity??.04)*Math.max(.001,B.rigidity??.04));
  const permeability=avg([A.permeability??.4,B.permeability??.4]);
  return {resistance,conductance,fiber,elasticity,hardness,rigidity,permeability};
}

function edgeCapacities(a,b,e){
  const p=materialPairProperties(a,b),ret=clamp(e.retention??0),strength=clamp(e.strength??ret??0);
  const joint=e.edgeType==='joint';
  // Contacts can carry compression and some transverse force, but not sustained tension.
  const compression=.07+p.resistance*.56+p.rigidity*.20+p.hardness*.10;
  const tension=joint?(.035+p.fiber*.38+p.elasticity*.24+strength*.33):.0005;
  const shear=.04+p.hardness*.18+p.fiber*.22+(1-p.permeability)*.12+(joint?strength*.22:.04);
  return {compression:Math.max(.025,compression),tension:Math.max(.0005,tension),shear:Math.max(.018,shear)};
}

function topologyEdges(w){
  const topo=w.materialTopology;if(!topo)return [];
  const byPair=new Map();
  // Retained joint supersedes ordinary contact for structural transmission of the same pair.
  for(const c of topo.contacts.values())if(c.active)byPair.set(pairKey(c.a,c.b),{...c,edgeType:'contact'});
  for(const j of topo.joints.values())if(j.active!==false)byPair.set(pairKey(j.a,j.b),{...j,edgeType:'joint'});
  return [...byPair.values()].sort((x,y)=>pairKey(x.a,x.b).localeCompare(pairKey(y.a,y.b)));
}

function loadDirection(w,fromId,toId,fallback={x:1,y:0}){
  const a=w.forms.get(fromId),b=w.forms.get(toId);if(a?.pos&&b?.pos){const d=displacement(a.pos,b.pos);if(vmagnitude(d)>1e-9)return normalized(d);}return normalized(fallback);
}

function materialVectorLoads(w,events=[]){
  const loads=new Map(),mediatedTargets=new Set();
  const add=(id,v,kind='unknown',source=null)=>{
    if(!id||!w.forms.get(id)?.alive||!finiteMaterialForm(w.forms.get(id)))return;
    if(!Number.isFinite(v?.x)||!Number.isFinite(v?.y)||vmagnitude(v)<1e-10)return;
    if(!loads.has(id))loads.set(id,[]);loads.get(id).push({vector:{x:v.x,y:v.y},kind,source});
  };
  for(const e of events){
    if(e.type==='external_material_load'||e.type==='structural_test_load'){
      const mag=Number.isFinite(e.magnitude)?e.magnitude:vmagnitude(e.vector||{});const dir=normalized(e.vector||{x:1,y:0});add(e.form,vscale(dir,mag),e.type,e.source||null);
    } else if(e.type==='constraint_reaction'){
      add(e.form,e.vector||{x:0,y:0},'constraint_reaction',e.source||e.constraint||null);
    } else if(e.type==='force_mediation'){
      const dir=loadDirection(w,e.mediator,e.target),q=Math.max(0,e.impulse??0);
      // Action/reaction remains inside material Reality. The struck material receives Force along
      // the incoming path; the mediator receives the opposite reaction, which may load its retained network.
      if(e.targetKind==='material'){add(e.target,vscale(dir,q),'force_mediation',e.mediator);mediatedTargets.add(e.target);}
      add(e.mediator,vscale(dir,-q),'force_reaction',e.target);
    } else if(e.type==='material_contact'){
      const dir=loadDirection(w,e.actor,e.material);add(e.material,vscale(dir,Math.max(0,e.relativeSpeed??0)*.02),'material_contact',e.actor);
    }
  }
  // A material_strain without a same-interval mediated load still carries directional information
  // if its source Form is known. This keeps fracture/other future Processes able to seed structure.
  for(const e of events){
    if(e.type!=='material_strain'||mediatedTargets.has(e.form))continue;
    const f=w.forms.get(e.form),src=w.forms.get(e.source);if(!f?.alive||!src?.pos)continue;
    const dir=loadDirection(w,e.source,e.form),mag=Math.max(0,e.strain??0)*Math.max(.03,materialMassLike(f))*.32;
    add(e.form,vscale(dir,mag),'material_strain',e.source);
  }
  return loads;
}

function edgeLocalDemand(w,fromId,toId,F,e){
  const a=w.forms.get(fromId),b=w.forms.get(toId);if(!a?.pos||!b?.pos)return null;
  const axis=normalized(displacement(a.pos,b.pos));if(vmagnitude(axis)<1e-9)return null;
  const axial=dot(F,axis),transverse=vsub(F,vscale(axis,axial)),shear=vmagnitude(transverse);
  const compression=Math.max(0,axial),tension=Math.max(0,-axial),props=materialPairProperties(a,b),conduct=clamp(e.conductance??props.conductance);
  let transmitted={x:0,y:0};
  if(e.edgeType==='joint'){
    const axialTransmit=axial*conduct*(.46+.36*clamp(e.strength??e.retention??.4));
    const shearTransmit=conduct*(.16+.28*clamp(e.retention??.25));
    transmitted=vadd(vscale(axis,axialTransmit),vscale(transverse,shearTransmit));
  }else{
    // Ordinary contact can push but cannot pull. Tangential transmission is deliberately limited.
    const axialTransmit=compression*conduct*.54;
    const friction=clamp(.035+props.hardness*.10+props.fiber*.10+(1-props.permeability)*.08,.02,.28);
    transmitted=vadd(vscale(axis,axialTransmit),vscale(transverse,conduct*friction));
  }
  return {axis,compression,tension:e.edgeType==='joint'?tension:0,tensionDemand:tension,shear,transmitted};
}

function structuralEdgeHologram(w,a,b,state){
  const base=aggregateHolograms([intrinsicHologram(w,a),intrinsicHologram(w,b)]),out=JSON.parse(JSON.stringify(base));
  const ratio=clamp((state.maxRatio??0)/2),modeIntensity=clamp(Math.max(state.compression??0,state.tension??0,state.shear??0));
  const retention=clamp(state.edgeType==='joint'?(state.retention??state.strength??0):0),conduct=clamp(state.conductance??0);
  out.C.ground=clamp(out.C.ground*.74+(1-ratio)*.26);out.C.order=clamp(out.C.order*.72+conduct*.28);out.C.process=clamp(out.C.process*.62+modeIntensity*.38);
  out.M.ground=clamp(out.M.ground*.76+retention*.24);out.M.order=clamp(out.M.order*.62+(1-ratio)*.20+retention*.18);out.M.process=clamp(out.M.process*.62+ratio*.38);
  out.P.ground=clamp(out.P.ground*.72+clamp((materialMassLike(a)+materialMassLike(b))/2)*.28);out.P.order=clamp(out.P.order*.60+(1-ratio)*.24+conduct*.16);out.P.process=clamp(out.P.process*.56+ratio*.44);
  return out;
}

function structuralConfigurationHologram(w,rec,edgeStates){
  const forms=rec.members.map(id=>w.forms.get(id)).filter(Boolean),base=aggregateHolograms(forms.map(f=>intrinsicHologram(w,f))),out=JSON.parse(JSON.stringify(base));
  const states=edgeStates.filter(Boolean),ratio=clamp(Math.max(0,...states.map(s=>s.maxRatio??0))/2),diversity=new Set(states.map(s=>s.dominantMode).filter(Boolean)).size;
  const load=clamp(avg(states.map(s=>Math.max(s.compression??0,s.tension??0,s.shear??0))));
  out.C.order=clamp(out.C.order*.68+(1-ratio)*.32);out.C.process=clamp(out.C.process*.65+load*.35);
  out.M.ground=clamp(out.M.ground*.72+clamp(rec.members.length/8)*.28);out.M.order=clamp(out.M.order*.58+clamp(diversity/3)*.18+(1-ratio)*.24);out.M.process=clamp(out.M.process*.62+ratio*.38);
  out.P.ground=clamp(out.P.ground*.72+clamp(forms.reduce((s,f)=>s+materialMassLike(f),0)/4)*.28);out.P.order=clamp(out.P.order*.60+(1-ratio)*.25+clamp(states.length/8)*.15);out.P.process=clamp(out.P.process*.60+load*.22+ratio*.18);
  return out;
}

function updateStressMemory(prev,inst,dt){
  const alpha=1-Math.exp(-Math.max(0,dt)/.10);return (prev??0)*(1-alpha)+(inst??0)*alpha;
}

function dominantAndRatio(state,caps){
  const ratios={compression:(state.compression??0)/Math.max(.001,caps.compression),tension:(state.tension??0)/Math.max(.001,caps.tension),shear:(state.shear??0)/Math.max(.001,caps.shear)};
  const maxStress=Math.max(state.compression??0,state.tension??0,state.shear??0);
  if(maxStress<1e-9)return {ratios,dominantMode:null,maxRatio:0};
  const dominantMode=Object.entries(ratios).sort((a,b)=>b[1]-a[1])[0]?.[0]||'compression';return {ratios,dominantMode,maxRatio:ratios[dominantMode]||0};
}

function propagateOneLoad(w,edges,source,F,edgeDemands,nodeLoads){
  const adj=new Map();
  for(const e of edges){if(!adj.has(e.a))adj.set(e.a,[]);if(!adj.has(e.b))adj.set(e.b,[]);adj.get(e.a).push({e,to:e.b});adj.get(e.b).push({e,to:e.a});}
  const q=[{id:source,F,depth:0,from:null}],best=new Map([[source,vmagnitude(F)]]);
  nodeLoads.set(source,vadd(nodeLoads.get(source)||{x:0,y:0},F));
  while(q.length){
    const cur=q.shift();if(cur.depth>=6||vmagnitude(cur.F)<.004)continue;
    for(const {e,to} of adj.get(cur.id)||[]){
      if(to===cur.from)continue;
      const local=edgeLocalDemand(w,cur.id,to,cur.F,e);if(!local)continue;
      const key=pairKey(e.a,e.b),d=edgeDemands.get(key)||{compression:0,tension:0,tensionDemand:0,shear:0,edge:e};
      d.compression+=local.compression;d.tension+=local.tension;d.tensionDemand+=local.tensionDemand;d.shear+=local.shear;edgeDemands.set(key,d);
      const mag=vmagnitude(local.transmitted);if(mag<.004)continue;
      if(mag<=(best.get(to)||0)*1.02)continue;best.set(to,mag);
      nodeLoads.set(to,vadd(nodeLoads.get(to)||{x:0,y:0},local.transmitted));q.push({id:to,F:local.transmitted,depth:cur.depth+1,from:cur.id});
    }
  }
}

export function commitStructuralMechanics(w,materialEvents=[]){
  const mech=ensureStructuralMechanics(w),dt=w.time?.dtDays??1/24,edges=topologyEdges(w),loads=materialVectorLoads(w,materialEvents),edgeDemands=new Map(),nodeLoads=new Map(),events=[];
  for(const [source,ls] of loads)for(const l of ls)propagateOneLoad(w,edges,source,l.vector,edgeDemands,nodeLoads);
  mech.lastNodeLoads=nodeLoads;
  const currentKeys=new Set();
  for(const e of edges){
    const key=pairKey(e.a,e.b),a=w.forms.get(e.a),b=w.forms.get(e.b);if(!a?.alive||!b?.alive)continue;currentKeys.add(key);
    const inst=edgeDemands.get(key)||{compression:0,tension:0,tensionDemand:0,shear:0},prev=mech.edges.get(key),caps=edgeCapacities(a,b,e);
    const state={id:`SM:${key}`,a:e.a,b:e.b,edgeType:e.edgeType,topologyId:e.id,last:w.elapsedDays??0,
      compression:updateStressMemory(prev?.compression,inst.compression,dt),tension:updateStressMemory(prev?.tension,inst.tension,dt),
      tensionDemand:updateStressMemory(prev?.tensionDemand,inst.tensionDemand,dt),shear:updateStressMemory(prev?.shear,inst.shear,dt),capacities:caps,
      retention:e.retention??0,strength:e.strength??0,conductance:e.conductance??Math.sqrt(materialConductance(a)*materialConductance(b)),overloadDays:prev?.overloadDays??0};
    const dr=dominantAndRatio(state,caps);Object.assign(state,dr);
    state.overloadDays=state.maxRatio>1?state.overloadDays+dt:Math.max(0,state.overloadDays-dt*.5);
    state.hologram=structuralEdgeHologram(w,a,b,state);state.layers=namedLayers(state.hologram);mech.edges.set(key,state);
    const prevRatio=prev?.maxRatio??0,prevMode=prev?.dominantMode;
    if(state.maxRatio>1&&(prevRatio<=1||state.overloadDays<=dt+1e-12))events.push({type:'structural_overload',a:e.a,b:e.b,mode:state.dominantMode,ratio:state.maxRatio,edgeType:e.edgeType});
    if(prevMode&&prevMode!==state.dominantMode&&Math.max(state.maxRatio,prevRatio)>.65)events.push({type:'structural_mode_shift',a:e.a,b:e.b,from:prevMode,to:state.dominantMode,mode:state.dominantMode,ratio:state.maxRatio});
    // Physical consequence of sustained overload. Duration rather than frame count governs damage.
    if(state.maxRatio>1.05){const loss=clamp((state.maxRatio-1.05)*.055*dt,0,.025);if(loss>0){a.material.integrity=clamp((a.material.integrity??1)-loss*.5);b.material.integrity=clamp((b.material.integrity??1)-loss*.5);}}
    if(e.edgeType==='joint'&&(state.maxRatio>1.65||(state.maxRatio>1.18&&state.overloadDays>.08))){
      const topo=w.materialTopology,key2=pairKey(e.a,e.b),j=topo?.joints?.get(key2);if(j){topo.joints.delete(key2);events.push({type:'material_joint_break',joint:j.id,a:j.a,b:j.b,reason:'structural_overload',mode:state.dominantMode,ratio:state.maxRatio});}
    }
  }
  for(const key of [...mech.edges.keys()])if(!currentKeys.has(key))mech.edges.delete(key);
  const nextConfigs=new Map();
  for(const [id,c] of w.materialTopology?.configurations||[]){
    const states=(c.edges||[]).map(eid=>{
      const edge=[...edges].find(x=>x.id===eid);return edge?mech.edges.get(pairKey(edge.a,edge.b)):null;
    }).filter(Boolean);
    const rec={id,members:[...(c.members||[])],edges:[...(c.edges||[])],dominantMode:states.sort((a,b)=>(b.maxRatio??0)-(a.maxRatio??0))[0]?.dominantMode||null,
      maxRatio:Math.max(0,...states.map(s=>s.maxRatio??0)),last:w.elapsedDays??0,hologram:null,layers:null};
    rec.hologram=structuralConfigurationHologram(w,rec,states);rec.layers=namedLayers(rec.hologram);nextConfigs.set(id,rec);
  }
  mech.configurations=nextConfigs;
  for(const e of events)mech.history.push({time:w.elapsedDays??0,...e});if(mech.history.length>4000)mech.history.splice(0,mech.history.length-4000);
  return events;
}

export function snapshotStructuralMechanics(w){
  const m=ensureStructuralMechanics(w),clone=s=>JSON.parse(JSON.stringify(s));
  return Object.freeze({edges:new Map([...m.edges].map(([k,v])=>[k,clone(v)])),configurations:new Map([...m.configurations].map(([k,v])=>[k,clone(v)])),lastNodeLoads:new Map([...m.lastNodeLoads].map(([k,v])=>[k,{...v}]))});
}

export function structuralMechanicsAudit(w){
  const m=ensureStructuralMechanics(w),states=[...m.edges.values()];
  const counts={compression:0,tension:0,shear:0};for(const s of states)if(s.dominantMode)counts[s.dominantMode]=(counts[s.dominantMode]||0)+1;
  return {activeStructuralEdges:states.length,configurations:m.configurations.size,dominantModes:counts,maxStressRatio:Math.max(0,...states.map(s=>s.maxRatio??0)),
    overloadedEdges:states.filter(s=>(s.maxRatio??0)>1).length,holographicEdges:states.filter(s=>s.hologram&&s.layers).length,holographicConfigurations:[...m.configurations.values()].filter(s=>s.hologram&&s.layers).length,history:m.history.length};
}
