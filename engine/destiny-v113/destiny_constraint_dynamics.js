// DESTINY v0.97 — CONSTRAINT / ORIENTATION / ROTATIONAL RESPONSE
//
// Source-backed claim: Force follows a conduit, and the same pressure can yield a different
// actuality according to where it enters and what degrees of freedom the configuration retains.
// Narrative recurrence (wheel, pendulum, rudder, anchor, roots, tightrope) is treated as evidence
// for constraint-dependent orientation, NOT as permission to create Wheel/Anchor/Fulcrum kinds.
//
// Engineering inference (not Theory): 2D torque, point constraints, rigid retained-joint components,
// circular collision clearance, moment-of-inertia approximations, numerical strength and thresholds.

import {clamp, intrinsicHologram} from './destiny_unified_kernel.js';
import {distance, displacement, vectorLength, unit, add, dot, formRadius} from './destiny_embodied_geometry.js';
import {finiteMaterialForm, materialMassLike} from './destiny_material_dynamics.js';

const LAYERS=['C','M','P'],BRANCHES=['ground','order','process'];
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const cross=(a,b)=>(a?.x||0)*(b?.y||0)-(a?.y||0)*(b?.x||0);
const vadd=(a,b)=>({x:(a?.x||0)+(b?.x||0),y:(a?.y||0)+(b?.y||0)});
const vscale=(a,k)=>({x:(a?.x||0)*k,y:(a?.y||0)*k});
const rotateVec=(v,a)=>({x:v.x*Math.cos(a)-v.y*Math.sin(a),y:v.x*Math.sin(a)+v.y*Math.cos(a)});
const rotatePoint=(p,c,a)=>{const r=rotateVec({x:p.x-c.x,y:p.y-c.y},a);return {x:c.x+r.x,y:c.y+r.y};};
const normAngle=a=>{let x=a;while(x>Math.PI)x-=2*Math.PI;while(x<=-Math.PI)x+=2*Math.PI;return x;};
function namedLayers(h){return {consciousness:{...(h?.C||{})},mind:{...(h?.M||{})},physical:{...(h?.P||{})}};}
function aggregateHolograms(hs){const good=hs.filter(Boolean),out={};for(const l of LAYERS){out[l]={};for(const b of BRANCHES)out[l][b]=clamp(avg(good.map(h=>h?.[l]?.[b]??0)));}return out;}

export function ensureConstraintDynamics(w){
  if(!w.constraintDynamics)w.constraintDynamics={constraints:new Map(),components:new Map(),history:[],nextConstraint:1};
  if(!(w.constraintDynamics.constraints instanceof Map))w.constraintDynamics.constraints=new Map(w.constraintDynamics.constraints||[]);
  if(!(w.constraintDynamics.components instanceof Map))w.constraintDynamics.components=new Map(w.constraintDynamics.components||[]);
  if(!Array.isArray(w.constraintDynamics.history))w.constraintDynamics.history=[];
  if(!Number.isFinite(w.constraintDynamics.nextConstraint))w.constraintDynamics.nextConstraint=1;
  return w.constraintDynamics;
}

export function createPositionalConstraint(w,formId,{point=null,strength=.75,rotationalFreedom=true,reason='retained_environment_relation'}={}){
  const mech=ensureConstraintDynamics(w),f=w.forms.get(formId);if(!f?.alive||!finiteMaterialForm(f))return null;
  const id=`PC${mech.nextConstraint++}:${formId}`,p=point?{...point}:{...f.pos};
  const rec={id,form:formId,point:p,strength:clamp(strength,.05,1),rotationalFreedom:!!rotationalFreedom,opened:w.elapsedDays??0,active:true,overloadDays:0,hologram:null,layers:null,reason};
  const h=aggregateHolograms([intrinsicHologram(w,f)]);h.P.order=clamp(h.P.order*.62+rec.strength*.38);h.P.process=clamp(h.P.process*.72+.12);rec.hologram=h;rec.layers=namedLayers(h);
  mech.constraints.set(id,rec);mech.history.push({time:w.elapsedDays??0,type:'physical_constraint_open',constraint:id,form:formId});return rec;
}
export function removePositionalConstraint(w,id,reason='release'){
  const m=ensureConstraintDynamics(w),c=m.constraints.get(id);if(!c)return null;m.constraints.delete(id);m.history.push({time:w.elapsedDays??0,type:'physical_constraint_break',constraint:id,form:c.form,reason});return c;
}

