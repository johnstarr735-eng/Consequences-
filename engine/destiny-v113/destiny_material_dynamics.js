// DESTINY v0.96 — MATERIAL MEDIATION / STRAIN + VECTORIAL STRUCTURAL INTEGRATION
//
// A finite material Form is not a Tool, Weapon, Shelter, Store or Possession.
// It can obstruct, enter a retained physical coupling, conduct Force, lose coherence,
// fracture, and persist as changed matter. Purpose belongs to later rendering/history.
//
// Source-grounded architecture:
//   contact -> conduit -> Force in transit -> strain -> coherence or transformation.
// Numerical thresholds below are engineering approximations, not Theory claims.

import {clamp, Form, Person, RelationForm, Whole} from './destiny_unified_kernel.js';
import {distance, displacement, add, unit, dot, vectorLength, formRadius, sweptContact, lerp, clampPosition, maxTravel} from './destiny_embodied_geometry.js';

const EPS=1e-7;
const pairKey=(a,b)=>[a,b].sort().join('|');

function activeMaterialJoints(w){
  return [...(w.materialTopology?.joints?.values?.()||[])].filter(j=>j?.active!==false);
}
function jointComponent(w,rootId){
  const edges=activeMaterialJoints(w),adj=new Map();
  for(const j of edges){
    if(!adj.has(j.a))adj.set(j.a,[]);if(!adj.has(j.b))adj.set(j.b,[]);
    adj.get(j.a).push({joint:j,to:j.b,dir:1});adj.get(j.b).push({joint:j,to:j.a,dir:-1});
  }
  const out=new Map([[rootId,{id:rootId,offset:{x:0,y:0},pathStrength:1,pathConductance:1}]]),q=[rootId];
  while(q.length){
    const id=q.shift(),base=out.get(id);
    for(const x of adj.get(id)||[]){
      if(out.has(x.to))continue;
      const off=x.joint.offset||{x:0,y:0},delta=x.dir===1?off:{x:-off.x,y:-off.y};
      out.set(x.to,{id:x.to,offset:{x:base.offset.x+delta.x,y:base.offset.y+delta.y},
        pathStrength:base.pathStrength*clamp(x.joint.strength??.5,.05,1),pathConductance:base.pathConductance*clamp(x.joint.conductance??.5,.05,1)});
      q.push(x.to);
    }
  }
  return [...out.values()];
}
function componentHasOtherBodyCoupling(w,materialId,anchorId=null){
  const ids=new Set(jointComponent(w,materialId).map(x=>x.id));
  for(const [mid,c] of w.materialCouplings||[])if(ids.has(mid)&&(!anchorId||c.anchor!==anchorId))return true;
  return false;
}

export function ensureMaterialDynamics(w){
  if(!w.materialCouplings)w.materialCouplings=new Map(); // key: material Form id
  if(!w.materialContactMemory)w.materialContactMemory=new Map();
  if(!w.nextFragment)w.nextFragment=1;
  return w;
}

export function finiteMaterialForm(f){
  return !!f?.alive && f.kind!=='person' && f.kind!=='animal' && !(f instanceof RelationForm) && !(f instanceof Whole) &&
    ((f.material?.stock??0)>.004) && ((f.material?.rigidity??0)>.28 || (f.material?.hardness??0)>.28 || (f.material?.mineral??0)>.35 || (f.material?.capacity??0)>.42);
}

export function materialMassLike(f){
  const m=f?.material||{};
  const density=.22+(m.mineral??0)*.90+(m.hardness??0)*.28+(m.rigidity??0)*.18+(m.organic??0)*.10;
  return Math.max(.015,(m.stock??.1)*density);
}

export function materialResistance(f){
  const m=f?.material||{};
  return clamp(.08+(m.rigidity??0)*.34+(m.hardness??0)*.31+(m.fiber??0)*.16+(m.mineral??0)*.10+(m.moisture??0)*.03, .06, 1.05);
}

export function materialConductance(f){
  const m=f?.material||{};
  // Mechanical conductance: rigid/coherent material carries an impulse farther; permeability and
  // elasticity dissipate some of it. This is not electrical/thermal conductance or semantic usefulness.
  return clamp(.18+(m.rigidity??0)*.42+(m.hardness??0)*.24+(1-(m.permeability??.5))*.12-(m.elasticity??0)*.12,.06,1);
}

export function materialAnchoring(f){
  const m=f?.material||{};
  // Engineering proxy for how strongly a finite material Form is already constrained by environment.
  return clamp((m.capacity??0)*.18+(m.cover??0)*.10+(m.stock??0)*.07+(m.rigidity??0)*.06,0,.42);
}

