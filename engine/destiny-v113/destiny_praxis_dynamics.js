// DESTINY v1.01 — PRAXIS / ITERATIVE ACTUALISATION / ERROR-CORRECTED MAKING
//
// SOURCE-GROUNDED LAW
// - Light & Chaos: action is situated feedback with Reality; repeated actions that actually work
//   become retained ways of dealing with the world. Making is limited by the qualities of the medium
//   and the maker's understanding of it.
// - Notebook material repeatedly depicts unfinished scaffolding, attempts, amendment, return,
//   adjustment and labour. Reality answers the projected future; the actor works from that answer.
// - Collapse into Form: recurrence leaves Trace and can reveal the shape of the system; Simulation
//   forbids representation from substituting for ground.
//
// ENGINE LAW
// Praxis is NOT a scripted action-list, Plan object, Craft verb or extra Force. It is the recursive
// relation between a non-actual counterfactual and the committed Physical result of attempts to
// reduce its discrepancy. Failure can alter the next local route without changing the desired
// relation, and successful partial actuality is retained rather than reset.
//
// Engineering inference: discrepancy equations, stagnation windows, detour geometry and thresholds.

import {clamp} from './destiny_unified_kernel.js';
import {distance, displacement, unit, add, formRadius, clampPosition} from './destiny_embodied_geometry.js';
import {ensurePracticalMemory, practicalSituationSignature, practicalConductance, retainPracticalEpisode} from './destiny_practical_memory.js';

