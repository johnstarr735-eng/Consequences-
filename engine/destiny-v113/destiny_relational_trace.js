// DESTINY v1.06 — RELATIONAL TRACE / CONSEQUENCE
//
// Canonical law:
// Relation is not an empty edge between pre-existing Forms. Resolved Moments leave trace in the
// relation itself. That trace may later alter conductance, tension, generated joint capacity and the
// live horizon of the participants. No semantic relation-type (friend, enemy, love, institution, etc.)
// is stored here.
//
// Critical distinction:
// consequence is reality-specific. Acknowledgement may change what is present in Consciousness,
// and retained ordering may change Mental representation, without thereby becoming Physical
// consequence. The legacy scalar `consequenceLoad` remains the Physical channel only, so repeated
// mutual visibility cannot manufacture embodied/productive capacity.
//
// Temporal discipline:
// traces are written only after local Moments are resolved. They cannot rewrite the Moment that
// produced them; their causal effect begins in a later integration interval.

import {Person,clamp} from './destiny_unified_kernel.js';

const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const pair=(a,b)=>[a,b].sort().join('|');

function eventMagnitude(e){
  const keys=['impulse','magnitude','amount','strain','bodyDamage','damage','loss','torque','delta','load','ratio','relativeSpeed','reactionDemand'];
  let s=0,n=0;
  for(const k of keys){const v=Math.abs(Number(e?.[k]));if(Number.isFinite(v)){s+=v;n++;}}
  if(e?.vector&&Number.isFinite(e.vector.x)&&Number.isFinite(e.vector.y)){s+=Math.hypot(e.vector.x,e.vector.y);n++;}
  return n?clamp(1-Math.exp(-s)):.08;
}
function personIdsFromEvent(w,e){
  const raw=[e?.actor,e?.receiver,e?.form,e?.source,e?.target,e?.affected,e?.a,e?.b,e?.anchor,e?.mediator,...(e?.actors||[]),...(e?.near||[]),...(e?.members||[])];
  return [...new Set(raw.filter(id=>typeof id==='string'&&w.forms.get(id) instanceof Person))];
}
function signedEffectForPair(e,a,b){
  const out={[a]:0,[b]:0};
  const harm=Math.abs(Number(e?.bodyDamage??e?.damage??0))||0;
  if(harm>0){
    const affected=e?.affected??e?.target;
    if(affected===a)out[a]-=clamp(harm*5);
    if(affected===b)out[b]-=clamp(harm*5);
  }
  // Future-compatible directed support. Direction comes from actual transfer/intervention geometry,
  // never from a social label or authored moral judgement.
  if((e?.type==='bodily_intervention'||e?.type==='transfer')&&e?.from&&e?.to){
    const q=clamp(Math.abs(Number(e.amount??e.benefit??.05))*3);
    if(e.to===a&&e.from===b)out[a]+=q;
    if(e.to===b&&e.from===a)out[b]+=q;
  }
  return out;
}
function directPairsFromMoment(w,moment,events){
  const map=new Map();
  const ensure=(a,b)=>{const k=pair(a,b);if(!map.has(k))map.set(k,{a:[a,b].sort()[0],b:[a,b].sort()[1],types:new Set(),traceMagnitudes:[],consequenceMagnitudes:[],realityConsequenceMagnitudes:{consciousness:[],mental:[],physical:[]},directional:{[a]:0,[b]:0},sources:[]});return map.get(k);};

  // Acknowledgement is an actual change in the Consciousness representation of this relation.
  // If the encounter also changes retained ordering/known confidence, it has a Mental consequence.
  // Neither channel is promoted into Physical consequence merely because someone was seen.
  for(const x of moment?.activations||[]){
    const a=x.observer,b=x.target;if(!(w.forms.get(a) instanceof Person)||!(w.forms.get(b) instanceof Person)||a===b)continue;
    const row=ensure(a,b),m=clamp(.04+(x.access||0)*.18),mental=clamp(x.mentalDelta||0);
    row.types.add(x.kind||'perception');row.traceMagnitudes.push(m);row.realityConsequenceMagnitudes.consciousness.push(m);
    if(mental>0)row.realityConsequenceMagnitudes.mental.push(mental);
    row.sources.push({kind:'acknowledgement',type:x.kind||null,magnitude:m,reality:{consciousness:m,mental,physical:0}});
  }

  // Only actual events already bound to this resolved Moment add consequence-load. Reciprocal
  // encounter opening/closure is a mutual acknowledgement state, not by itself evidence that
  // causal change passed through the Person↔Person relation. This corrects the v1.07 shortcut.
  for(const e of events.filter(e=>e?.momentId===moment.id)){
    const ids=personIdsFromEvent(w,e);if(ids.length<2)continue;
    const reciprocal=String(e.type||'').startsWith('reciprocal_encounter_');
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
      const row=ensure(ids[i],ids[j]),m=eventMagnitude(e),sgn=signedEffectForPair(e,row.a,row.b);
      row.types.add(e.type||'event');row.traceMagnitudes.push(m);
      if(reciprocal){row.sources.push({kind:'acknowledgement',type:e.type||null,magnitude:m,reciprocal:true});continue;}
      row.consequenceMagnitudes.push(m);row.realityConsequenceMagnitudes.physical.push(m);
      row.directional[row.a]=(row.directional[row.a]||0)+(sgn[row.a]||0);row.directional[row.b]=(row.directional[row.b]||0)+(sgn[row.b]||0);
      row.sources.push({kind:'actuality',type:e.type||null,magnitude:m,reality:{consciousness:0,mental:0,physical:m}});
    }
  }
  return [...map.values()];
}