function couplingStrength(anchor,material){
  const manipulation=anchor?.capacities?.manipulation??0;
  const load=materialMassLike(material)/Math.max(.04,anchor?.mass??anchor?.material?.stock??.7);
  const surface=clamp(.62+(material.material?.permeability??.5)*.16-(material.material?.hardness??0)*.08);
  return clamp(manipulation*.68*surface-load*.14-materialAnchoring(material)*.20,.04,.92);
}

export function createPhysicalCoupling(w,anchorId,materialId,{moment=w.elapsedDays??w.clock??0,reason='retained_contact'}={}){
  ensureMaterialDynamics(w);
  const anchor=w.forms.get(anchorId),material=w.forms.get(materialId);
  if(!anchor?.alive||!finiteMaterialForm(material))return null;
  if(w.materialCouplings.has(materialId))return null;
  // A retained material network has one external body-anchor until the constraint solver can
  // genuinely resolve multi-anchor carrying. Do not give one finite configuration incompatible trajectories.
  if(componentHasOtherBodyCoupling(w,materialId,anchorId))return null;
  const manipulation=anchor.capacities?.manipulation??0;if(manipulation<.30)return null;
  const load=materialMassLike(material),anchorMass=Math.max(.05,anchor.mass??anchor.material?.stock??.7);
  if(load>anchorMass*(.18+manipulation*.92))return null;
  const offset=displacement(anchor.pos,material.pos),maxGap=formRadius(anchor)+formRadius(material)+.30;
  if(vectorLength(offset)>maxGap)return null;
  const rec={id:`MC:${anchorId}:${materialId}:${moment}`,anchor:anchorId,material:materialId,offset:{...offset},strength:couplingStrength(anchor,material),opened:moment,last:moment,reason,load};
  w.materialCouplings.set(materialId,rec);
  return rec;
}

function releaseOpening(w,material,coupling){
  const r=formRadius(material),base={...material.pos};
  const blockers=[...w.forms.values()].filter(f=>f.alive&&f.id!==material.id&&
    (f.kind==='person'||f.kind==='animal'||finiteMaterialForm(f)));
  const clear=pos=>blockers.every(f=>distance(pos,f.pos)>=r+formRadius(f)+2e-6);
  const bounded=clampPosition(base,w.w,w.h,r);if(clear(bounded))return bounded;
  const phase=((coupling?.opened??0)*.61803398875+(material.id?.length||1))%(Math.PI*2);
  for(let ring=1;ring<=16;ring++){
    const rad=.045*ring;
    for(let i=0;i<32;i++){
      const a=phase+i*Math.PI/16,cand=clampPosition({x:base.x+Math.cos(a)*rad,y:base.y+Math.sin(a)*rad},w.w,w.h,r);
      if(clear(cand))return cand;
    }
  }
  return null;
}

export function breakPhysicalCoupling(w,materialId,reason='strain'){
  ensureMaterialDynamics(w);const c=w.materialCouplings.get(materialId);if(!c)return null;
  const material=w.forms.get(materialId);if(!material){w.materialCouplings.delete(materialId);return {...c,reason,ended:w.elapsedDays??w.clock??0};}
  const opening=releaseOpening(w,material,c);
  // Relation failure itself must be physically actualisable. If no admissible material position exists,
  // the coupling remains until a later Moment rather than deleting the constraint into impossible space.
  if(!opening)return null;
  material.prevPos={...material.pos};material.pos={...opening};
  w.materialCouplings.delete(materialId);return {...c,reason,ended:w.elapsedDays??w.clock??0,release:{...opening}};
}

export function activeCouplingForAnchor(w,anchorId){
  ensureMaterialDynamics(w);return [...w.materialCouplings.values()].filter(c=>c.anchor===anchorId);
}

function snapshotSolid(fs){
  if(!fs?.alive||fs.kind==='person'||fs.kind==='animal'||fs.kind==='relation'||fs.kind==='whole')return false;
  const m=fs.material||{};return (m.stock??0)>.004&&((m.rigidity??0)>.28||(m.hardness??0)>.28||(m.mineral??0)>.35||(m.capacity??0)>.42);
}
function snapshotMass(fs){const m=fs.material||{};return Math.max(.015,(m.stock??.1)*(.22+(m.mineral??0)*.90+(m.hardness??0)*.28+(m.rigidity??0)*.18+(m.organic??0)*.10));}
function snapshotResistance(fs){const m=fs.material||{};return clamp(.08+(m.rigidity??0)*.34+(m.hardness??0)*.31+(m.fiber??0)*.16+(m.mineral??0)*.10+(m.moisture??0)*.03,.06,1.05);}
function snapshotConductance(fs){const m=fs.material||{};return clamp(.18+(m.rigidity??0)*.42+(m.hardness??0)*.24+(1-(m.permeability??.5))*.12-(m.elasticity??0)*.12,.06,1);}

