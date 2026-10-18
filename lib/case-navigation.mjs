import { distance, formRadius } from '../engine/scene-geometry.js';
import { finiteMaterialForm } from '../engine/destiny-v113/destiny_material_dynamics.js';
import { person,visible } from './case-world.mjs';

function clear(a,b,blocks){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  for(const c of blocks){
    const da=distance(a,c);
    if(da<c.r+.001){if(distance(b,c)>da+.001)continue;return false;}
    const t=len?Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/len)):0;
    if(Math.hypot(a.x+t*dx-c.x,a.y+t*dy-c.y)<c.r-1e-5)return false;
  }
  return true;
}
function pathFor(start,goal,blocks,bounds,allCandidates=false){
  const direct=blocks.filter(c=>!clear(start,goal,[c]));
  const candidates=allCandidates?blocks:direct.length?direct:blocks;
  const nodes=[start,goal];
  for(const c of candidates)for(let j=0;j<16;j++){
    const angle=j*Math.PI/8,r=c.r*1.12,p={x:c.x+Math.cos(angle)*r,y:c.y+Math.sin(angle)*r};
    if(p.x>=bounds.r&&p.x<=bounds.w-1-bounds.r&&p.y>=bounds.r&&p.y<=bounds.h-1-bounds.r&&blocks.every(o=>distance(p,o)>=o.r-.001))nodes.push(p);
  }
  const costs=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),visited=new Set();costs[0]=0;
  for(let n=0;n<nodes.length;n++){
    let current=-1,best=Infinity;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&costs[i]<best){best=costs[i];current=i;}
    if(current<0)break;if(current===1){const path=[];for(let i=1;i>0;i=prev[i])path.unshift(nodes[i]);return path;}
    visited.add(current);
    for(let i=1;i<nodes.length;i++)if(!visited.has(i)&&clear(nodes[current],nodes[i],blocks)){
      const cost=costs[current]+distance(nodes[current],nodes[i]);if(cost<costs[i]){costs[i]=cost;prev[i]=current;}
    }
  }
  return null;
}
export function navigationOrientation(s,id,task){
  const p=person(s,id),target=person(s,task.target),targetPos=visible(s,id,task.target)?target.pos:task.goal;
  if(distance(p.pos,targetPos)<=task.stopDistance+.005)return{goal:null,stopDistance:0};
  const magnitude=distance(p.pos,targetPos)||1;
  let goal={x:targetPos.x+(p.pos.x-targetPos.x)/magnitude*task.stopDistance,y:targetPos.y+(p.pos.y-targetPos.y)/magnitude*task.stopDistance};
  const r=formRadius(p),blocks=[];
  for(const f of s.world.forms.values()){
    if(f.id===id||!f.alive||s.world.materialCouplings.get(f.id)?.anchor===id)continue;
    if(f.kind!=='person'&&!finiteMaterialForm(f))continue;
    const known=p.known.get(f.id);if(!visible(s,id,f.id)&&!known?.lastPos)continue;
    const pos=visible(s,id,f.id)?f.pos:known.lastPos;
    blocks.push({...pos,r:r+formRadius(f)+.025});
  }
  if(blocks.some(b=>distance(goal,b)<b.r)){
    const ring=[];for(let i=0;i<16;i++){const a=i*Math.PI/8,q={x:targetPos.x+Math.cos(a)*task.stopDistance,y:targetPos.y+Math.sin(a)*task.stopDistance};if(blocks.every(b=>distance(q,b)>=b.r))ring.push(q);}
    ring.sort((a,b)=>distance(p.pos,a)-distance(p.pos,b));if(ring[0])goal=ring[0];
  }
  if(clear(p.pos,goal,blocks))return{goal,stopDistance:.005};
  const key=`${goal.x.toFixed(1)},${goal.y.toFixed(1)}:${blocks.map(b=>`${b.x.toFixed(1)},${b.y.toFixed(1)}`).join('|')}`;
  if(task.navigationKey!==key){
    task.navigationKey=key;const bounds={w:s.world.w,h:s.world.h,r};
    // A detour around the direct blocker can meet another encountered obstacle.
    // Expand the finite visibility graph before concluding no route exists.
    task.path=pathFor(p.pos,goal,blocks,bounds)||pathFor(p.pos,goal,blocks,bounds,true);
  }
  if(task.path){
    for(let i=task.path.length-1;i>=0;i--)if(clear(p.pos,task.path[i],blocks))return{goal:task.path[i],stopDistance:i===task.path.length-1?.005:.0001};
  }
  // Incomplete knowledge or a blocked route remains a constraint, rather than a teleport.
  return{goal:null,stopDistance:0};
}