function recomputeTraceState(w,r){
  const now=w.elapsedDays??w.clock??0,rows=(r.residue||[]).filter(x=>x.kind==='moment_relation_trace');
  let trace=0,consequence=0;const reality={consciousness:0,mental:0,physical:0};
  const dir={[r.a]:{positive:0,negative:0,net:0},[r.b]:{positive:0,negative:0,net:0}};
  for(const x of rows){
    const age=Math.max(0,now-(x.elapsedDays??x.clock??now)),decay=Math.exp(-age/18);
    trace+=(x.trace||0)*decay;consequence+=(x.consequence||0)*decay;
    for(const k of ['consciousness','mental','physical'])reality[k]+=(x.realityConsequence?.[k]||0)*decay;
    for(const id of [r.a,r.b]){
      const v=(x.directional?.[id]||0)*decay;if(v>=0)dir[id].positive+=v;else dir[id].negative+=-v;
    }
  }
  r.traceLoad=clamp(1-Math.exp(-trace*.32));
  r.realityConsequenceLoad={
    consciousness:clamp(1-Math.exp(-reality.consciousness*.36)),
    mental:clamp(1-Math.exp(-reality.mental*.36)),
    physical:clamp(1-Math.exp(-reality.physical*.42))
  };
  // Compatibility + productive-relation safety: generic consequence remains embodied/Physical.
  r.consequenceLoad=r.realityConsequenceLoad.physical;
  for(const id of [r.a,r.b]){
    dir[id].positive=clamp(1-Math.exp(-dir[id].positive*.45));
    dir[id].negative=clamp(1-Math.exp(-dir[id].negative*.45));
    dir[id].net=clamp(dir[id].positive-dir[id].negative,-1,1);
  }
  r.directionalConsequence=dir;
  return {traceLoad:r.traceLoad,consequenceLoad:r.consequenceLoad,realityConsequenceLoad:{...r.realityConsequenceLoad},directional:dir};
}