function bodyMassSnapshot(fs){return Math.max(.03,fs?.mass??.3);}
function bodyForceSnapshot(fs){return clamp(fs?.force??.25,0,1.2);}

function firstStaticContact(s,motion,ignore=new Set()){
  const body=s.forms.get(motion.form);if(!body)return null;
  let best=null;
  for(const fs of s.forms.values()){
    if(!snapshotSolid(fs)||ignore.has(fs.id))continue;
    const c=sweptContact(motion.from,motion.to,body.geometry?.radius??.25,fs.pos,fs.pos,fs.geometry?.radius??.18);
    if(!c)continue;
    if(!best||c.t<best.contact.t-EPS||(Math.abs(c.t-best.contact.t)<=EPS&&fs.id<best.solid.id))best={solid:fs,contact:c};
  }
  return best;
}

function constrainedEndpoint(motion,contact){
  if(!contact)return motion.to;
  const t=Math.max(0,contact.contact.t-2e-6);return lerp(motion.from,motion.to,t);
}

function relativeMotionSpeed(a0,a1,b0,b1,dtDays=1){
  const av=displacement(a0,a1),bv=displacement(b0,b1);
  return vectorLength({x:av.x-bv.x,y:av.y-bv.y})/Math.max(1e-9,dtDays);
}

function mediatedImpulse(anchorFs,materialFs,targetFs,relativeSpeed,coupling){
  const mediatorMass=snapshotMass(materialFs),targetMass=targetFs.kind==='person'||targetFs.kind==='animal'?bodyMassSnapshot(targetFs):snapshotMass(targetFs);
  const reduced=(mediatorMass*targetMass)/Math.max(.001,mediatorMass+targetMass);
  const source=clamp(.38+bodyForceSnapshot(anchorFs)*.46,.25,1.1);
  const conduit=snapshotConductance(materialFs)*clamp(coupling.strength??.4,.05,1);
  return Math.max(0,relativeSpeed*reduced*source*conduit);
}

function materialStrainFromImpulse(fs,impulse){
  const mass=snapshotMass(fs),res=snapshotResistance(fs),elastic=fs.material?.elasticity??0;
  const strain=impulse/Math.max(.012,mass*(.35+res*.85));
  const yieldPoint=.18+res*.55+elastic*.20;
  const plastic=Math.max(0,strain-yieldPoint);
  const loss=clamp(plastic*.16*(1-elastic*.58),0,.55);
  return {strain,yieldPoint,loss,resistance:res,elasticity:elastic};
}

function bodyDamageFromMediated(targetFs,materialFs,impulse){
  if(impulse<.018)return 0;
  const hardness=materialFs.material?.hardness??0,rigidity=materialFs.material?.rigidity??0;
  return clamp((impulse-.014)*(.018+.026*hardness+.015*rigidity)/Math.max(.24,bodyMassSnapshot(targetFs)),0,.06);
}