const deep=x=>JSON.parse(JSON.stringify(x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const pairKey=(a,b)=>[a,b].sort().join('|');
function named(h){return {consciousness:{...h.C},mind:{...h.M},physical:{...h.P}};}

export function ensurePraxisState(w,entity){
  if(!w._praxisSerial)w._praxisSerial=0;
  if(entity.praxisEpisode===undefined)entity.praxisEpisode=null;
  if(!entity.praxisHistory)entity.praxisHistory=[];
  if(!entity.praxisMemory)entity.praxisMemory=[];
  ensurePracticalMemory(entity);
}

function crisisOf(p){if(!p?.body)return 0;return clamp(Math.max(1-(p.body.energy??1),1-(p.body.water??1),1-(p.body.integrity??1)));}
function currentCoupling(w,actor,id){const c=w.materialCouplings?.get(id);return c?.anchor===actor?c:null;}
function contactGap(a,b){return (a?.geometry?.radius??.2)+(b?.geometry?.radius??.2)+.006;}

function discrepancyWorld(w,p,cf){
  if(!cf?.configuration?.nodes?.length)return 1;
  const [aId,bId]=cf.configuration.nodes,a=w.forms.get(aId),b=w.forms.get(bId);if(!a?.alive||!b?.alive)return 1;
  const topo=w.materialTopology,key=pairKey(aId,bId);if(topo?.contacts?.get(key)?.active||topo?.joints?.get(key))return 0;
  const ca=currentCoupling(w,p.id,aId),cb=currentCoupling(w,p.id,bId);
  if(ca||cb)return clamp(Math.max(0,distance(a.pos,b.pos)-contactGap(a,b))/4);
  const focus=w.forms.get(cf.focus);if(!focus)return 1;
  const reach=(p.geometry?.reach??.5)+(focus.geometry?.radius??.2)-.015;
  return clamp(Math.max(0,distance(p.pos,focus.pos)-Math.max(.05,reach))/4);
}

function extendedEnvelope(w,p){
  let r=formRadius(p);
  for(const c of w.materialCouplings?.values?.()||[]){
    if(c.anchor!==p.id)continue;const m=w.forms.get(c.material);if(!m?.alive)continue;
    r=Math.max(r,distance(p.pos,m.pos)+formRadius(m));
  }
  return r;
}

function praxisHologram(w,p,ep,cf){
  const crisis=crisisOf(p),progress=clamp(1-(ep.lastDiscrepancy??1)),revision=clamp((ep.revisions||0)/4),stagnation=clamp((ep.stagnantDays||0)/.8);
  return {
    C:{ground:clamp(.10+(p.apparatus?.receptor??.5)*.30),order:clamp(.10+(cf?.support??.4)*.34+revision*.12),process:clamp(.08+progress*.24+revision*.22)},
    M:{ground:clamp(.12+(p.apparatus?.retention??.5)*.38),order:clamp(.14+(cf?.support??.4)*.38+revision*.20),process:clamp(.10+progress*.28+(1-stagnation)*.12+revision*.18)},
    P:{ground:clamp(.10+(1-crisis)*.42),order:clamp(.10+extendedEnvelope(w,p)*.03),process:clamp(.06+progress*.24+(1-crisis)*.14)}
  };
}

function deterministicSide(id,blocker){let h=2166136261>>>0;for(const ch of `${id}|${blocker}`){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return (h&1)?1:-1;}
function detourWaypoint(w,p,es,s,baseGoal,blockerId){
  const blocker=s.forms.get(blockerId);if(!blocker?.alive||!baseGoal)return null;
  let d=unit(displacement(es.pos,baseGoal));if(Math.hypot(d.x,d.y)<1e-9)d={x:1,y:0};
  const side=deterministicSide(p.id,blockerId),perp={x:-d.y*side,y:d.x*side};
  const envelope=extendedEnvelope(w,p),clearance=envelope+formRadius(blocker)+.18;
  // Revision begins from the actually encountered geometry: first open the blocked relation
  // tangentially rather than asking the carried configuration to pass through the blocker.
  // This is a local engineering bridge, not global pathfinding or an authored PLACE action.
  const retreat=Math.min(.12,clearance*.10);
  return clampPosition({x:es.pos.x+perp.x*clearance-d.x*retreat,y:es.pos.y+perp.y*clearance-d.y*retreat},s.w,s.h,envelope);
}

export function preparePraxisDynamics(w,entity,es,s,projection,{dtDays=1/24}={}){
  if(entity?.kind!=='person'){return {projection,events:[]};}
  ensurePraxisState(w,entity);const events=[];let ep=entity.praxisEpisode;
  if(!projection){return {projection:null,events};}
  if(!ep||ep.counterfactualId!==projection.id){
    ep={id:`PX${++w._praxisSerial}`,counterfactualId:projection.id,openedDay:w.elapsedDays,lastDay:w.elapsedDays,phase:projection.phase||null,
      lastDiscrepancy:null,bestDiscrepancy:1,stagnantDays:0,revisions:0,waypoint:null,pendingBlocker:null,lastBlocker:null,status:'active'};
    entity.praxisEpisode=ep;events.push({type:'praxis_attempt_open',actor:entity.id,praxis:ep.id,counterfactual:projection.id,phase:projection.phase||null});
  }
  const adjusted=deep(projection),baseGoal=projection.goalPos?{...projection.goalPos}:null;
  if(ep.waypoint){
    if(distance(es.pos,ep.waypoint)<=Math.max(.08,(es.geometry?.radius??.25)*.45)){
      events.push({type:'praxis_revision_complete',actor:entity.id,praxis:ep.id,counterfactual:projection.id,revision:ep.revisions});
      ep.waypoint=null;ep.pendingBlocker=null;ep.stagnantDays=0;
    }
  }
  if(!ep.waypoint&&ep.pendingBlocker&&baseGoal){
    const wp=detourWaypoint(w,entity,es,s,baseGoal,ep.pendingBlocker);
    if(wp){ep.waypoint=wp;ep.revisions++;events.push({type:'praxis_revision_open',actor:entity.id,praxis:ep.id,counterfactual:projection.id,blocker:ep.pendingBlocker,waypoint:{...wp},revision:ep.revisions});}
  }
  if(ep.waypoint){adjusted.goalPos={...ep.waypoint};adjusted.praxisPhase='revision_bypass';adjusted.praxisBaseGoal=baseGoal;}
  adjusted.praxis={id:ep.id,revisions:ep.revisions,stagnantDays:ep.stagnantDays,waypoint:ep.waypoint?{...ep.waypoint}:null};
  ep.lastDay=w.elapsedDays;const h=praxisHologram(w,entity,ep,projection);ep.hologram=h;ep.layers=named(h);
  for(const e of events){e.praxisHologram=deep(h);entity.praxisHistory.push({clock:w.clock,...deep(e)});}
  if(entity.praxisHistory.length>260)entity.praxisHistory.splice(0,entity.praxisHistory.length-260);
  return {projection:adjusted,events};
}

function relevantBlocker(w,p,cf,events){
  const desired=new Set(cf?.configuration?.nodes||[]);
  for(const e of events){
    if(e.type==='material_contact'&&e.actor===p.id&&!desired.has(e.material))return e.material;
    if(e.type==='force_mediation'&&e.anchor===p.id&&!desired.has(e.target))return e.target;
    if(e.type==='bodily_contact'&&Array.isArray(e.actors)&&e.actors.includes(p.id)){const q=e.actors.find(x=>x!==p.id);if(q&&!desired.has(q))return q;}
  }
  return null;
}

function closeEpisode(w,p,ep,reason,success=false){
  const rec={id:ep.id,counterfactualId:ep.counterfactualId,openedDay:ep.openedDay,closedDay:w.elapsedDays,durationDays:Math.max(0,(w.elapsedDays??0)-(ep.openedDay??0)),
    revisions:ep.revisions||0,bestDiscrepancy:ep.bestDiscrepancy??1,blockers:[...(ep.blockers||[])],success,reason};
  p.praxisMemory.push(rec);if(p.praxisMemory.length>96)p.praxisMemory.splice(0,p.praxisMemory.length-96);
  retainPracticalEpisode(w,p,ep,rec);
  p.praxisEpisode=null;return rec;
}

// Called after Physical commit and Imagination's reality-check. It reads what actually happened;
// it never retroactively changes the interval just committed.
export function commitPraxisDynamics(w,events=[]){
  const out=[],dt=w.time?.dtDays??1/24,people=[...w.forms.values()].filter(f=>f.alive&&f.kind==='person');
  for(const p of people){ensurePraxisState(w,p);const ep=p.praxisEpisode;if(!ep)continue;
    const actual=events.find(e=>e.type==='counterfactual_actualised'&&e.actor===p.id&&e.counterfactual===ep.counterfactualId);
    if(actual){const rec=closeEpisode(w,p,ep,'actualised',true);out.push({type:'praxis_actualised',actor:p.id,praxis:ep.id,counterfactual:ep.counterfactualId,revisions:rec.revisions,durationDays:rec.durationDays});continue;}
    const closed=events.find(e=>e.type==='counterfactual_projection_close'&&e.actor===p.id&&e.counterfactual===ep.counterfactualId);
    if(closed){const rec=closeEpisode(w,p,ep,closed.reason||'projection_closed',false);out.push({type:'praxis_close',actor:p.id,praxis:ep.id,counterfactual:ep.counterfactualId,reason:rec.reason,revisions:rec.revisions});continue;}
    const cf=p.counterfactualProjection;if(!cf||cf.id!==ep.counterfactualId)continue;
    const d=discrepancyWorld(w,p,cf),prev=ep.lastDiscrepancy;
    ep.bestDiscrepancy=Math.min(ep.bestDiscrepancy??1,d);
    if(prev==null||prev-d>.003){ep.stagnantDays=Math.max(0,(ep.stagnantDays||0)-dt*.6);}else ep.stagnantDays=(ep.stagnantDays||0)+dt;
    if(cf.phase!==ep.phase){out.push({type:'praxis_phase_shift',actor:p.id,praxis:ep.id,counterfactual:cf.id,from:ep.phase,to:cf.phase});ep.phase=cf.phase;ep.stagnantDays=0;}
    const blocker=relevantBlocker(w,p,cf,events);
    if(blocker){
      ep.blockers=ep.blockers||[];if(!ep.blockers.includes(blocker))ep.blockers.push(blocker);ep.lastBlocker=blocker;
      const sig=practicalSituationSignature(w,p,cf,blocker);ep.situationSignatures=ep.situationSignatures||[];if(sig&&!ep.situationSignatures.includes(sig))ep.situationSignatures.push(sig);
      const learned=practicalConductance(p,sig);
      // Habit is retained conductance, not a recipe: familiarity makes a structurally familiar
      // impasse legible sooner, but it neither creates the revision route nor guarantees success.
      const impasseThreshold=Math.max(.045,.10*(1-.48*learned.familiarity));
      if(ep.stagnantDays>=impasseThreshold&&!ep.waypoint&&ep.pendingBlocker!==blocker){ep.pendingBlocker=blocker;out.push({type:'praxis_impasse',actor:p.id,praxis:ep.id,counterfactual:cf.id,blocker,discrepancy:d,practicalSignature:sig,practicalFamiliarity:learned.familiarity,practicalEfficacy:learned.efficacy,impasseThresholdDays:impasseThreshold});}
    }
    if(ep.stagnantDays>=.85&&!ep.stallRecorded){ep.stallRecorded=true;out.push({type:'praxis_stall',actor:p.id,praxis:ep.id,counterfactual:cf.id,discrepancy:d});}
    if(prev!=null&&prev-d>.02)ep.stallRecorded=false;
    ep.lastDiscrepancy=d;ep.lastDay=w.elapsedDays;const h=praxisHologram(w,p,ep,cf);ep.hologram=h;ep.layers=named(h);
  }
  for(const p of people){if(p.praxisHistory.length>260)p.praxisHistory.splice(0,p.praxisHistory.length-260);}
  for(const e of out){const p=w.forms.get(e.actor);if(p){p.praxisHistory.push({clock:w.clock,...e});}}
  return out;
}

export function praxisAudit(w){
  const people=[...w.forms.values()].filter(f=>f.kind==='person'),active=people.filter(p=>p.praxisEpisode),hist=people.flatMap(p=>p.praxisHistory||[]),mem=people.flatMap(p=>p.praxisMemory||[]);
  const practical=people.flatMap(p=>p.practicalTraces||[]);
  return {active:active.length,practicalTraces:practical.length,peopleWithPracticalTrace:people.filter(p=>(p.practicalTraces||[]).length).length,opens:hist.filter(e=>e.type==='praxis_attempt_open').length,impasses:hist.filter(e=>e.type==='praxis_impasse').length,revisions:hist.filter(e=>e.type==='praxis_revision_open').length,
    revisionCompletes:hist.filter(e=>e.type==='praxis_revision_complete').length,actualised:hist.filter(e=>e.type==='praxis_actualised').length,closes:hist.filter(e=>e.type==='praxis_close').length,
    memories:mem.length,successfulMemories:mem.filter(x=>x.success).length,meanRevisions:mem.length?avg(mem.map(x=>x.revisions||0)):0,storedPraxisStats:people.filter(p=>Object.prototype.hasOwnProperty.call(p,'praxis')).length};
}