function activeJoints(w){return [...(w.materialTopology?.joints?.values?.()||[])].filter(j=>j.active!==false&&w.forms.get(j.a)?.alive&&w.forms.get(j.b)?.alive);}
function retainedComponents(w){
  const edges=activeJoints(w),adj=new Map();for(const e of edges){if(!adj.has(e.a))adj.set(e.a,new Set());if(!adj.has(e.b))adj.set(e.b,new Set());adj.get(e.a).add(e.b);adj.get(e.b).add(e.a);}
  const constrained=[...ensureConstraintDynamics(w).constraints.values()].filter(c=>c.active!==false).map(c=>c.form);for(const id of constrained)if(!adj.has(id))adj.set(id,new Set());
  const seen=new Set(),out=[];for(const id of [...adj.keys()].sort()){if(seen.has(id))continue;const q=[id],members=[];seen.add(id);while(q.length){const x=q.shift();members.push(x);for(const y of [...(adj.get(x)||[])].sort())if(!seen.has(y)){seen.add(y);q.push(y);}}if(members.some(x=>finiteMaterialForm(w.forms.get(x))))out.push(members.sort());}
  return out;
}
function compId(ms){return `RC:${ms.join('+')}`;}
function centerOfMass(w,members){let m=0,x=0,y=0;for(const id of members){const f=w.forms.get(id);if(!f?.alive)continue;const q=materialMassLike(f);m+=q;x+=q*f.pos.x;y+=q*f.pos.y;}return {x:x/Math.max(.001,m),y:y/Math.max(.001,m),mass:m};}
function inertiaAbout(w,members,pivot){let I=0;for(const id of members){const f=w.forms.get(id);if(!f?.alive)continue;const m=materialMassLike(f),r=formRadius(f),d=distance(f.pos,pivot);I+=m*(d*d+.5*r*r);}return Math.max(.004,I);}
function constraintHologram(w,members,constraints,state){
  const out=aggregateHolograms(members.map(id=>w.forms.get(id)).filter(Boolean).map(f=>intrinsicHologram(w,f))),c=clamp(constraints.length/3),turn=clamp(Math.abs(state.angularVelocity||0)*2),hold=clamp(avg(constraints.map(x=>x.strength??0)));
  out.C.order=clamp(out.C.order*.72+hold*.28);out.C.process=clamp(out.C.process*.68+turn*.32);out.M.ground=clamp(out.M.ground*.76+c*.24);out.M.order=clamp(out.M.order*.70+hold*.30);out.P.order=clamp(out.P.order*.58+hold*.28+(1-turn)*.14);out.P.process=clamp(out.P.process*.58+turn*.42);return out;
}
function loadsFromEvents(w,events=[]){
  const out=[];const push=(form,F,point,kind,source=null)=>{const f=w.forms.get(form);if(!f?.alive||!finiteMaterialForm(f)||!Number.isFinite(F?.x)||!Number.isFinite(F?.y)||vectorLength(F)<1e-10)return;out.push({form,F:{...F},point:point?{...point}:{...f.pos},kind,source});};
  for(const e of events){
    if(e.type==='external_material_load'||e.type==='structural_test_load'){
      const mag=Number.isFinite(e.magnitude)?e.magnitude:vectorLength(e.vector||{}),dir=unit(e.vector||{x:1,y:0});push(e.form,vscale(dir,mag),e.applicationPoint,e.type,e.source||null);
    }else if(e.type==='force_mediation'){
      const a=w.forms.get(e.mediator),b=w.forms.get(e.target);if(!a?.pos||!b?.pos)continue;const dir=unit(displacement(a.pos,b.pos)),q=Math.max(0,e.impulse??0);
      const pa=add(a.pos,dir,formRadius(a)),pb=add(b.pos,dir,-formRadius(b));push(a.id,vscale(dir,-q),pa,'force_reaction',b.id);if(e.targetKind==='material')push(b.id,vscale(dir,q),pb,'force_mediation',a.id);
    }else if(e.type==='material_contact'){
      const a=w.forms.get(e.actor),b=w.forms.get(e.material);if(!a?.pos||!b?.pos)continue;const dir=unit(displacement(a.pos,b.pos)),q=Math.max(0,e.relativeSpeed??0)*.02;push(b.id,vscale(dir,q),add(b.pos,dir,-formRadius(b)),'material_contact',a.id);
    }
  }
  return out;
}
function componentLoads(loads,members){const set=new Set(members);return loads.filter(x=>set.has(x.form));}
function forceTorque(loads,origin){let F={x:0,y:0},tau=0;for(const l of loads){F=vadd(F,l.F);tau+=cross(displacement(origin,l.point),l.F);}return {F,tau};}
function blockers(w,members){const set=new Set(members);return [...w.forms.values()].filter(f=>f.alive&&!set.has(f.id)&&(f.kind==='person'||f.kind==='animal'||finiteMaterialForm(f)));}
function rotationClear(w,members,pivot,angle){const bs=blockers(w,members);for(const id of members){const f=w.forms.get(id);if(!f?.alive)continue;const p=rotatePoint(f.pos,pivot,angle),r=formRadius(f);if(p.x<r||p.x>w.w-1-r||p.y<r||p.y>w.h-1-r)return false;for(const b of bs)if(distance(p,b.pos)<r+formRadius(b)-1e-7)return false;}return true;}
function admissibleAngle(w,members,pivot,want){if(Math.abs(want)<1e-10)return 0;if(rotationClear(w,members,pivot,want))return want;let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(rotationClear(w,members,pivot,want*mid))lo=mid;else hi=mid;}return want*lo;}
function rotateComponent(w,members,pivot,angle){if(Math.abs(angle)<1e-12)return;const set=new Set(members);for(const id of members){const f=w.forms.get(id);if(!f?.alive)continue;f.prevPos={...f.pos};f.pos=rotatePoint(f.pos,pivot,angle);f.orientation=normAngle((f.orientation||0)+angle);}
  for(const j of activeJoints(w))if(set.has(j.a)&&set.has(j.b)){const a=w.forms.get(j.a),b=w.forms.get(j.b);j.offset=displacement(a.pos,b.pos);}
}