function projectCompositeEndpoints(w,s,motionMap,coupledPositions){
  const coupledByAnchor=new Map();
  for(const cp of coupledPositions){if(!coupledByAnchor.has(cp.anchor))coupledByAnchor.set(cp.anchor,[]);coupledByAnchor.get(cp.anchor).push(cp);}
  const movingMaterialIds=new Set(coupledPositions.map(x=>x.material));
  const staticSolids=[...s.forms.values()].filter(fs=>snapshotSolid(fs)&&!movingMaterialIds.has(fs.id)).sort((a,b)=>a.id.localeCompare(b.id));
  const groups=[...motionMap.values()].map(m=>{
    const body=s.forms.get(m.form);const attachments=(coupledByAnchor.get(m.form)||[]).map(cp=>({id:cp.material,fs:s.forms.get(cp.material),offset:cp.offset||w.materialCouplings.get(cp.material)?.offset||displacement(m.to,cp.to)}));
    return {id:m.form,m,body,attachments,mass:bodyMassSnapshot(body)+attachments.reduce((q,x)=>q+snapshotMass(x.fs),0)};
  }).filter(g=>g.body).sort((a,b)=>a.id.localeCompare(b.id));
  const groupComponents=g=>[{id:g.id,fs:g.body,offset:{x:0,y:0}},...g.attachments];
  const positionOf=(g,c)=>({x:g.m.to.x+c.offset.x,y:g.m.to.y+c.offset.y});
  function clampGroup(g){
    let minX=g.body.geometry?.radius??.25,maxX=(s.w-1)-(g.body.geometry?.radius??.25),minY=g.body.geometry?.radius??.25,maxY=(s.h-1)-(g.body.geometry?.radius??.25);
    for(const c of g.attachments){const r=c.fs?.geometry?.radius??.18;minX=Math.max(minX,r-c.offset.x);maxX=Math.min(maxX,(s.w-1-r)-c.offset.x);minY=Math.max(minY,r-c.offset.y);maxY=Math.min(maxY,(s.h-1-r)-c.offset.y);}
    if(minX<=maxX)g.m.to.x=Math.max(minX,Math.min(maxX,g.m.to.x));
    if(minY<=maxY)g.m.to.y=Math.max(minY,Math.min(maxY,g.m.to.y));
  }
  function shiftGroup(g,v){g.m.to={x:g.m.to.x+v.x,y:g.m.to.y+v.y};clampGroup(g);}
  function sepDir(a,b,label){const d=displacement(b,a);if(vectorLength(d)>1e-10)return unit(d);let h=0;for(const ch of label)h=(h*33+ch.charCodeAt(0))>>>0;const ang=(h%360)*Math.PI/180;return {x:Math.cos(ang),y:Math.sin(ang)};}
  for(const g of groups)clampGroup(g);
  for(let pass=0;pass<256;pass++){
    let changed=false;
    // Composite versus static material.
    for(const g of groups){
      for(const c of groupComponents(g)){
        const cp=positionOf(g,c),cr=c.fs?.geometry?.radius??.18;
        for(const solid of staticSolids){
          const minD=cr+(solid.geometry?.radius??.18),d=distance(cp,solid.pos);if(d>=minD-2e-8)continue;
          const n=sepDir(cp,solid.pos,`${g.id}|${c.id}|${solid.id}`),depth=minD-d+3e-7;shiftGroup(g,{x:n.x*depth,y:n.y*depth});changed=true;
        }
      }
    }
    // Composite versus composite. Translate whole temporary configurations, not individual parts.
    for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
      const A=groups[i],B=groups[j];let worst=null;
      for(const ca of groupComponents(A))for(const cb of groupComponents(B)){
        const pa=positionOf(A,ca),pb=positionOf(B,cb),minD=(ca.fs?.geometry?.radius??.18)+(cb.fs?.geometry?.radius??.18),d=distance(pa,pb),ov=minD-d;
        if(ov>2e-8&&(!worst||ov>worst.ov))worst={ca,cb,pa,pb,ov};
      }
      if(!worst)continue;const n=sepDir(worst.pa,worst.pb,`${A.id}|${B.id}`),ia=1/Math.max(.03,A.mass),ib=1/Math.max(.03,B.mass),z=ia+ib,depth=worst.ov+3e-7;
      shiftGroup(A,{x:n.x*depth*(ia/z),y:n.y*depth*(ia/z)});shiftGroup(B,{x:-n.x*depth*(ib/z),y:-n.y*depth*(ib/z)});changed=true;
    }
    if(!changed)break;
  }
  // Rebuild coupled endpoints from final anchor endpoints; identity and offsets are preserved.
  for(const cp of coupledPositions){const am=motionMap.get(cp.anchor);if(am&&cp.offset)cp.to={x:am.to.x+cp.offset.x,y:am.to.y+cp.offset.y};}
}