export function recordMomentRelationalTrace(w,r,{moment,types=[],trace=0,consequence=0,realityConsequence={},directional={},sources=[]}={}){
  if(!r||!moment)return null;
  const sig=[...new Set(types)].sort();
  const item={kind:'moment_relation_trace',clock:w.clock,elapsedDays:w.elapsedDays,momentId:moment.id,geometry:sig.join('|')||'encounter',types:sig,
    trace:clamp(trace),consequence:clamp(consequence),realityConsequence:{consciousness:clamp(realityConsequence.consciousness||0),mental:clamp(realityConsequence.mental||0),physical:clamp(realityConsequence.physical??consequence)},
    directional:{[r.a]:clamp(directional?.[r.a]||0,-1,1),[r.b]:clamp(directional?.[r.b]||0,-1,1)},sources,
    acknowledgementOnly:sources.length>0&&sources.every(s=>s.kind==='acknowledgement'),actualityBound:sources.some(s=>s.kind==='actuality'),
    representationConsequential:(realityConsequence.consciousness||0)>0||(realityConsequence.mental||0)>0};
  r.present.push(item);r.residue.push(item);r.history.push(item);r.lastJointClock=w.clock;
  if(r.present.length>18)r.present.shift();if(r.residue.length>180)r.residue.shift();if(r.history.length>720)r.history.shift();
  const st=recomputeTraceState(w,r);
  return {...item,...st};
}

export function commitRelationalMomentTraces(w,moments=[],events=[]){
  const out=[];
  for(const moment of moments||[]){
    for(const row of directPairsFromMoment(w,moment,events)){
      const r=w.rel(row.a,row.b),trace=clamp(avg(row.traceMagnitudes)),consequence=row.consequenceMagnitudes.length?clamp(avg(row.consequenceMagnitudes)):0;
      const realityConsequence={
        consciousness:row.realityConsequenceMagnitudes.consciousness.length?clamp(avg(row.realityConsequenceMagnitudes.consciousness)):0,
        mental:row.realityConsequenceMagnitudes.mental.length?clamp(avg(row.realityConsequenceMagnitudes.mental)):0,
        physical:row.realityConsequenceMagnitudes.physical.length?clamp(avg(row.realityConsequenceMagnitudes.physical)):0
      };
      out.push(recordMomentRelationalTrace(w,r,{moment,types:[...row.types],trace,consequence,realityConsequence,directional:row.directional,sources:row.sources}));
    }
  }
  w._lastRelationalTraces=out;
  return out;
}

export function refreshRelationalTraceStates(w){for(const r of w.relations?.values?.()||[])recomputeTraceState(w,r);}

export function relationalTraceAudit(w){
  const rs=[...(w.relations?.values?.()||[])],traces=rs.flatMap(r=>(r.residue||[]).filter(x=>x.kind==='moment_relation_trace'));
  const actuality=traces.filter(x=>x.actualityBound),ack=traces.filter(x=>x.acknowledgementOnly);
  const maxReality=k=>Math.max(0,...rs.map(r=>r.realityConsequenceLoad?.[k]||0)),meanReality=k=>avg(rs.map(r=>r.realityConsequenceLoad?.[k]||0));
  return {relations:rs.length,traceEpisodes:traces.length,actualityEpisodes:actuality.length,acknowledgementOnlyEpisodes:ack.length,
    representationConsequentialEpisodes:traces.filter(x=>x.representationConsequential).length,
    relationsWithTrace:rs.filter(r=>(r.residue||[]).some(x=>x.kind==='moment_relation_trace')).length,
    maxTraceLoad:Math.max(0,...rs.map(r=>r.traceLoad||0)),meanTraceLoad:avg(rs.map(r=>r.traceLoad||0)),
    maxConsequenceLoad:Math.max(0,...rs.map(r=>r.consequenceLoad||0)),meanConsequenceLoad:avg(rs.map(r=>r.consequenceLoad||0)),
    realityConsequence:{consciousness:{max:maxReality('consciousness'),mean:meanReality('consciousness')},mental:{max:maxReality('mental'),mean:meanReality('mental')},physical:{max:maxReality('physical'),mean:meanReality('physical')}},
    acknowledgementDoesNotMintConsequence:ack.every(x=>(x.consequence||0)===0&&(x.realityConsequence?.physical||0)===0),
    acknowledgementCanChangeRepresentation:ack.some(x=>(x.realityConsequence?.consciousness||0)>0||(x.realityConsequence?.mental||0)>0),
    semanticKindsAbsent:traces.every(x=>!['friend','enemy','love','institution','family','leader'].includes(x.geometry)),
    momentBound:traces.every(x=>!!x.momentId)};
}
