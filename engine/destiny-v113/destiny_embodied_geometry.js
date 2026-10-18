// DESTINY v0.94 — EMBODIED GEOMETRY (time-decoupled)
//
// Physical geometry is a conduit of relation, not Relation itself.
// This module gives finite material bodies extent, reach, trajectories and swept contact.
// It deliberately does not encode semantic actions such as ATTACK, HUNT, TOOL or SHELTER.

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const hypot=(x,y)=>Math.hypot(x,y);

export function distance(a,b){return hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));}
export function displacement(a,b){return {x:(b.x||0)-(a.x||0),y:(b.y||0)-(a.y||0)};}
export function vectorLength(v){return hypot(v.x||0,v.y||0);}
export function unit(v){const n=vectorLength(v);return n>1e-12?{x:v.x/n,y:v.y/n}:{x:0,y:0};}
export function add(a,v,k=1){return {x:(a.x||0)+(v.x||0)*k,y:(a.y||0)+(v.y||0)*k};}
export function lerp(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
export function dot(a,b){return (a.x||0)*(b.x||0)+(a.y||0)*(b.y||0);}

export function bodyRadius(f){
  const mass=Math.max(.03,f?.mass??(f?.kind==='person'?.72:.3));
  // Radius is material extent, not a species/role label. Mass only approximates body scale.
  return clamp(.16+Math.cbrt(mass)*.16,.20,.48);
}

export function formRadius(f){
  if(!f)return .18;
  if(f.kind==='person'||f.kind==='animal')return bodyRadius(f);
  const stock=Math.max(.01,f.material?.stock??1);
  const rigidity=f.material?.rigidity??0,capacity=f.material?.capacity??0,cover=f.material?.cover??0;
  return clamp(.12+Math.cbrt(stock)*.08+rigidity*.08+Math.max(capacity,cover)*.12,.12,.55);
}

export function reachRadius(f){
  const r=formRadius(f);
  if(f?.kind==='person')return r+.18+(f.capacities?.manipulation??.5)*.18;
  if(f?.kind==='animal')return r+.08+(f.forceCapacity??.25)*.10;
  return r;
}

export function maxTravel(f,dtDays=1){
  const mobility=f?.kind==='person'?(f.material?.mobility??.5):(f?.mobility??.45);
  const bodyIntegrity=f?.body?.integrity??1,energy=f?.body?.energy??1,water=f?.body?.water??1;
  const condition=clamp(.35+.35*bodyIntegrity+.18*energy+.12*water,.2,1);
  // Physical travel scales with elapsed time. The numerical integration interval is not a Moment.
  // Earlier sqrt(dt) + fixed minimum travel caused smaller timesteps to manufacture extra motion.
  const dailySpeed=(.18+.78*mobility)*condition;
  return clamp(dailySpeed*Math.max(0,dtDays),0,1.05);
}

export function clampPosition(p,w,h,radius=0){
  const minX=Math.min(Math.max(0,radius),Math.max(0,(w-1)/2));
  const minY=Math.min(Math.max(0,radius),Math.max(0,(h-1)/2));
  return {x:Math.max(minX,Math.min(w-1-minX,p.x)),y:Math.max(minY,Math.min(h-1-minY,p.y))};
}

export function rasterCell(pos,w=null,h=null){
  let x=Math.round(pos.x||0),y=Math.round(pos.y||0);
  if(w!=null)x=Math.max(0,Math.min(w-1,x));
  if(h!=null)y=Math.max(0,Math.min(h-1,y));
  return {x,y};
}

export function withinReach(receiver,source,extra=0){
  return distance(receiver.pos,source.pos)<=reachRadius(receiver)+formRadius(source)+extra;
}

// Earliest swept-circle contact between two simultaneously moving bodies.
// Returns null for a near miss and for bodies that begin overlapped but are stationary/separating.
export function sweptContact(a0,a1,ra,b0,b1,rb){
  const p={x:a0.x-b0.x,y:a0.y-b0.y};
  const va={x:a1.x-a0.x,y:a1.y-a0.y},vb={x:b1.x-b0.x,y:b1.y-b0.y};
  const v={x:va.x-vb.x,y:va.y-vb.y};
  const R=Math.max(.001,ra+rb),c=dot(p,p)-R*R,a=dot(v,v),b=2*dot(p,v);
  if(c<=0){
    if(a<1e-12||dot(p,v)>=0)return null;
    return {t:0,relativeSpeed:Math.sqrt(a),startedOverlapping:true};
  }
  if(a<1e-12)return null;
  const disc=b*b-4*a*c;if(disc<0)return null;
  const s=Math.sqrt(disc),t1=(-b-s)/(2*a),t2=(-b+s)/(2*a);
  const t=t1>=0&&t1<=1?t1:(t2>=0&&t2<=1?t2:null);
  if(t==null)return null;
  return {t,relativeSpeed:Math.sqrt(a),startedOverlapping:false};
}

export function closestApproach(a0,a1,b0,b1){
  const p={x:a0.x-b0.x,y:a0.y-b0.y};
  const v={x:(a1.x-a0.x)-(b1.x-b0.x),y:(a1.y-a0.y)-(b1.y-b0.y)};
  const vv=dot(v,v),t=vv<1e-12?0:clamp(-dot(p,v)/vv,0,1);
  const q={x:p.x+v.x*t,y:p.y+v.y*t};
  return {t,distance:vectorLength(q)};
}

export function trajectoryEndpoint(from,direction,maxDistance,w,h,radius=0){
  const u=unit(direction);return clampPosition(add(from,u,maxDistance),w,h,radius);
}