// v0.92 + v0.93 resolution: finite matter constrains trajectories; retained finite matter shares an
// anchor trajectory and can become a Force conduit when that configuration meets another Form.
export function resolveMaterialDynamics(w,s,motions){
  ensureMaterialDynamics(w);
  const motionMap=new Map(motions.map(m=>[m.form,{...m,to:{...m.to},attemptedTo:{...m.to}}]));
  const contacts=[],mediated=[],coupledPositions=[];

  // Precompute all material members that move with a body through retained material topology.
  const movingMaterialIds=new Set();
  const couplingNetworks=[];
  for(const coupling of [...w.materialCouplings.values()].sort((a,b)=>a.material.localeCompare(b.material))){
    const network=jointComponent(w,coupling.material).filter(x=>s.forms.get(x.id)?.alive);
    for(const x of network)movingMaterialIds.add(x.id);
    couplingNetworks.push({coupling,network});
  }

  // 1) Ordinary finite matter constrains living-body motion. A whole retained material network is
  // excluded from being treated as a static obstacle to its own anchor.
  for(const [id,m] of [...motionMap].sort((a,b)=>a[0].localeCompare(b[0]))){
    const ignore=new Set(movingMaterialIds);
    const c=firstStaticContact(s,m,ignore);
    if(!c)continue;
    m.to=constrainedEndpoint(m,c);
    const speed=relativeMotionSpeed(m.from,m.to,c.solid.pos,c.solid.pos,w.time?.dtDays??1);
    contacts.push({type:'material_contact',actor:id,material:c.solid.id,relativeSpeed:speed,contactT:c.contact.t,retained:false,from:{...m.from},attemptedTo:{...m.attemptedTo}});
  }

  // 2) A body-coupled material Form can carry a retained material network. Constituents remain
  // distinct Forms; the network only supplies a temporary shared geometric/Force constraint.
  for(const {coupling,network} of couplingNetworks){
    const anchor=s.forms.get(coupling.anchor),root=s.forms.get(coupling.material),am=motionMap.get(coupling.anchor);
    if(!anchor?.alive||!root?.alive||!am)continue;
    const networkIds=new Set(network.map(x=>x.id));
    let earliest=null;
    for(const member of network){
      const mat=s.forms.get(member.id);if(!mat?.alive)continue;
      const anchorOffset={x:coupling.offset.x+member.offset.x,y:coupling.offset.y+member.offset.y};
      const start={x:anchor.pos.x+anchorOffset.x,y:anchor.pos.y+anchorOffset.y};
      let end=clampPosition({x:am.to.x+anchorOffset.x,y:am.to.y+anchorOffset.y},s.w,s.h,mat.geometry?.radius??.18);
      const incomingEnd={...end},mr=mat.geometry?.radius??.18;
      for(const target of s.forms.values()){
        if(!target.alive||target.id===coupling.anchor||networkIds.has(target.id)||target.kind==='relation'||target.kind==='whole')continue;
        let targetEnd={...target.pos};if(target.kind==='person'||target.kind==='animal')targetEnd=motionMap.get(target.id)?.to||target.pos;
        const tr=target.geometry?.radius??.18,c=sweptContact(start,end,mr,target.pos,targetEnd,tr);if(!c)continue;
        const rec={target,contact:c,targetEnd,member,mat,start,end,incomingEnd,anchorOffset};
        if(!earliest||c.t<earliest.contact.t-EPS||(Math.abs(c.t-earliest.contact.t)<=EPS&&`${member.id}|${target.id}`<`${earliest.member.id}|${earliest.target.id}`))earliest=rec;
      }
      coupledPositions.push({material:member.id,rootMaterial:coupling.material,anchor:coupling.anchor,from:{...mat.pos},to:{...end},offset:anchorOffset,couplingId:coupling.id,
        pathStrength:member.pathStrength,pathConductance:member.pathConductance});
    }
    if(earliest){
      const t=Math.max(0,earliest.contact.t-2e-6),newAnchor=lerp(am.from,am.to,t);am.to=newAnchor;
      // Recompute every network member endpoint after the shared anchor is constrained.
      for(const cp of coupledPositions.filter(x=>x.anchor===coupling.anchor&&x.rootMaterial===coupling.material))cp.to={x:newAnchor.x+cp.offset.x,y:newAnchor.y+cp.offset.y};
      const rel=relativeMotionSpeed(earliest.start,earliest.incomingEnd,earliest.target.pos,earliest.targetEnd,w.time?.dtDays??1);
      const effectiveCoupling={...coupling,strength:clamp(coupling.strength*(earliest.member.pathStrength??1),.02,1)};
      const impulse=mediatedImpulse(anchor,earliest.mat,earliest.target,rel,effectiveCoupling)*clamp(earliest.member.pathConductance??1,.03,1);
      const targetKind=(earliest.target.kind==='person'||earliest.target.kind==='animal')?'living':'material';
      const mediatorStrain=materialStrainFromImpulse(earliest.mat,impulse*Math.max(.25,snapshotResistance(earliest.target)));
      const targetStrain=targetKind==='material'?materialStrainFromImpulse(earliest.target,impulse):null;
      const bodyDamage=targetKind==='living'?bodyDamageFromMediated(earliest.target,earliest.mat,impulse):0;
      mediated.push({type:'force_mediation',anchor:coupling.anchor,rootMaterial:coupling.material,mediator:earliest.member.id,target:earliest.target.id,targetKind,relativeSpeed:rel,impulse,
        bodyDamage,mediatorStrain,targetStrain,couplingStrength:effectiveCoupling.strength,pathConductance:earliest.member.pathConductance??1,contactT:earliest.contact.t});
    }
  }

  projectCompositeEndpoints(w,s,motionMap,coupledPositions);
  const materialYieldResolutions=resolveLooseMaterialYield(w,s,contacts);
  return {motions:[...motionMap.values()].sort((a,b)=>a.form.localeCompare(b.form)),materialContacts:contacts,mediatedContacts:mediated,coupledPositions,materialYieldResolutions};
}