// Numerical support reactions are fed into structural stress. They are not ontological events.
export function resolveConstraintReactions(w,events=[]){
  const mech=ensureConstraintDynamics(w),loads=loadsFromEvents(w,events),out=[];
  for(const members of retainedComponents(w)){
    const cs=[...mech.constraints.values()].filter(c=>c.active!==false&&members.includes(c.form));if(!cs.length)continue;const ls=componentLoads(loads,members);if(!ls.length)continue;
    const origin=cs.length===1?cs[0].point:centerOfMass(w,members),ft=forceTorque(ls,origin),share=vscale(ft.F,-1/cs.length);
    for(const c of cs)out.push({type:'constraint_reaction',form:c.form,constraint:c.id,vector:{...share},magnitude:vectorLength(share),source:'positional_constraint',numerical:true});
  }
  return out;
}

export function commitConstraintDynamics(w,events=[]){
  const mech=ensureConstraintDynamics(w),dt=w.time?.dtDays??1/24,loads=loadsFromEvents(w,events),next=new Map(),out=[];
  for(const members of retainedComponents(w)){
    const id=compId(members),prev=mech.components.get(id)||{},cs=[...mech.constraints.values()].filter(c=>c.active!==false&&members.includes(c.form)),ls=componentLoads(loads,members),com=centerOfMass(w,members);
    let pivot=com,mode='free',canRotate=false;if(cs.length===1&&cs[0].rotationalFreedom){pivot=cs[0].point;mode='single_constraint';canRotate=true;}else if(cs.length>=2){mode='multi_constraint';pivot=com;}else if(cs.length===0){mode='free';pivot=com;const ft0=forceTorque(ls,com);canRotate=vectorLength(ft0.F)<.01&&Math.abs(ft0.tau)>.001;}
    const ft=forceTorque(ls,pivot),I=inertiaAbout(w,members,pivot),alpha=canRotate?ft.tau/I*0.055:0,omega0=prev.angularVelocity??0;
    let omega=canRotate?clamp(omega0+alpha*dt,-2.5,2.5):omega0*.90,dtheta=canRotate?(omega0*dt+.5*alpha*dt*dt):0;dtheta=clamp(dtheta,-.22,.22);
    const allowed=admissibleAngle(w,members,pivot,dtheta);if(Math.abs(allowed)<Math.abs(dtheta)*.98)omega*=.35;dtheta=allowed;
    if(canRotate&&Math.abs(dtheta)>1e-10)rotateComponent(w,members,pivot,dtheta);
    const angle=normAngle((prev.angle??0)+dtheta),constraintStrength=cs.length?avg(cs.map(c=>c.strength)):0,reactionDemand=cs.length?vectorLength(ft.F)+Math.abs(ft.tau)/(Math.sqrt(I)+.05):0;
    const rec={id,members:[...members],mode,pivot:{...pivot},angle,angularVelocity:omega,netForce:{...ft.F},torque:ft.tau,inertia:I,constraints:cs.map(c=>c.id),reactionDemand,last:w.elapsedDays??0,hologram:null,layers:null,lastMomentAngle:prev.lastMomentAngle??0};
    rec.hologram=constraintHologram(w,members,cs,rec);rec.layers=namedLayers(rec.hologram);next.set(id,rec);
    const shift=Math.abs(normAngle(angle-(prev.lastMomentAngle??0)));if(shift>.20){out.push({type:'orientation_shift',configuration:id,members:[...members],constraints:cs.map(c=>c.id),angle,delta:shift,mode,torque:ft.tau});rec.lastMomentAngle=angle;}
    // Constraint overload is duration-based; a support can fail without becoming an Anchor/Fulcrum kind.
    for(const c of cs){const ratio=reactionDemand/Math.max(.08,c.strength*1.6),pc=mech.constraints.get(c.id);pc.overloadDays=ratio>1?(pc.overloadDays??0)+dt:Math.max(0,(pc.overloadDays??0)-dt*.5);if(ratio>2.2||(ratio>1.25&&pc.overloadDays>.08)){mech.constraints.delete(c.id);out.push({type:'physical_constraint_break',constraint:c.id,form:c.form,reason:'load',ratio});}}
  }
  mech.components=next;for(const e of out)mech.history.push({time:w.elapsedDays??0,...e});if(mech.history.length>4000)mech.history.splice(0,mech.history.length-4000);return out;
}

export function snapshotConstraintDynamics(w){const m=ensureConstraintDynamics(w),clone=x=>JSON.parse(JSON.stringify(x));return Object.freeze({constraints:new Map([...m.constraints].map(([k,v])=>[k,clone(v)])),components:new Map([...m.components].map(([k,v])=>[k,clone(v)]))});}
export function constraintDynamicsAudit(w){const m=ensureConstraintDynamics(w),cs=[...m.constraints.values()],comps=[...m.components.values()];return {constraints:cs.length,components:comps.length,singleConstraint:comps.filter(c=>c.mode==='single_constraint').length,multiConstraint:comps.filter(c=>c.mode==='multi_constraint').length,rotating:comps.filter(c=>Math.abs(c.angularVelocity??0)>.001).length,maxAngularVelocity:Math.max(0,...comps.map(c=>Math.abs(c.angularVelocity??0))),holographicConstraints:cs.filter(c=>c.hologram&&c.layers).length,holographicComponents:comps.filter(c=>c.hologram&&c.layers).length,history:m.history.length};}
