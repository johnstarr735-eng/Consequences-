import {clamp} from '../engine/destiny-v113/destiny_unified_kernel.js';
import {distance,formRadius,reachRadius,unit,displacement,clampPosition} from '../engine/scene-geometry.js';
import {NAMES, namesFor,HUMAN_IDS,NPC_IDS,MINUTE,person,visible,reachable,hears,entry,inhabitantIds,nonPlayerIds} from './case-world.mjs';
import {conscious,canSpeak,ensureBody} from './case-life.mjs';
import {acquire,emit} from './case-communication.mjs';
import {handlingCoordination} from './character-model.mjs';


export function recentEncounter(s,id){return s.encounters?.[id]?.at(-1)||null;}
export function recordEncounter(s,{actor,target,process,text,harmful=false,audible=false,root=null,targetAware=true}){
  const id=root||`encounter:${++s.serial}`,record={root:id,key:`${id}:1`,version:1,title:'An encountered event',text,category:'incident',actor,target,process,harmful,at:s.world.elapsedDays};
  s.encounters||={};s.incidents||=[];
  const reached=inhabitantIds(s).filter(id=>conscious(person(s,id))&&(id===actor||(id===target&&targetAware)||(visible(s,id,actor)&&visible(s,id,target))));
  s.incidents.push({...record,witnesses:[...reached]});
  for(const who of reached){
    (s.encounters[who]||=[]).push({...record,mode:'direct'});
    if(HUMAN_IDS.includes(who)){acquire(s,who,record,'direct');entry(s,[who],'observation',text);}
  }
  if(audible){
    const listeners=inhabitantIds(s).filter(id=>!reached.includes(id)&&hears(s,target,id));
    for(const who of listeners){const heard={...record,text:`You hear a disturbance near ${namesFor(s)[target]}; sound alone does not identify what happened or who caused it.`,actor:null,mode:'heard'};(s.encounters[who]||=[]).push(heard);if(HUMAN_IDS.includes(who))entry(s,[who],'observation',heard.text);}
  }
  return record;
}
function observeOngoingIncident(s,rec){
  for(const who of inhabitantIds(s)){
    if(!conscious(person(s,who))||!visible(s,who,rec.actor)||!visible(s,who,rec.target)||(s.encounters?.[who]||[]).some(e=>e.root===rec.root&&e.mode==='direct'))continue;
    const {witnesses,...record}=rec;
    const encountered={...record,text:`${namesFor(s)[rec.actor]} is making forceful contact with ${namesFor(s)[rec.target]} now. You did not encounter its earlier beginning.`,at:s.world.elapsedDays,mode:'direct'};
    (s.encounters[who]||=[]).push(encountered);rec.witnesses.push(who);
    if(HUMAN_IDS.includes(who)){acquire(s,who,encountered,'direct');entry(s,[who],'observation',encountered.text);}
  }
}
function strength(p,encounter=null){if(!conscious(p))return 0;return Math.max(0,(p.capacities?.forceTransmission||0)*(p.material?.force||0)*(.2+.8*Math.min(p.body.energy,p.body.water,p.body.integrity))*(.65+.35*handlingCoordination(p,encounter)));}
export function awayGoal(s,id,from){const p=person(s,id),f=person(s,from),known=visible(s,id,from)?f.pos:p.known.get(from)?.lastPos;if(!known)return null;let v=unit(displacement(known,p.pos));if(!v.x&&!v.y)v={x:1,y:0};return clampPosition({x:p.pos.x+v.x*2,y:p.pos.y+v.y*2},s.world.w,s.world.h,formRadius(p));}
export function npcOrientation(s,id){
  if(!conscious(person(s,id)))return{goal:null,stopDistance:0};
  const recent=[...(s.encounters?.[id]||[])].reverse().find(e=>e.harmful&&e.mode==='direct');
  if(recent&&recent.actor!==id){
    if(recent.target===id)return{goal:awayGoal(s,id,recent.actor),stopDistance:.05};
    // Witnesses act only on their own encounter. Approach to interrupt the contact.
    if(conscious(person(s,recent.target))&&visible(s,id,recent.actor))return{goal:{...person(s,recent.actor).pos},stopDistance:.85};
  }
  const k=s.npcKnowledge[id],retreat=k.breaches.length?(id==='N'?{x:1.2,y:6.2}:id==='D'?{x:6.8,y:6.2}:{x:4,y:.6}):null;
  return{goal:retreat,stopDistance:.15};
}
export function physicalOrientation(s,id,t){
  if(!conscious(person(s,id)))return{goal:null,stopDistance:0};
  if(t?.kind==='flee')return{goal:awayGoal(s,id,t.target),stopDistance:.05};
  if(t?.kind==='contact'&&visible(s,id,t.target))return{goal:{...person(s,t.target).pos},stopDistance:Math.max(formRadius(person(s,id))+formRadius(person(s,t.target))+.03,.68)};
  return{goal:null,stopDistance:0};
}
export function preparePhysicalInterval(s,tasks){
  const restore=[];
  for(const id of inhabitantIds(s)){const p=person(s,id);if(!p||p.kind!=='person')continue;const b=ensureBody(p);
    const compressed=b.voiceBlocked;
    if(compressed)b.voiceBlocked=true;
    if(!conscious(p)||compressed||b.restrained>0){restore.push([p,p.material.mobility]);p.material.mobility*=conscious(p)?Math.min(compressed?.35:1,1-.7*(b.restrained||0)):0;}
  }
  return()=>{for(const [p,mobility] of restore)p.material.mobility=mobility;};
}
export function advancePhysicalInterval(s,tasks,dtDays){
  for(const id of inhabitantIds(s))if(person(s,id)?.alive)ensureBody(person(s,id)).restrained=0;
  const minutes=dtDays/MINUTE,pressures=new Map(),strengths=new Map(inhabitantIds(s).map(id=>[id,strength(person(s,id))])),changes=new Map(inhabitantIds(s).map(id=>[id,{energy:0,damage:0,injury:0}]));
  for(const actor of HUMAN_IDS){
    const t=tasks[actor];if(t?.kind!=='contact')continue;const a=person(s,actor),b=person(s,t.target);
    if(!conscious(a)||!b?.alive||b.kind!=='person'||!reachable(s,actor,t.target))continue;
    if(t.instrument&&s.world.materialCouplings.get(t.instrument)?.anchor!==actor){if(!t.missingInstrument){entry(s,[actor],'consequence','That implement is not in your grip. The attempted contact has no such material support.');t.missingInstrument=true;}continue;}
    if(!t.incident){t.incident=recordEncounter(s,{actor,target:t.target,process:t.effect,harmful:true,audible:true,text:`${namesFor(s)[actor]} makes forceful contact with ${namesFor(s)[t.target]}. ${t.effect==='compress'?'The contact constrains their breathing.':t.effect==='restrain'?'They struggle over their freedom of movement.':'The contact strikes their body.'}`}).root;}
    const incident=s.incidents.find(e=>e.root===t.incident);if(incident)observeOngoingIncident(s,incident);
    const defenders=inhabitantIds(s).filter(id=>id!==actor&&id!==t.target&&conscious(person(s,id))&&reachable(s,id,actor)&&((tasks[id]?.kind==='aid'&&tasks[id].target===t.target)||(nonPlayerIds(s).includes(id)&&(s.encounters?.[id]||[]).some(e=>e.root===t.incident&&e.mode==='direct'))));
    const defenseTask=tasks[t.target],resistance=strength(b,defenseTask?.kind==='defend'?{counterpart:a,direct:reachable(s,t.target,actor),timeProfile:'sustained',instrument:null}:null)*(defenseTask?.kind==='defend'?1.6:defenseTask?.kind==='flee'?1.25:.8),opposition=resistance+defenders.reduce((sum,id)=>sum+strengths.get(id)*.8,0),actorStrength=strength(a,{counterpart:b,direct:reachable(s,actor,t.target),timeProfile:t.effect==='impact'?'impulse':'sustained',instrument:t.instrument}),drive=Math.max(0,actorStrength-opposition);
    const pressure=drive/Math.max(.05,actorStrength);
    changes.get(actor).energy+=minutes*.025;changes.get(t.target).energy+=minutes*.015;
    if(t.effect==='compress'){pressures.set(t.target,(pressures.get(t.target)||0)+pressure);changes.get(t.target).injury+=pressure*minutes*.045;}
    else if(t.effect==='restrain'){ensureBody(b).restrained=Math.max(ensureBody(b).restrained||0,pressure);}
    else if(!t.impactApplied){
      const tool=t.instrument?person(s,t.instrument):null,hardness=tool?.material?.hardness||0;
      const damage=Math.min(.45,pressure*(.12+hardness*.2));changes.get(t.target).damage+=damage;changes.get(t.target).injury+=damage;t.impactApplied=true;
    }
    if(defenders.length&&!t.intervened){t.intervened=true;recordEncounter(s,{actor:defenders[0],target:actor,process:'interruption',text:`${defenders.map(id=>namesFor(s)[id]).join(' and ')} intervene in the contact involving ${namesFor(s)[t.target]}. Their bodies add resistance; interruption is not guaranteed.`});}
    if(pressure<=.01&&!t.resisted){t.resisted=true;entry(s,[actor,...(HUMAN_IDS.includes(t.target)?[t.target]:[])],'consequence','Resistance and interruption prevent a sustained effective hold. The attempted act still occurred, and those who encountered it can remember it.');}
  }
  for(const id of inhabitantIds(s)){
    const p=person(s,id);if(!p?.alive||p.kind!=='person')continue;const change=changes.get(id);p.body.energy=clamp(p.body.energy-change.energy);p.body.integrity=clamp(p.body.integrity-change.damage);p.injury=clamp((p.injury||0)+change.injury);const b=ensureBody(p),before=b.conscious,pressure=Math.min(1,pressures.get(id)||0);
    // Abstract finite reserve, exposure and recovery; no real-world physiological claim.
    b.reserve=clamp(b.reserve+minutes*(pressure>0?-pressure*.55:.2*Math.min(p.body.energy,p.body.water)));
    b.voiceBlocked=pressure>.15;
    if(b.reserve<.18)b.conscious=false;else if(b.reserve>.45)b.conscious=true;
    if(b.reserve<.07&&pressure>0)p.body.integrity=clamp(p.body.integrity-minutes*pressure*.7);
    if(before&&!b.conscious)recordEncounter(s,{actor:id,target:id,process:'collapse',text:`${namesFor(s)[id]} loses consciousness. What follows depends on whether the pressure ends and help reaches them.`});
    if(!before&&b.conscious)recordEncounter(s,{actor:id,target:id,process:'recovery',text:`${namesFor(s)[id]} regains consciousness. Their earlier encounter has not been erased.`});
  }
}
export function reportEncounters(s){
  s.reportDeliveries||=[];
  for(const id of nonPlayerIds(s)){if(!canSpeak(person(s,id)))continue;const rec=[...(s.encounters?.[id]||[])].reverse().find(e=>e.mode==='direct'&&e.harmful);if(!rec)continue;
    for(const to of inhabitantIds(s)){if(to===id||to===rec.actor||!hears(s,id,to))continue;const key=`${rec.root}|${id}|${to}`;if(s.reportDeliveries.includes(key))continue;
      const text=`I saw ${namesFor(s)[rec.actor]} make forceful contact with ${namesFor(s)[rec.target]}. ${rec.target===id?'I was the person they attacked.':'I was present.'}`;
      emit(s,id,to,text,{...rec,text,title:`${namesFor(s)[id]}’s account of an encounter`});s.reportDeliveries.push(key);
      (s.encounters||={})[to]||=[];if(!(s.encounters[to]).some(e=>e.root===rec.root))s.encounters[to].push({...rec,text,mode:'reported',source:id});
    }
  }
}
export function completePhysicalTask(s,id,t){
  if(!['contact','defend','aid','flee','damage','erase','ignite'].includes(t.kind))return false;
  const p=person(s,id);
  if(t.kind==='contact'){if(!t.incident)entry(s,[id],'consequence','The attempt did not establish the required bodily contact. Distance, movement, resistance or your condition prevented it.');return true;}
  if(t.kind==='defend'){entry(s,[id],'consequence','You devote this interval to guarding yourself. It can add resistance to contact; it cannot decide another person’s choice.');return true;}
  if(t.kind==='aid'){recordEncounter(s,{actor:id,target:t.target,process:'aid',targetAware:reachable(s,id,t.target)||visible(s,t.target,id),text:reachable(s,id,t.target)?`${namesFor(s)[id]} reaches ${namesFor(s)[t.target]} and attempts to interrupt harmful contact and offer support.`:`${namesFor(s)[id]} tries to reach ${namesFor(s)[t.target]}, but the attempted help has not reached them.`});return true;}
  if(t.kind==='flee'){entry(s,[id],'consequence','You try to put distance between yourself and the remembered danger. You reach only the position your body and the surroundings allow.');return true;}
  if(t.kind==='ignite'){entry(s,[id],'consequence','You attempt to start a fire, but there is no encountered heat or ignition source in reach. Intent alone supplies no heat.');return true;}
  if(t.kind==='damage'||t.kind==='erase'){
    const f=person(s,t.target);if(!reachable(s,id,t.target)||(p.capacities.manipulation||0)<.3){entry(s,[id],'consequence','You cannot establish the material contact needed for that attempt.');return true;}
    const resistance=(f.material.rigidity||0)+(f.material.hardness||0),capacity=strength(p)*(t.duration/MINUTE);
    if((t.kind==='erase'&&f.material.surfaceInkAffinity>.3&&capacity>resistance*.2)||(t.kind==='damage'&&capacity>resistance*.2)){f.material.patternDestroyed=true;f.material.integrity=clamp(f.material.integrity-Math.min(.5,capacity));recordEncounter(s,{actor:id,target:t.target,process:'material_change',text:s.environment?.devices[t.target]||s.environment?.infrastructure.router===t.target?`${namesFor(s)[id]} damages ${namesFor(s)[t.target]}. Its remaining material condition constrains whether it can work.`:`${namesFor(s)[id]} works against the surface of ${namesFor(s)[t.target]}. The inscription is no longer readable; earlier acquired records can survive elsewhere.`});}
    else entry(s,[id],'consequence','The material resists your attempt. It remains present, and the attempt does not supply a stronger implement.');return true;
  }
  return true;
}