function snapshotAnchoring(fs){
  const m=fs?.material||{};
  return clamp((m.capacity??0)*.18+(m.cover??0)*.10+(m.stock??0)*.07+(m.rigidity??0)*.06,0,.42);
}
function materialJointed(w,id){
  return activeMaterialJoints(w).some(j=>j.a===id||j.b===id);
}
function materialYieldOpening(s,material,desired,contributors){
  const r=material.geometry?.radius??.18;let end=clampPosition(desired,s.w,s.h,r),best=null;
  const contributorIds=new Set(contributors.map(x=>x.actor));
  for(const other of s.forms.values()){
    if(!other.alive||other.id===material.id||contributorIds.has(other.id)||other.kind==='relation'||other.kind==='whole')continue;
    const solid=(other.kind==='person'||other.kind==='animal'||snapshotSolid(other));if(!solid)continue;
    const c=sweptContact(material.pos,end,r,other.pos,other.pos,other.geometry?.radius??.18);if(!c)continue;
    if(!best||c.t<best.t)best=c;
  }
  if(best)end=lerp(material.pos,end,Math.max(0,best.t-2e-6));
  return end;
}

// v1.09 reconstruction: ordinary embodied contact may transmit Force into finite loose matter.
// Multiple independently generated contacts are resolved together. Reinforcing vectors translate;
// opposed vectors may cancel translation while the material still bears gross load. No PUSH/CARRY/
// COOPERATE/FIGHT action exists here.
function resolveLooseMaterialYield(w,s,contacts){
  const byMaterial=new Map(),dt=Math.max(1e-9,w.time?.dtDays??1/24);
  for(const e of contacts||[]){if(!byMaterial.has(e.material))byMaterial.set(e.material,[]);byMaterial.get(e.material).push(e);}
  const out=[];
  for(const [mid,rows] of [...byMaterial].sort((a,b)=>a[0].localeCompare(b[0]))){
    const mat=s.forms.get(mid);if(!mat?.alive||!snapshotSolid(mat))continue;
    if(w.materialCouplings?.has(mid)||materialJointed(w,mid))continue;
    const contributors=[];let nx=0,ny=0,gross=0;
    for(const e of rows.sort((a,b)=>a.actor.localeCompare(b.actor))){
      const a=s.forms.get(e.actor);if(!a?.alive)continue;
      const attempted=e.attemptedTo||e.from,travel=displacement(e.from||a.pos,attempted||a.pos),speed=vectorLength(travel)/dt;
      if(speed<1e-10)continue;
      const dir=unit(travel),mass=bodyMassSnapshot(a),force=bodyForceSnapshot(a);
      const load=speed*mass*(.34+.66*force);
      const fv={x:dir.x*load,y:dir.y*load};nx+=fv.x;ny+=fv.y;gross+=load;
      contributors.push({actor:e.actor,load,vector:fv,relativeSpeed:e.relativeSpeed??speed});
    }
    if(!contributors.length)continue;
    const net=Math.hypot(nx,ny),mass=snapshotMass(mat),res=snapshotResistance(mat),anchor=snapshotAnchoring(mat);
    const threshold=mass*(.055+res*.085+anchor*.18);
    const drive=Math.max(0,net-threshold),rate=drive/Math.max(.025,mass*(.78+res*.72+anchor))*0.32;
    const translation=Math.min(.24*dt,rate*dt);
    const dir=net>1e-12?{x:nx/net,y:ny/net}:{x:0,y:0};
    const desired={x:mat.pos.x+dir.x*translation,y:mat.pos.y+dir.y*translation};
    const to=translation>0?materialYieldOpening(s,mat,desired,contributors):{...mat.pos};
    const actualTranslation=distance(mat.pos,to);
    out.push({type:'material_contact_resolution',material:mid,actors:contributors.map(x=>x.actor),contributors,from:{...mat.pos},to,
      netForce:{x:nx,y:ny,magnitude:net},grossLoad:gross,resistance:res,anchoring:anchor,threshold,translation:actualTranslation,multiSource:contributors.length>1});
  }
  return out;
}

function recordContactMemory(w,e){
  const k=`${e.actor}|${e.material}`,prev=w.materialContactMemory.get(k)||{exposureDays:0,continuousDays:0,last:-Infinity,episodes:0};
  const now=w.elapsedDays??w.clock??0,dt=Math.max(1e-9,w.time?.dtDays??1/24),gap=Math.max(0,now-prev.last);
  const anchor=w.forms.get(e.actor),mat=w.forms.get(e.material);
  const freeDaily=Math.max(.04,maxTravel(anchor,1)),ratio=Math.max(0,(e.relativeSpeed??0)/freeDaily);
  const manipulation=clamp(anchor?.capacities?.manipulation??0),res=materialResistance(mat);
  // Contact quality is relative to the body's own free motion and the material's resistance.
  // No absolute speed cutoff can make coupling numerically unreachable.
  const quality=clamp(1.65-ratio,0,1)*clamp(.52+manipulation*.62-res*.18,.08,1);
  const carry=Math.exp(-gap/1.8),continued=gap<=dt*2.6;
  const rec={exposureDays:(prev.exposureDays||0)*carry+dt*quality,continuousDays:(continued?(prev.continuousDays||0)*Math.exp(-gap/.35):0)+dt*quality,
    last:now,episodes:(prev.episodes||0)+(continued?0:1),quality,ratio};
  w.materialContactMemory.set(k,rec);return rec;
}

function maybeOpenCoupling(w,e){
  const anchor=w.forms.get(e.actor),mat=w.forms.get(e.material);if(!anchor?.alive||!finiteMaterialForm(mat))return null;
  if(w.materialCouplings.has(mat.id))return null;
  const mem=recordContactMemory(w,e);
  if((anchor.capacities?.manipulation??0)<.42)return null;
  const loadRatio=materialMassLike(mat)/Math.max(.05,anchor.mass??anchor.material?.stock??.7);
  const required=.065+Math.min(.12,loadRatio*.085);
  if(mem.exposureDays<required||mem.continuousDays<Math.min(.055,required*.72))return null;
  const c=createPhysicalCoupling(w,anchor.id,mat.id,{reason:'retained_contact'});
  if(c){mem.exposureDays*=.25;mem.continuousDays=0;return {type:'material_coupling_open',anchor:c.anchor,material:c.material,strength:c.strength,coupling:c.id,retainedContactDays:required};}
  return null;
}

function fragmentForm(w,f,loadEvent){
  if(!f?.alive||!finiteMaterialForm(f))return [];
  const stock=f.material?.stock??0;if(stock<.06)return [];
  const sourceMaterial={...f.material};const idA=`${f.id}:fragment:${w.nextFragment++}:a`,idB=`${f.id}:fragment:${w.nextFragment++}:b`;
  const impulseDir=unit(displacement(w.forms.get(loadEvent.anchor)?.pos||f.pos,f.pos));const n=vectorLength(impulseDir)>EPS?impulseDir:{x:1,y:0};
  const tangent={x:-n.y,y:n.x};const r=formRadius(f),sep=Math.max(.06,r*.42);
  const make=(id,q,sign)=>{const child=new Form(id,{kind:f.kind,pos:{x:f.pos.x+tangent.x*sep*sign,y:f.pos.y+tangent.y*sep*sign},
      stock:stock*q,water:sourceMaterial.water,food:0,warmth:sourceMaterial.warmth,force:sourceMaterial.force,mobility:sourceMaterial.mobility,visibility:sourceMaterial.visibility,cover:sourceMaterial.cover*q,
      openness:sourceMaterial.openness,organic:sourceMaterial.organic,nutrient:sourceMaterial.nutrient,fiber:sourceMaterial.fiber,mineral:sourceMaterial.mineral,moisture:sourceMaterial.moisture,
      combustible:sourceMaterial.combustible,rigidity:sourceMaterial.rigidity,hardness:sourceMaterial.hardness,permeability:sourceMaterial.permeability,thermal:sourceMaterial.thermal,
      capacity:sourceMaterial.capacity*q,integrity:clamp(.58+(sourceMaterial.integrity??1)*.22),elasticity:sourceMaterial.elasticity});
    child.history=[...(f.history||[]),{clock:w.clock,type:'fragment_origin',source:f.id}];return child;};
  const a=make(idA,.54,1),b=make(idB,.46,-1);
  f.history=f.history||[];f.history.push({clock:w.clock,type:'material_fracture',source:loadEvent.mediator||loadEvent.anchor||null,strain:(loadEvent.targetStrain||loadEvent.mediatorStrain)?.strain??null});
  f.alive=false;f.material.stock=0;w.add(a);w.add(b);
  return [a,b];
}

export function commitMaterialDynamics(w,resolved){
  ensureMaterialDynamics(w);const events=[];
  // Move coupled Forms only after living-anchor motion has committed.
  for(const cm of resolved.coupledPositions||[]){const f=w.forms.get(cm.material),a=w.forms.get(cm.anchor);if(!f?.alive||!a?.alive)continue;f.prevPos={...f.pos};f.pos={...cm.to};const c=w.materialCouplings.get(f.id);if(c)c.last=w.elapsedDays??w.clock??0;}
  // Loose matter receives the jointly resolved contact field after the independently generated
  // living trajectories have committed. This is the v1.09 physical bridge reconstructed here.
  for(const y of resolved.materialYieldResolutions||[]){const f=w.forms.get(y.material);if(!f?.alive)continue;f.prevPos={...f.pos};f.pos={...y.to};events.push(y);}
  // Repeated physically manageable contact may open a retained physical relation. Persistence is
  // accumulated in physical time rather than by sample-count or an absolute speed cutoff.
  for(const e of resolved.materialContacts||[]){events.push(e);const open=maybeOpenCoupling(w,e);if(open)events.push(open);}

  for(const e of resolved.mediatedContacts||[]){
    const target=w.forms.get(e.target),mediator=w.forms.get(e.mediator);if(!target?.alive||!mediator?.alive)continue;
    events.push({...e});
    // Target response: living integrity or material strain.
    if(e.targetKind==='living'&&e.bodyDamage>0){target.body.integrity=clamp(target.body.integrity-e.bodyDamage);if(target instanceof Person)target.injury=clamp((target.injury||0)+e.bodyDamage);events.push({type:'bodily_strain',actor:target.id,source:e.mediator,loss:e.bodyDamage,impulse:e.impulse});}
    if(e.targetKind==='material'&&e.targetStrain){
      target.material.integrity=clamp((target.material.integrity??1)-e.targetStrain.loss);
      events.push({type:'material_strain',form:target.id,source:e.mediator,strain:e.targetStrain.strain,loss:e.targetStrain.loss,integrity:target.material.integrity});
    }
    mediator.material.integrity=clamp((mediator.material.integrity??1)-(e.mediatorStrain?.loss||0));
    if((e.mediatorStrain?.loss||0)>0)events.push({type:'material_strain',form:mediator.id,source:e.target,strain:e.mediatorStrain.strain,loss:e.mediatorStrain.loss,integrity:mediator.material.integrity});

    // Retained relation may fail under strain. Failure is not deletion; material remains in Reality.
    const rootMaterial=e.rootMaterial||mediator.id,c=w.materialCouplings.get(rootMaterial);const couplingStress=clamp((e.impulse||0)/Math.max(.01,materialMassLike(mediator)));
    if(c&&couplingStress>c.strength*1.65){const br=breakPhysicalCoupling(w,rootMaterial,'transmitted_strain');if(br)events.push({type:'material_coupling_break',anchor:br.anchor,material:br.material,reason:br.reason,stress:couplingStress});}

    // Fracture is transformation of material Form. Thresholds are deliberately high so ordinary contact need not fracture matter.
    for(const f of [target,mediator]){
      if(!finiteMaterialForm(f))continue;const corresponding=f.id===target.id?e.targetStrain:e.mediatorStrain;if(!corresponding)continue;
      if((f.material.integrity??1)<.30||corresponding.strain>2.25){
        if(w.materialCouplings.has(f.id)){const br=breakPhysicalCoupling(w,f.id,'material_fracture');if(br)events.push({type:'material_coupling_break',anchor:br.anchor,material:br.material,reason:br.reason});}
        const fragments=fragmentForm(w,f,e);if(fragments.length)events.push({type:'material_fracture',form:f.id,source:e.mediator,fragments:fragments.map(x=>x.id),strain:corresponding.strain});
      }
    }
  }
  return events;
}

export function cleanupMaterialDynamics(w){
  ensureMaterialDynamics(w);const out=[];
  for(const [mid,c] of [...w.materialCouplings]){const a=w.forms.get(c.anchor),m=w.forms.get(mid);if(!a?.alive||!m?.alive){w.materialCouplings.delete(mid);out.push({type:'material_coupling_break',anchor:c.anchor,material:mid,reason:!a?.alive?'anchor_loss':'material_loss'});}}
  return out;
}

export function materialDynamicsAudit(w){
  ensureMaterialDynamics(w);return {activeCouplings:w.materialCouplings.size,contactMemories:w.materialContactMemory.size,
    activeMaterialForms:[...w.forms.values()].filter(f=>finiteMaterialForm(f)).length,
    retainedContactDays:[...w.materialContactMemory.values()].reduce((q,x)=>q+(x.exposureDays||0),0),
    fracturedParents:[...w.forms.values()].filter(f=>!f.alive&&(f.history||[]).some(h=>h.type==='material_fracture')).length};
}
