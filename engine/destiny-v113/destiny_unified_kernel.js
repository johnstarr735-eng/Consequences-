// DESTINY v1.04.1 — HOLOGRAPHIC RECONCILIATION / RELATIONAL POTENCY
//
// One Reality. One Form grammar. One history.
//
// Canonical holographic law:
//   Ground / Order / Process is the recursive structural grammar.
// Consciousness / Mental / Physical are interconnected contextual registers through which
// an experiencing coherence may carry possibility, ordering/rendering and actuality. They are
// NOT intrinsic compartments owned by every Form. Cosmic / Social / Existential remain Field
// domains, not holographic branches.
//
// v1.04.1 removes the last known causal use of the deprecated intrinsic C/M/P Form projection
// from relational potency/activation, relation tension, productive relation and ordinary action
// support. The 3x3 `intrinsicHologram()` survives only as a legacy diagnostic for historical
// regressions and post-Collapse audits that have not yet been migrated.
//
// Relation does not transfer semantic traits. Encounter changes the availability of concrete
// becoming by coupling a finite Form's Ground / Order / Process potency to actual conductance,
// proximity, environment and retained relational history. The attribute that becomes real is
// whatever the Moment eventually actualises; there is no hidden nine-trait inventory.
//
// No LOVE, FEAR, POWER, PRESTIGE, ROLE, LEADER, FRIEND, ENEMY, INSTITUTION classes/stats.

export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const gm=xs=>Math.pow(xs.reduce((p,x)=>p*Math.max(.0001,x),1),1/(xs.length||1));
const md=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const keyPair=(a,b)=>[a,b].sort().join("|");
const argmax=o=>Object.entries(o).sort((a,b)=>b[1]-a[1])[0]||[null,0];

export const LAYERS=["C","M","P"];
export const LAYER_NAMES={C:"consciousness",M:"mind",P:"physical"};
export const FIELDS=["cosmic","social","existential"];
export const BRANCHES=["ground","order","process"];

export class Form{
 constructor(id,o={}){
  this.id=id;this.kind=o.kind||"matter";this.pos=o.pos||{x:0,y:0};this.alive=o.alive??true;
  // v0.97 — physical orientation is configuration state, not identity or purpose.
  this.orientation=Number.isFinite(o.orientation)?o.orientation:0;this.angularVelocity=Number.isFinite(o.angularVelocity)?o.angularVelocity:0;
  // v0.89 Material Recursion: material stores physical composition/behaviour, not human purpose.
  // `food` is retained only as a backward-compatibility alias for older labs; new worlds use nutrient/organic.
  const legacyFood=o.food??0;
  this.material={stock:o.stock??1,water:o.water??0,food:legacyFood,warmth:o.warmth??0,force:o.force??0,
    mobility:o.mobility??0,visibility:o.visibility??.6,cover:o.cover??0,openness:o.openness??.5,
    organic:o.organic??(legacyFood?1:0),nutrient:o.nutrient??legacyFood,fiber:o.fiber??0,mineral:o.mineral??0,
    moisture:o.moisture??(o.water??0),combustible:o.combustible??0,rigidity:o.rigidity??0,hardness:o.hardness??0,
    permeability:o.permeability??.5,thermal:o.thermal??0,capacity:o.capacity??0,
    // v0.93 — structural state belongs to finite material Form, not to a purpose-class.
    // Integrity is retained coherence under material strain; elasticity is recoverable deformation.
    integrity:o.integrity??1,elasticity:o.elasticity??clamp((o.fiber??0)*.55+(1-(o.rigidity??0))*.25,0,.9)};
  this.associations=[]; // ordinary Material Form can acquire public/historical associations
  // v1.04.1 — no semantic trait inventory. Canonical relation activation stores only structural
  // Ground / Order / Process potency. C/M/P projection is diagnostic/compatibility only.
  this.activationHistory=[];this.activeAttributeProfile=null;this.othernessHistory=[];
  this.history=[];this.mismatchDebt=0;
  this.waveResidue=[];this.wavePresent=null;this.waveCharge=0;
 }
}
export class Person extends Form{
 constructor(id,o={}){
  super(id,{...o,kind:"person",force:o.force??.5,mobility:o.mobility??.6,visibility:o.visibility??.7,organic:o.organic??1,nutrient:o.nutrient??.62,fiber:o.bodyFiber??.08,moisture:o.moisture??.62});
  this.body={water:o.bodyWater??.72,energy:o.energy??.72,warmth:o.bodyWarmth??.72,integrity:1};
  // Bodily material aperture: capacities through which material can sustain or burden this Form.
  // These are not preferences or actions.
  this.metabolism={nutrient:o.metabolicNutrient??.72,fiber:o.metabolicFiber??.18,organic:o.metabolicOrganic??.62,toxicityTolerance:o.toxicityTolerance??.18};
  this.capacities={manipulation:o.manipulation??.62,forceTransmission:o.forceTransmission??.55};
  this.apparatus={receptor:o.receptor??.55,attention:o.attention??.55,retention:o.retention??.55};
  this.traces=[];this.renderings=[];this.expectations=[];this.gazeModels=[];
  this.identityResidue=[];this.socialResidue=[];this.known=new Map();this.memberships=[];
  this.waveSalience=new Map();
  // Epistemic architecture: retained traces of Experience, Knowledge models, tested Understanding.
  // These are histories/relations, not personality stats.
  this.experienceTraces=[];
  this.epistemicModels=new Map();
  this.epistemicBeliefs=new Map(); // legacy source-model confidence; not identical with existential Belief.
  this.recognitionHistory=[];
  // v0.70 narrative-epistemic histories. These are retained relations, not BELIEF/KNOWLEDGE personality stats.
  this.questionHistory=[];
  this.beliefCommitments=[];
  this.beliefRevisions=[];
  this.beliefEnactments=[];
  this.habitResidue=new Map();
  // v0.74 — recursive Process is retained as moving trajectories, not a scalar CHAOS stat.
  this.activeProcesses=new Map();
  this.processHistory=[];
  this.competitionHistory=[];
  this.pendingCompetitions=[];
  this.collisionHistory=[];
  this.costHistory=[];
  this.preservationHistory=[];this.closedCostProcesses=new Set();this.lastProcessActualized=new Map();this.lastCostByProcess=new Map();
  // v0.99 — Will is a temporary future-facing projection of a live possibility, not a trait/stat.
  this.willProjection=null;this.willHistory=[];
  // v1.00 — Imagination is retained/synthetic configuration in Mind, never a Physical Form or stat.
  this.configurationMemory=[];this.counterfactualProjection=null;this.counterfactualHistory=[];
  this.praxisEpisode=null;this.praxisHistory=[];this.praxisMemory=[];
  // v1.02 — practical repetition leaves conductance traces, not a semantic skill stat.
  this.practicalTraces=[];this.practicalHistory=[];
 }
 viability(){return gm(Object.values(this.body))}
}
export class Whole extends Form{
 constructor(id,members,o={}){
  super(id,{...o,kind:"whole"});this.members=[...members];this.slots=[];this.assignments=new Map();
  this.functionMemory=[];this.boundary=.1;this.persist=0;this.prestigeLedger={};
 }
}
export class RelationForm extends Form{
 constructor(a,b){
  super(`R:${keyPair(a,b)}`,{kind:"relation",stock:.08,visibility:.12,openness:.5});
  this.a=a;this.b=b;this.encounters=0;this.coPresence=0;this.transfers=0;this.witness=0;
  this.renderings=[];this.benefit=0;this.harm=0;
  // v1.06 canonical relational history: consequence is Moment-derived and non-semantic.
  this.traceLoad=0;this.consequenceLoad=0;this.directionalConsequence={};
  // A relation has its own retained Present. It is not either participant's mind.
  this.present=[];this.residue=[];this.conductance=0;this.autonomy=0;this.mismatchDebt=0;
  // Relation-specific susceptibility: retained Ground / Order / Process activation from prior encounter.
  // This is history, not compatibility, semantic chemistry, or intrinsic C/M/P anatomy.
  this.activationResidue={};
  // v0.81 — Tension is retained unresolved relational displacement, directional by participant.
  // It is not Force, Chaos, desire, harm, or a semantic emotion.
  this.directionalTension={};this.tensionHistory=[];this.tensionLoad=0;
  this.lastJointClock=-1;this.absence=0;this.reactivation=0;
  // v0.82 — productive relation: retained capacities that exist only in the relational configuration.
  // These are low-level affordances, not "couple/family/team" labels and not sums of participant traits.
  this.generatedCapacity={};this.generationHistory=[];this.causalSurplus=0;
  // v1.08 — productive generation is a physical-time state, not one event per solver frame.
  this.productiveOpen=false;this.lastGenerationRecordElapsed=-Infinity;
  // v0.84 temporal consolidation: prior-Moment relational state is the only state allowed
  // to bias current activation/generation. Reality gets the next move.
  this.priorDirectionalTension={};this.priorGeneratedCapacity={};this.priorConductance=0;this.priorAutonomy=0;
 }
}
export class Trace{
 constructor(o){Object.assign(this,o)}
 conductance(now,retention,cue=1){
  const age=Math.max(0,now-this.clock),decay=Math.exp(-age/(45+135*retention));
  return clamp(this.strength*decay*(.18+.82*cue));
 }
}
export class World{
 constructor(w=14,h=14){this.w=w;this.h=h;this.clock=0;this.forms=new Map();this.relations=new Map();this.wholes=new Map();this.actualHistory=[];this.events=[];this.deaths=[]}
 add(f){this.forms.set(f.id,f);if(f instanceof Whole)this.wholes.set(f.id,f);return f}
 people(){return [...this.forms.values()].filter(f=>f instanceof Person&&f.alive)}
 rel(a,b){const k=keyPair(a,b);if(!this.relations.has(k)){const r=new RelationForm(a,b);this.relations.set(k,r);this.forms.set(r.id,r)}return this.relations.get(k)}
 tick(actor=null){
  this.clock++;
  const ps=this.people();
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)if(md(ps[i].pos,ps[j].pos)<=2)this.rel(ps[i].id,ps[j].id).coPresence++;
  const dt=1/Math.max(1,ps.length); // one full metabolic unit per world-round, not per other person's action
  for(const p of ps){
   for(const [k,v] of p.waveSalience)p.waveSalience.set(k,v*.94);
   p.waveCharge*=.92;
   p.body.water=clamp(p.body.water-.00065*dt*(p.id===actor?.id?1.08:1));
   p.body.energy=clamp(p.body.energy-.00052*dt*(p.id===actor?.id?1.06:1));
   if(p.body.water<.035||p.body.energy<.035)p.body.integrity=clamp(p.body.integrity-.0011);
   if(p.viability()<.017){p.alive=false;this.deaths.push({clock:this.clock,id:p.id});this.actualHistory.push({clock:this.clock,type:"death",actor:p.id})}
  }
  for(const r of this.relations.values()){r.reactivation=clamp(r.reactivation*.93);r.waveCharge*=.92}
  for(const f of this.forms.values())if(!(f instanceof Person)&&!(f instanceof Whole)&&!(f instanceof RelationForm)&&
    (f.material.water||f.material.food||f.kind==="biomass"))
    f.material.stock=clamp(f.material.stock+(f.kind==="biomass"?.0014:.0065));
 }
}


function processKey(c){
 // Process != conduit. Several food locations are routes of one bodily demand;
 // several step-directions are routes of one exploratory process.
 if(c.kind==="relation")return `relation:${c.mode}:${c.target}`;
 if(c.kind==="resource")return `resource:${c.attribute}`;
 if(c.kind==="history")return `history:${c.target}`;
 if(c.kind==="move")return `move:explore`;
 return `${c.kind}:${c.attribute||c.mode||"local"}`;
}
function mutuallyConsequential(a,b){
 if(!a||!b||a.key===b.key)return false;
 // One finite actor cannot fully actualise two distinct main trajectories in one Moment.
 // Opposed routes toward/away from the same Other are maximally incompatible.
 if(a.kind==="relation"&&b.kind==="relation"&&a.target===b.target&&a.mode!==b.mode)return true;
 if(a.kind==="resource"&&b.kind==="resource"&&a.target!==b.target)return true;
 if(a.kind==="move"&&b.kind==="move")return true;
 return a.kind!==b.kind || a.target!==b.target || a.mode!==b.mode || a.attribute!==b.attribute;
}
export function recursiveProcessState(w,f){
 let trajectories=[];
 if(f instanceof Person){
   trajectories=[...f.activeProcesses.values()]
     .filter(x=>x.momentum>.025)
     .map(x=>({...x}));
 }else if(f instanceof RelationForm){
   const recent=[...(f.present||[]),...(f.residue||[])].slice(-24);
   const groups=new Map();
   for(const e of recent){
     const k=`${e.geometry||e.type||"relation"}`;
     const g=groups.get(k)||{key:k,kind:e.type||"relation",momentum:0,count:0,last:e.clock||w.clock};
     g.count++;g.momentum=clamp(g.momentum+.06);g.last=e.clock||w.clock;groups.set(k,g);
   }
   trajectories=[...groups.values()];
   if((f.tensionLoad||0)>.025)trajectories.push({key:`tension:${f.id}`,kind:"relational_tension_release",
     momentum:clamp(f.tensionLoad),last:w.clock});
 }else if(f instanceof Whole){
   trajectories=(f.slots||[]).map((x,i)=>({key:`slot:${x.capacity||i}`,kind:"whole_process",
     momentum:clamp(x.pressure??.08),last:w.clock}));
 }else{
   const groups=new Map();
   for(const e of (f.history||[]).slice(-20)){
     const k=`${e.geometry||e.type||"material"}`;
     const g=groups.get(k)||{key:k,kind:e.type||"material",momentum:0,count:0,last:e.clock||w.clock};
     g.count++;g.momentum=clamp(g.momentum+.055);g.last=e.clock||w.clock;groups.set(k,g);
   }
   trajectories=[...groups.values()];
 }
 const live=trajectories.filter(t=>t.momentum>.04);
 let pairs=0,weighted=0;
 for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
   if(mutuallyConsequential(live[i],live[j])){
     pairs++;weighted+=Math.min(live[i].momentum,live[j].momentum);
   }
 }
 let chaosIntensity=0,recentInterference=0;
 if(f instanceof Person){
   const recent=(f.collisionHistory||[]).filter(c=>w.clock-c.clock<180);
   recentInterference=recent.length;
   chaosIntensity=clamp(recent.reduce((a,c)=>a+(c.interference||0)*Math.exp(-(w.clock-c.clock)/90),0)/Math.max(1,recent.length));
 }
 return {
   trajectories,
   plurality:live.length,
   competitionPairs:pairs,
   competitionIntensity:clamp(weighted/Math.max(1,pairs)),
   chaosIntensity,
   recentInterference,
   unresolvedMomentum:clamp(live.reduce((a,t)=>a+t.momentum,0)/Math.max(1,live.length))
 };
}

// ---- LEGACY INTRINSIC HOLOGRAM DIAGNOSTICS / RECURSIVE TRIAD -------------

function layerTruths(w,f){
 // LEGACY v0.94 compatibility projection only.
 // V1.03 no longer treats Consciousness/Mental/Physical as scalar compartments owned by each Form.
 // Canonical basin state is contextual and interpenetrating (see destiny_basin_circuit.js).
 // This function remains because older relation/Power/Moira regressions still read the historical
 // projection while those subsystems are migrated. Ground/Order/Process below remains the stronger
 // source-backed recursive grammar.
 if(f instanceof Person){
  const C=clamp(gm([Math.max(.08,f.apparatus.receptor),Math.max(.08,f.apparatus.attention),Math.max(.08,f.material.openness),Math.max(.08,f.viability())]));
  const retained=clamp((Math.min(1,f.renderings.length/30)+Math.min(1,f.identityResidue.length/24)+Math.min(1,f.history.length/40))/3);
  const M=clamp(.08+retained*.72+Math.min(.18,f.apparatus.retention*.18));
  const P=clamp(f.viability());
  return {C,M,P};
 }
 if(f instanceof RelationForm){
  const historyDensity=clamp(f.history.slice(-30).length/30),presentDensity=clamp(f.present.length/12);
  return {C:clamp(.08+f.conductance*.65),M:clamp(.08+presentDensity*.48+f.autonomy*.28),P:clamp(.08+historyDensity*.50+f.material.stock*.22)};
 }
 if(f instanceof Whole){
  const live=f.members.map(id=>w.forms.get(id)).filter(x=>x instanceof Person&&x.alive);
  const differentiation=clamp(f.slots.length?f.assignments.size/f.slots.length:.05);
  return {C:clamp(.08+differentiation*.72),M:clamp(.08+clamp(f.persist/20)*.72),P:clamp(.08+avg(live.map(p=>p.viability()))*.72)};
 }
 const m=f.material||{};
 const possibility=clamp(.10+(m.permeability??.5)*.12+(m.elasticity??0)*.14+(1-(m.integrity??1))*.10+Math.min(.18,(f.history?.length||0)/60));
 const structuralIdentity=clamp(.10+(m.rigidity??0)*.12+(m.hardness??0)*.10+(m.mineral??0)*.08+(m.organic??0)*.08+Math.min(.20,(f.associations?.length||0)/20)+Math.min(.16,(f.history?.length||0)/45));
 const physical=clamp(.08+Math.min(.82,m.stock??0)*.62+(m.integrity??1)*.22);
 return {C:possibility,M:structuralIdentity,P:physical};
}


export function groundState(w,f){
 // "Ground" is engine shorthand for Anaximander's first tier: primary stuff/physis —
 // what the present Form is made/supported/carried by. It is not the Field and not a transcendental cause.
 if(f instanceof Person){
   const body=clamp(gm(Object.values(f.body)));
   const apparatus=clamp(gm(Object.values(f.apparatus)));
   const retained=clamp((Math.min(1,f.traces.length/24)+Math.min(1,f.experienceTraces.length/20)+
     Math.min(1,f.identityResidue.length/18))/3);
   const material=clamp(gm([f.material.force+.08,f.material.mobility+.08,f.material.openness+.08]));
   return {body,apparatus,retained,material,reading:clamp(gm([body,apparatus,Math.max(.08,retained),material]))};
 }
 if(f instanceof RelationForm){
   const carriers=[w.forms.get(f.a),w.forms.get(f.b)].filter(Boolean);
   const carrier=clamp(avg(carriers.map(x=>x instanceof Person?x.viability():x.material.stock)));
   const retained=clamp((Math.min(1,f.present.length/18)+Math.min(1,f.residue.length/24)+Math.min(1,f.history.length/30))/3);
   const material=clamp(.08+Math.min(1,f.coPresence/40)*.35+Math.min(1,f.transfers/12)*.30);
   return {carrier,retained,material,reading:clamp(gm([Math.max(.08,carrier),Math.max(.08,retained),Math.max(.08,material)]))};
 }
 if(f instanceof Whole){
   const live=f.members.map(id=>w.forms.get(id)).filter(x=>x instanceof Person&&x.alive);
   const carriers=clamp(avg(live.map(x=>x.viability())));
   const differentiated=clamp((f.slots.length+f.assignments.size)/Math.max(2,live.length*2));
   const retained=clamp(Math.min(1,f.functionMemory.length/25));
   return {carriers,differentiated,retained,reading:clamp(gm([Math.max(.08,carriers),Math.max(.08,differentiated),Math.max(.08,retained)]))};
 }
 const material=clamp(gm([f.material.stock+.05,f.material.mobility+.05,f.material.openness+.05,f.material.visibility+.05]));
 const retained=clamp((Math.min(1,f.history.length/25)+Math.min(1,f.associations.length/12))/2);
 return {material,retained,reading:clamp(gm([material,Math.max(.08,retained)]))};
}

export function orderState(w,f){
 // Order is arrangement/structure, not goodness, stability or low Chaos.
 if(f instanceof Person){
   const bodyBalance=clamp(1-(Math.max(...Object.values(f.body))-Math.min(...Object.values(f.body))));
   const habitPattern=clamp(Math.min(1,[...f.habitResidue.values()].filter(v=>v>.08).length/6));
   const modelPattern=clamp((Math.min(1,f.epistemicModels.size/8)+Math.min(1,f.renderings.length/30))/2);
   const identityPattern=clamp(Math.min(1,f.identityResidue.length/20));
   const beliefClosure=clamp(Math.min(1,f.beliefCommitments.length/6));
   return {bodyBalance,habitPattern,modelPattern,identityPattern,beliefClosure,
     reading:clamp(gm([Math.max(.08,bodyBalance),Math.max(.08,habitPattern),Math.max(.08,modelPattern),Math.max(.08,identityPattern)]))};
 }
 if(f instanceof RelationForm){
   const continuity=clamp(Math.min(1,f.coPresence/35));
   const retainedPattern=clamp((Math.min(1,f.witness/22)+Math.min(1,f.present.length/16)+Math.min(1,f.residue.length/24))/3);
   const boundary=clamp(.15+f.conductance*.45+f.autonomy*.4);
   const tension=clamp(f.tensionLoad||0);
   const structuralEase=clamp(1-tension*.55);
   return {continuity,retainedPattern,boundary,tension,structuralEase,
     reading:clamp(gm([Math.max(.08,continuity),Math.max(.08,retainedPattern),Math.max(.08,boundary),Math.max(.08,structuralEase)]))};
 }
 if(f instanceof Whole){
   const differentiation=clamp(f.slots.length?f.assignments.size/f.slots.length:.05);
   const boundary=clamp(f.boundary);
   const continuity=clamp(Math.min(1,f.persist/25));
   return {differentiation,boundary,continuity,reading:clamp(gm([Math.max(.08,differentiation),Math.max(.08,boundary),Math.max(.08,continuity)]))};
 }
 const arrangement=clamp(.12+Math.min(1,f.associations.length/10)*.45+Math.min(1,f.history.length/30)*.25);
 return {arrangement,reading:arrangement};
}

export function holographicTriadState(w,f){
 return {ground:groundState(w,f),order:orderState(w,f),process:recursiveProcessState(w,f)};
}

// DEPRECATED AS CANONICAL ONTOLOGY: compatibility/diagnostic projection only.
export function intrinsicHologram(w,f){
 const L=layerTruths(w,f),out={};
 const gs=groundState(w,f),os=orderState(w,f),ps=recursiveProcessState(w,f);
 const ground=gs.reading;
 const order=os.reading;
 const process=clamp(.06+ps.unresolvedMomentum*.44+Math.min(.28,ps.plurality*.045)+ps.chaosIntensity*.26+
   f.history.slice(-15).length/40+f.mismatchDebt*.06);
 for(const l of LAYERS){
  out[l]={
   ground:clamp(gm([L[l],ground])),
   order:clamp(gm([L[l],order])),
   // scalar is only the holographic reading; the actual Process remains the trajectory set in recursiveProcessState().
   process:clamp(gm([L[l],process]))
  };
 }
 return out;
}

// DEPRECATED AS CANONICAL ONTOLOGY: named view of the compatibility projection.
export function namedHologram(w,f){
 const h=intrinsicHologram(w,f);
 return {
  consciousness:{...h.C},
  mind:{...h.M},
  physical:{...h.P}
 };
}

export function hologramAggregate(h){
 if(!h)return 0;
 const raw=h.C?h:{C:h.consciousness,M:h.mind,P:h.physical};
 return gm(LAYERS.flatMap(l=>BRANCHES.map(b=>Math.max(.0001,raw?.[l]?.[b]??0))));
}


function emptyStructuralProfile(){return {ground:0,order:0,process:0}}
function structuralProfileMean(x){return avg(BRANCHES.map(b=>x?.[b]||0));}
function structuralProfileDistance(a,b){return avg(BRANCHES.map(br=>Math.abs((a?.[br]||0)-(b?.[br]||0))));}
function structuralProfileWeightedDifference(retained,current){
 const out=emptyStructuralProfile();let load=0;
 for(const b of BRANCHES){
   // Tension is retained structural activation that the present encounter no longer carries.
   // Fresh activation beyond history is not debt.
   const d=Math.max(0,(retained?.[b]||0)-(current?.[b]||0));out[b]=clamp(d);load+=d;
 }
 return {profile:out,mean:clamp(load/BRANCHES.length)};
}
function directedProcessToward(p,otherId){
 let total=0,deferred=0;
 for(const x of p.activeProcesses.values()){
   if(x.kind!=="relation"||x.target!==otherId)continue;
   total+=x.momentum||0;if(x.deferred)deferred+=x.momentum||0;
 }
 return {total:clamp(total),deferred:clamp(deferred)};
}
function relationConductanceBetween(w,a,b){
 if(!a||!b||a.id===b.id)return .05;
 const r=w.relations.get(keyPair(a.id,b.id));
 if(!r)return .04;
 return clamp(.06+r.conductance*.38+r.autonomy*.22+Math.min(.22,r.coPresence/45)+Math.min(.15,r.witness/35));
}
function structuralReading(w,f){
 const g=groundState(w,f).reading,o=orderState(w,f).reading,p=recursiveProcessState(w,f);
 // Ground / Order / Process is the genuine holographic recurrence. `process` here is only a
 // local readiness reading over the trajectory set, never a replacement for the trajectories themselves.
 return {ground:clamp(g),order:clamp(o),process:clamp(.05+p.unresolvedMomentum*.56+p.chaosIntensity*.20+Math.min(.19,p.plurality*.035))};
}
function environmentalPotencyGate(w,f){
 // The environment contributes material/relational conditions only; it does not tell the engine
 // what a Form is *for* and it does not manufacture C/M/P anatomy on the Form.
 const nearby=[...w.forms.values()].filter(x=>x.alive&&x.id!==f.id&&!(x instanceof Whole)&&md(f.pos,x.pos)<=3);
 const density=clamp(nearby.length/8);
 const materialSupport=clamp(avg(nearby.map(x=>clamp((x.material?.integrity??1)*.45+(x.material?.stock??0)*.30+(x.material?.openness??.5)*.25))));
 const localMotion=clamp(avg(nearby.map(x=>x.material?.mobility??0)));
 const relationSupport=f instanceof Person?clamp(avg([...w.relations.values()].filter(r=>r.a===f.id||r.b===f.id).map(r=>r.conductance))):0;
 return {
   ground:clamp(.14+(f.material?.openness??.5)*.24+materialSupport*.28+relationSupport*.18),
   order:clamp(.14+(1-density)*.22+orderState(w,f).reading*.22+relationSupport*.18),
   process:clamp(.12+(f.material?.mobility??0)*.30+localMotion*.18+density*.14+recursiveProcessState(w,f).unresolvedMomentum*.18)
 };
}
const activationBasisCache=new Map();
function activationBasis(w,f){
 const k=`${w.clock}:${f.id}`;
 if(activationBasisCache.has(k))return activationBasisCache.get(k);
 if(activationBasisCache.size>2500)activationBasisCache.clear();
 const structure=structuralReading(w,f),env=environmentalPotencyGate(w,f);
 const v={structure,env};activationBasisCache.set(k,v);return v;
}

export function structuralPotencyProfile(w,f){
 // Canonical v1.04.1 law: the engine does not store nine intrinsic latent "attributes".
 // It asks only whether this finite Form currently has support, configurability and transformability
 // from which a concrete relation/process may actualise an attribute in the resultant Moment.
 const s=activationBasis(w,f).structure,p=recursiveProcessState(w,f),out=emptyStructuralProfile();
 const transformability=clamp(.18+p.unresolvedMomentum*.48+p.chaosIntensity*.18+(1-s.order)*.16);
 out.ground=clamp(s.ground*(.48+.30*(1-s.order)+.22*transformability));
 out.order=clamp((.20+s.ground*.30+s.order*.24+transformability*.26)*(1-s.order*.22));
 out.process=clamp(.12+s.ground*.20+transformability*.55+(1-s.order)*.13);
 return out;
}

export function relationalPotencyActivation(w,f,other=null,opts={}){
 // Encounter can coax potency into availability; it does not transfer a trait from Other to Self.
 // Causal activation is Ground/Order/Process only. C/M/P remains a contextual register projection,
 // not intrinsic Form anatomy.
 const basis=activationBasis(w,f),latent=structuralPotencyProfile(w,f),env=basis.env;
 const otherStructure=other?activationBasis(w,other).structure:null;
 const conductance=other?relationConductanceBetween(w,f,other):.08;
 const distance=other?md(f.pos,other.pos):99;
 const proximity=other?1/(1+distance*.45):.05;
 const out=emptyStructuralProfile();
 let learned=null,tensionProfile=null;
 if(f instanceof Person && other instanceof Person){
   const rr=w.relations.get(keyPair(f.id,other.id));learned=rr?.activationResidue?.[f.id]||null;
   if(!opts.ignoreTension)tensionProfile=rr?.priorDirectionalTension?.[f.id]?.profile||null;
 }
 for(const b of BRANCHES){
   const complement=otherStructure?clamp(.18+Math.abs(otherStructure[b]-basis.structure[b])*.46+otherStructure[b]*.24):.08;
   const susceptibility=learned?.[b]||0,tension=tensionProfile?.[b]||0;
   // Stored history/tension can alter susceptibility only when a real conduit re-opens.
   const gate=clamp(env[b]*.34+complement*.29+conductance*.26+proximity*.14+susceptibility*.42+tension*.22);
   out[b]=clamp(latent[b]*gate);
 }
 return {latent,activated:out,conductance,proximity,meanActivation:structuralProfileMean(out)};
}

function contextualRegisterWeights(w,f){
 // Diagnostic/compatibility only. These readings locate a structural activation in the currently
 // available Consciousness / Mental / Physical registers without claiming the registers are Form anatomy.
 if(f instanceof Person){
   return {
     C:clamp(.12+f.apparatus.receptor*.31+f.apparatus.attention*.31+(f.material?.openness??.5)*.18),
     M:clamp(.12+f.apparatus.retention*.31+Math.min(1,f.renderings.length/35)*.18+Math.min(1,f.epistemicModels.size/9)*.18),
     P:clamp(.12+f.viability()*.38+(f.material?.integrity??1)*.20+(f.material?.mobility??0)*.14)
   };
 }
 if(f instanceof RelationForm)return {C:clamp(.12+f.conductance*.38+f.autonomy*.18),M:clamp(.12+Math.min(1,f.residue.length/45)*.42),P:clamp(.12+(f.material?.integrity??1)*.34+f.material.stock*.20)};
 if(f instanceof Whole)return {C:clamp(.12+f.boundary*.20+Math.min(1,f.persist/30)*.24),M:clamp(.12+Math.min(1,f.functionMemory.length/30)*.38),P:clamp(.12+(f.material?.integrity??1)*.42)};
 return {C:clamp(.10+(f.material?.openness??.5)*.30),M:clamp(.10+Math.min(1,f.history.length/35)*.32),P:clamp(.12+(f.material?.integrity??1)*.50)};
}
function projectStructuralToRegisters(w,f,profile){
 const weights=contextualRegisterWeights(w,f),out={};
 for(const l of LAYERS){out[l]={};for(const b of BRANCHES)out[l][b]=clamp(gm([Math.max(.0001,profile?.[b]||0),Math.max(.0001,weights[l]||0)]));}
 return out;
}

// Historical compatibility projection. This is intentionally NOT used by canonical action,
// relation-tension or productive-relation dynamics after v1.04.1.
export function latentAttributeProfile(w,f){return projectStructuralToRegisters(w,f,structuralPotencyProfile(w,f));}
export function relationalAttributeActivation(w,f,other=null,opts={}){
 const s=relationalPotencyActivation(w,f,other,opts);
 return {...s,latent:projectStructuralToRegisters(w,f,s.latent),activated:projectStructuralToRegisters(w,f,s.activated),structural:s};
}

export function activateEncounterAttributes(w,f,other=null,geometry="encounter"){
 const a=relationalPotencyActivation(w,f,other);
 const rec={clock:w.clock,other:other?.id||null,geometry,activated:a.activated,
   meanActivation:a.meanActivation,conductance:a.conductance,proximity:a.proximity,structural:true};
 f.activeAttributeProfile=a.activated;
 if(f instanceof Person && other instanceof Person){
   const rr=w.rel(f.id,other.id),prev=rr.activationResidue[f.id]||emptyStructuralProfile(),next=emptyStructuralProfile();
   for(const b of BRANCHES)next[b]=clamp((prev?.[b]||0)*.82+a.activated[b]*.28);
   rr.activationResidue[f.id]=next;
 }
 f.activationHistory.push(rec);if(f.activationHistory.length>180)f.activationHistory.shift();return rec;
}

export function attributeActivationEffect(w,p,targetId=null){
 const other=targetId?w.forms.get(targetId):null,a=relationalPotencyActivation(w,p,other).activated;
 return {groundSupport:a.ground,orderingSupport:a.order,processSupport:a.process};
}

export function directionalRelationTension(w,r,p,other){
 if(!(r instanceof RelationForm)||!(p instanceof Person)||!(other instanceof Person))return {profile:emptyStructuralProfile(),load:0};
 const retained=r.activationResidue?.[p.id]||emptyStructuralProfile();
 const current=relationalPotencyActivation(w,p,other,{ignoreTension:true}).activated;
 const gap=structuralProfileWeightedDifference(retained,current),proc=directedProcessToward(p,other.id);
 const distance=md(p.pos,other.pos),historicalContact=clamp(Math.min(1,r.coPresence/35)+Math.min(1,r.witness/24))*.5;
 const lastRelClock=Math.max(r.lastJointClock||-1,...(r.history||[]).slice(-30).map(x=>x.clock??-1));
 const age=lastRelClock<0?1e6:Math.max(0,w.clock-lastRelClock);
 const retention=Math.exp(-age/(150+260*r.conductance+180*historicalContact));
 const absencePull=clamp((distance/(distance+3))*Math.max(r.conductance,historicalContact*.25)*historicalContact*retention);
 const projected=clamp(proc.deferred*.62+proc.total*.18),profile=emptyStructuralProfile();
 for(const b of BRANCHES){
   const processBias=b==="process"?.34:.12,orderBias=b==="order"?.18:.08;
   profile[b]=clamp(gap.profile[b]*retention+projected*processBias+absencePull*orderBias);
 }
 const load=clamp(structuralProfileMean(profile));
 return {profile,load,retained,current,projected,absencePull,retention,distance,conductance:r.conductance};
}
export function relationTensionState(w,r){
 if(!(r instanceof RelationForm))return {load:0,directional:{}};
 const a=w.forms.get(r.a),b=w.forms.get(r.b),directional={};
 if(a instanceof Person&&b instanceof Person){directional[a.id]=directionalRelationTension(w,r,a,b);directional[b.id]=directionalRelationTension(w,r,b,a);}
 return {directional,load:clamp(avg(Object.values(directional).map(x=>x.load)))};
}

function subjectSocialPressure(w,p,subject){
 const rels=[...w.relations.values()].filter(r=>r.a===p.id||r.b===p.id);
 let base=clamp(avg(rels.map(r=>Math.min(1,r.witness/20))));
 if(subject instanceof RelationForm && (subject.a===p.id||subject.b===p.id))
   base=clamp(base*.55+(subject.witness/20)*.45);
 else if(subject instanceof Person && subject.id!==p.id){
   const r=w.relations.get(keyPair(p.id,subject.id));
   if(r)base=clamp(base*.55+Math.min(1,r.witness/20+r.material.visibility*.12)*.45);
 } else if(subject instanceof Whole && subject.members.includes(p.id))
   base=clamp(base*.60+Object.values(subject.prestigeLedger||{}).reduce((q,x)=>q+x,0)/12);
 return base;
}

export function receiverPressure(w,p,subject=null){
 if(!(p instanceof Person))return null;
 const cosmic=clamp(p.cosmicField?.pressure??((1-p.viability())*.25+p.material.openness*.2));
 const social=subjectSocialPressure(w,p,subject);
 const existential=clamp((1-p.body.integrity)*.45+(1-p.body.water)*.18+(1-p.body.energy)*.18+
   Math.min(.18,p.mismatchDebt*.04));
 return {cosmic,social,existential};
}

function contextualReceiver(w,f,receiver=null){
 if(receiver instanceof Person)return receiver;
 if(f instanceof Person)return f;
 if(f instanceof RelationForm){
   const ps=[w.forms.get(f.a),w.forms.get(f.b)].filter(x=>x instanceof Person&&x.alive);
   if(ps.length)return ps.sort((a,b)=>b.apparatus.attention-a.apparatus.attention)[0];
 }
 if(f instanceof Whole){
   const ps=f.members.map(id=>w.forms.get(id)).filter(x=>x instanceof Person&&x.alive);
   if(ps.length)return ps.sort((a,b)=>b.apparatus.attention-a.apparatus.attention)[0];
 }
 const ps=w.people().sort((a,b)=>md(a.pos,f.pos)-md(b.pos,f.pos));
 return ps[0]||null;
}

export function contextualProjection(w,f,receiver=null){
 const H=intrinsicHologram(w,f),r=contextualReceiver(w,f,receiver);
 const B=r?receiverPressure(w,r,f):{cosmic:.08,social:.05,existential:.05};
 const out={};
 for(const l of LAYERS)for(const fld of FIELDS){
   out[`${l}.${fld}`]={};
   for(const br of BRANCHES)out[`${l}.${fld}`][br]=clamp(gm([H[l][br],B[fld]]));
 }
 return out;
}

// Compatibility name: "cube" is now explicitly a contextual projection, never an intrinsic Form anatomy.
export function cube(w,f,receiver=null){return contextualProjection(w,f,receiver)}
export const cubeAggregate=c=>gm(Object.values(c).flatMap(x=>Object.values(x)));
// ---- MEMORY / RENDERING / SIMULATION / CORRECTION ------------------------

function cueStrength(w,p,t){
 if(t.target&&w.forms.get(t.target)?.alive&&md(p.pos,w.forms.get(t.target).pos)<=4)return 1;
 if(t.place===`${p.pos.x},${p.pos.y}`)return 1;
 return .1;
}
function retain(w,p,o){
 const t=new Trace({clock:w.clock,target:o.target||null,place:`${p.pos.x},${p.pos.y}`,kind:o.kind,
  attribute:o.attribute||null,strength:clamp(.12+.42*p.apparatus.attention+.28*Math.abs(o.valence||0)),
  valence:o.valence||0,geometry:o.geometry||o.kind,whole:o.whole||null});
 p.traces.push(t);if(p.traces.length>220)p.traces.shift();
 p.identityResidue.push({clock:w.clock,geometry:t.geometry,target:t.target,whole:t.whole});
 if(p.identityResidue.length>180)p.identityResidue.shift();
 return t;
}
function traceSummary(w,p,target){
 const out={positive:0,harm:0,holding:0,resource:0,n:0};
 for(const t of p.traces.filter(t=>t.target===target)){
  const c=t.conductance(w.clock,p.apparatus.retention,cueStrength(w,p,t));if(c<.01)continue;out.n++;
  if(t.valence>=0)out.positive+=c*Math.max(.04,t.valence);else out.harm+=c*Math.abs(t.valence);
  if(t.kind==="cofunction"||t.kind==="contact")out.holding+=c;if(t.kind==="resource")out.resource+=c;
 }
 for(const k of ["positive","harm","holding","resource"])out[k]=clamp(out[k]);return out;
}
function render(w,p,target,attribute,objective=.5){
 const previous=p.renderings.filter(r=>r.target===target.id&&r.attribute===attribute).slice(-10);
 const modelStrength=clamp(avg(previous.map(r=>r.confidence))||.05);
 const fresh=clamp(objective*p.apparatus.receptor*p.apparatus.attention);
 const contradiction=previous.length?Math.abs(avg(previous.map(r=>r.value))-objective):0;
 // Simulation: retained model can outrank contradictory fresh encounter.
 const simulationBias=clamp(modelStrength*(1-p.apparatus.receptor*.45));
 const value=clamp((objective*fresh + (previous.length?avg(previous.map(r=>r.value)):objective)*simulationBias)/(fresh+simulationBias+.001));
 const confidence=clamp(fresh*.65+modelStrength*.45);
 const r={clock:w.clock,target:target.id,attribute,value,confidence,fresh,modelStrength,contradiction};
 p.renderings.push(r);if(p.renderings.length>220)p.renderings.shift();
 if(contradiction>.22&&modelStrength>fresh){
  p.mismatchDebt=clamp(p.mismatchDebt+contradiction*.08,0,5);
 }else p.mismatchDebt=clamp(p.mismatchDebt-.015,0,5);
 return r;
}
function correctionPressure(f){
 // Furies as unpaid causal debt: mismatch narrows future coherence/conductance.
 return clamp(f.mismatchDebt/3);
}
function expectation(p,target,kind){
 let x=p.expectations.find(e=>e.target===target&&e.kind===kind);
 if(!x){x={target,kind,count:0,mean:0,confidence:0};p.expectations.push(x)}return x;
}
function updateExpectation(p,target,kind,outcome){
 const x=expectation(p,target,kind);x.count++;x.mean+=(outcome-x.mean)/x.count;x.confidence=clamp(x.count/8);
}
function gazeModel(p,target){
 let x=p.gazeModels.find(g=>g.target===target);
 if(!x){x={target,count:0,approach:.5,avoid:.5,harm:0,confidence:0};p.gazeModels.push(x)}return x;
}
function updateGaze(p,target,response,harm){
 const x=gazeModel(p,target);x.count++;x.approach+=(((response==="approach")?1:0)-x.approach)/x.count;
 x.avoid+=(((response==="avoid")?1:0)-x.avoid)/x.count;x.harm+=(harm-x.harm)/x.count;x.confidence=clamp(x.count/8);
}

// ---- PUBLIC MEMORY THROUGH ORDINARY MATERIAL FORMS ------------------------

export function inscribe(w,producer,referent,claim,coherence=.5){
 const mark=new Form(`mark:${w.clock}:${w.forms.size}`,{kind:"mark",pos:{...producer.pos},stock:.8,visibility:.8});
 mark.associations.push({clock:w.clock,producer:producer.id,referent,claim,coherence,source:"inscription"});
 mark.history.push({clock:w.clock,type:"inscribed"});
 w.add(mark);w.actualHistory.push({clock:w.clock,type:"inscription",actor:producer.id,mark:mark.id,referent,claim});
 return mark;
}
function encounterMark(w,p,mark){
 const a=mark.associations.at(-1);if(!a)return;
 const prestige=clamp(avg(mark.associations.map(x=>x.coherence)) + Math.min(.35,mark.history.length*.025));
 const confidence=clamp(mark.material.visibility*.25+p.apparatus.attention*.25+prestige*.45);
 p.renderings.push({clock:w.clock,target:mark.id,attribute:"claim",value:a.claim,confidence,referent:a.referent,prestige});
 mark.history.push({clock:w.clock,type:"read",reader:p.id});
 return {referent:a.referent,claim:a.claim,confidence,prestige};
}

// ---- SCOPE / DESIRE / FEAR ------------------------------------------------

function biologicalNeed(p,attr){return attr==="water"?1-p.body.water:attr==="food"?1-p.body.energy:0}

function softAvailability(x,scale=1){ return 1-Math.exp(-Math.max(0,x)/Math.max(.0001,scale)); }

function availabilityCandidateField(w,p,exclude=null){
 const raw=actionCandidates(w,p).filter(c=>{
   if(!exclude)return true;
   if(c.target===exclude)return false;
   if(c.kind==="resource"){
     const k=p.known.get(c.target);
     if(k?.source===exclude&&!k.direct)return false;
   }
   return true;
 });
 const groups=new Map();
 for(const c of raw){
   const k=c.key||processKey(c);
   const g=groups.get(k)||{key:k,kind:c.kind,count:0,best:0,total:0,target:c.target||null};
   g.count++;g.best=Math.max(g.best,c.baseScore??c.score??0);g.total+=c.baseScore??c.score??0;
   groups.set(k,g);
 }
 return [...groups.values()];
}

export function holographicAvailability(w,p,exclude=null){
 // Availability is not welfare, freedom, truth, or Love.
 // It is a structured reading of what Ground/Order/Process is presently available to this finite Self
 // across C/M/P. Raw values are retained because a relation may expand one dimension while contracting another.
 const candidates=availabilityCandidateField(w,p,exclude);
 const liveCandidates=candidates.filter(g=>g.best>.06);
 const processKinds=new Set(liveCandidates.map(g=>g.kind));
 const targetTraces=p.traces.filter(t=>!exclude||t.target!==exclude);
 const targetExperience=p.experienceTraces.filter(t=>!exclude||t.target!==exclude);
 const targetIdentity=p.identityResidue.filter(t=>!exclude||t.target!==exclude);
 const targetRenderings=p.renderings.filter(r=>!exclude||r.referent!==exclude);
 const known=[...p.known].filter(([id,k])=>!exclude || id!==exclude && !(k.source===exclude&&!k.direct));
 const rels=[...w.relations.values()].filter(r=>(r.a===p.id||r.b===p.id) &&
   (!exclude && true || (r.a!==exclude&&r.b!==exclude)));
 const otherRels=rels.map(r=>({r,other:r.a===p.id?r.b:r.a})).filter(x=>x.other!==exclude);
 const nearbyPeople=w.people().filter(q=>q.id!==p.id&&q.id!==exclude&&md(p.pos,q.pos)<=4);
 const nearbyForms=[...w.forms.values()].filter(f=>f.alive&&f.id!==p.id&&f.id!==exclude&&
   !(f instanceof RelationForm)&&!(f instanceof Whole)&&md(p.pos,f.pos)<=4);

 // C — possibility/aperture: what can presently enter, be arranged, or become.
 const cGroundRaw=(p.apparatus.receptor+p.apparatus.attention+(p.apparatus.retention??.55))*.7+
   known.reduce((a,[,k])=>a+(k.confidence||0),0)*.12+
   nearbyForms.length*.08+nearbyPeople.length*.12;
 const cOrderRaw=liveCandidates.length*.48+processKinds.size*.35+
   Math.max(0,liveCandidates.length-1)*.10;
 const cProcessRaw=liveCandidates.reduce((a,g)=>a+g.best,0)+
   [...p.activeProcesses.values()].filter(x=>x.momentum>.04&&(!exclude||x.target!==exclude))
     .reduce((a,x)=>a+x.momentum,0)*.65;

 // M — retained/rendered structures available to the Self.
 const mGroundRaw=targetTraces.length*.045+targetExperience.length*.055+
   targetRenderings.reduce((a,r)=>a+(r.confidence||0)*.04,0)+known.length*.035;
 const modelCount=[...p.epistemicModels.keys()].filter(k=>!exclude||!String(k).includes(exclude)).length;
 const habitCount=[...p.habitResidue.entries()].filter(([k,v])=>v>.08&&(!exclude||!String(k).includes(exclude))).length;
 const beliefCount=p.beliefCommitments.filter(b=>!exclude||!String(b.target||"").includes(exclude)).length;
 const mOrderRaw=modelCount*.22+habitCount*.28+beliefCount*.26+targetIdentity.length*.04+
   new Set(targetRenderings.map(r=>r.label||r.kind||r.geometry||"render")).size*.16;
 const activeMental=[...p.activeProcesses.values()].filter(x=>x.momentum>.04&&(!exclude||x.target!==exclude));
 const mProcessRaw=activeMental.length*.30+activeMental.reduce((a,x)=>a+x.momentum,0)*.55+
   targetRenderings.slice(-30).length*.018;

 // P — actual carrier, arrangements and moving processes in the material/social world.
 const bodyVals=Object.values(p.body);
 const bodyReserve=bodyVals.reduce((a,x)=>a+x,0)/Math.max(1,bodyVals.length);
 let resourceSupport=0;
 for(const [id,k] of known){
   const f=w.forms.get(id); if(!f?.alive)continue;
   resourceSupport+=(f.material.water*(1-p.body.water)+assimilationPotential(p,f)*(1-p.body.energy))*
     (k.confidence||0)/(1+md(p.pos,f.pos)*.25);
 }
 let relationalSupport=0;
 for(const {r,other} of otherRels){
   const m=traceSummary(w,p,other);
   relationalSupport+=(m.positive*.25+m.resource*.35+m.holding*.2)/(1+md(p.pos,w.forms.get(other)?.pos||p.pos)*.25);
 }
 const pGroundRaw=bodyReserve*1.15+resourceSupport*.45+relationalSupport*.55+
   (p.material.stock||0)*.35;
 const strongHabits=[...p.habitResidue.values()].filter(v=>v>.12).length;
 const pOrderRaw=otherRels.reduce((a,{r})=>a+r.conductance*.22+Math.min(1,r.witness/25)*.16,0)+
   strongHabits*.24+nearbyPeople.length*.08;
 const currentPS=recursiveProcessState(w,p);
 const filteredProcesses=currentPS.trajectories.filter(x=>!exclude||x.target!==exclude);
 const pProcessRaw=filteredProcesses.reduce((a,x)=>a+x.momentum,0)*.70+
   filteredProcesses.length*.24+p.material.mobility*.35+currentPS.chaosIntensity*.20;

 const raw={
   C:{ground:cGroundRaw,order:cOrderRaw,process:cProcessRaw},
   M:{ground:mGroundRaw,order:mOrderRaw,process:mProcessRaw},
   P:{ground:pGroundRaw,order:pOrderRaw,process:pProcessRaw}
 };
 const scale={
   C:{ground:2.5,order:2.2,process:2.0},
   M:{ground:2.4,order:2.1,process:2.0},
   P:{ground:2.2,order:2.0,process:1.8}
 };
 const normalized={};
 for(const l of ["C","M","P"]){
   normalized[l]={};
   for(const b of ["ground","order","process"])normalized[l][b]=softAvailability(raw[l][b],scale[l][b]);
 }
 return {raw,normalized};
}

export function availabilityTransformationByRelation(w,p,otherId){
 const withOther=holographicAvailability(w,p,null);
 const withoutOther=holographicAvailability(w,p,otherId);
 const delta={raw:{},normalized:{}};
 const historicalForeclosure={C:{ground:0,order:0,process:0},M:{ground:0,order:0,process:0},P:{ground:0,order:0,process:0}};
 const preserved=(p.preservationHistory||[]).filter(x=>x.kind==="relation"&&x.target===otherId);
 for(const x of preserved){
   const wgt=x.costWeight??x.costMomentum??0;
   // Diagnostic mapping only: a closed Process is not "bad", but it records which availability was consumed.
   if(x.costKind==="resource"){
     historicalForeclosure.P.ground-=wgt*.70;
     historicalForeclosure.P.process-=wgt*.25;
     historicalForeclosure.C.process-=wgt*.20;
   }else if(x.costKind==="relation"){
     historicalForeclosure.M.ground-=wgt*.25;
     historicalForeclosure.M.order-=wgt*.35;
     historicalForeclosure.M.process-=wgt*.25;
     historicalForeclosure.P.order-=wgt*.25;
     historicalForeclosure.C.process-=wgt*.20;
   }else if(x.costKind==="move"){
     historicalForeclosure.P.process-=wgt*.50;
     historicalForeclosure.C.process-=wgt*.30;
   }else{
     historicalForeclosure.M.process-=wgt*.20;
     historicalForeclosure.C.process-=wgt*.20;
   }
 }
 let positive=0,negative=0,redistribution=0;
 for(const l of ["C","M","P"]){
   delta.raw[l]={};delta.normalized[l]={};
   for(const b of ["ground","order","process"]){
     const direct=withOther.raw[l][b]-withoutOther.raw[l][b];
     const dr=direct+historicalForeclosure[l][b];
     const dn=withOther.normalized[l][b]-withoutOther.normalized[l][b];
     delta.raw[l][b]=dr;delta.normalized[l][b]=dn; // normalized remains present contribution only
     if(dr>1e-9)positive++; if(dr<-1e-9)negative++;
     redistribution+=Math.abs(dr);
   }
 }
 const branchDelta={ground:0,order:0,process:0},layerDelta={C:0,M:0,P:0};
 for(const l of ["C","M","P"])for(const b of ["ground","order","process"]){
   branchDelta[b]+=delta.raw[l][b]/3; layerDelta[l]+=delta.raw[l][b]/3;
 }
 return {withOther,withoutOther,historicalForeclosure,delta,positiveDimensions:positive,negativeDimensions:negative,
   redistribution,branchDelta,layerDelta,costlyPreservations:preserved.length};
}

export function actualScope(w,p,exclude=null){
 let s=0;
 for(const [id,k] of p.known){
  if(exclude&&k.source===exclude&&!k.direct)continue;
  const f=w.forms.get(id);if(!f?.alive)continue;
  s+=(f.material.water*(1-p.body.water)+assimilationPotential(p,f)*(1-p.body.energy))*k.confidence/(1+md(p.pos,f.pos)*.25);
 }
 for(const q of w.people())if(q.id!==p.id&&q.id!==exclude){
  const m=traceSummary(w,p,q.id);s+=(m.positive*.25+m.resource*.35+m.holding*.2)/(1+md(p.pos,q.pos)*.25);
 }
 return clamp(s/3);
}
export function renderedScope(w,p,exclude=null){
 let s=actualScope(w,p,exclude);
 for(const r of p.renderings.slice(-50))if(r.referent&&r.referent!==exclude)s+=r.confidence*(r.prestige||0)*.025;
 return clamp(s);
}
function fearOf(w,p,target){
 // v0.84: scalar Scope is diagnostic legacy only. Fear is anticipated contraction of specific
 // retained dependencies/routes, not loss of a universal "amount of possibility".
 const gm_=gazeModel(p,target),m=traceSummary(w,p,target);
 const proximity=clamp(1/(1+md(p.pos,w.forms.get(target)?.pos||p.pos)*.25));
 const materialDependency=clamp(m.resource*.48+m.holding*.30+m.positive*.16);
 const relationalDependency=clamp(m.positive*.34+m.harm*.10+proximity*.12);
 const credibility=clamp(gm_.avoid*gm_.confidence+gm_.harm*.5+m.harm*.4);
 const realLoss=clamp((materialDependency*.62+relationalDependency*.38)*credibility);
 const renderedLoss=clamp(realLoss+(gm_.confidence*(gm_.avoid+gm_.harm))*.12);
 return {real:realLoss,rendered:renderedLoss,credibility,actualLoss:realLoss,renderedLoss};
}
function desireFor(w,p,target){
 const m=traceSummary(w,p,target);return clamp(m.positive*.55+m.holding*.35+m.resource*.45);
}


// ---- LEGACY MOIRA / FINITE CARRYING CAPACITY AUDIT ------------------------
// v1.04: retained ONLY for historical regression compatibility. Canonical Field conditioning uses
// destiny_moira_dynamics.js, which does not depend on the deprecated intrinsic hologram anatomy.
// Moira remains non-scalar and non-agentic: the situated measure of load before deformation.
export function moiraAudit(w,f){
 const H=intrinsicHologram(w,f),proc=recursiveProcessState(w,f);
 const body=f instanceof Person?{
   energy:clamp(f.body.energy),water:clamp(f.body.water),
   attention:clamp(f.apparatus.attention),retention:clamp(f.apparatus.retention),
   receptor:clamp(f.apparatus.receptor)
 }:{energy:1,water:1,attention:1,retention:1,receptor:1};
 const material={
   stock:clamp(f.material?.stock||0),mobility:clamp(f.material?.mobility||0),
   visibility:clamp(f.material?.visibility||0)
 };
 const processLoad=clamp(proc.trajectories.reduce((a,t)=>a+(t.momentum||0),0)/Math.max(1,proc.trajectories.length));
 const plurality=clamp(proc.trajectories.length/8);
 const groundCapacity=clamp(avg(LAYERS.map(l=>H[l].ground)));
 const orderCapacity=clamp(avg(LAYERS.map(l=>H[l].order)));
 const processCapacity=clamp(avg(LAYERS.map(l=>H[l].process)));
 const biologicalCapacity=clamp(avg(Object.values(body)));
 const materialCapacity=clamp(avg([material.stock,material.mobility,.35+material.visibility*.65]));
 const carrying={
   ground:clamp(gm([Math.max(.001,groundCapacity),Math.max(.001,biologicalCapacity),Math.max(.001,materialCapacity)])),
   order:clamp(gm([Math.max(.001,orderCapacity),Math.max(.001,body.retention),Math.max(.001,body.attention)])),
   process:clamp(gm([Math.max(.001,processCapacity),Math.max(.001,body.energy),Math.max(.001,body.water)]))
 };
 const demand={
   process:clamp(processLoad*.68+plurality*.32),
   attention:clamp(plurality*.52+processLoad*.28+(f.tensionLoad||0)*.20),
   material:clamp(processLoad*(1-material.stock)*.55+plurality*(1-material.mobility)*.25)
 };
 const deformation={
   ground:clamp(Math.max(0,demand.material-carrying.ground)),
   order:clamp(Math.max(0,demand.attention-carrying.order)),
   process:clamp(Math.max(0,demand.process-carrying.process))
 };
 return {carrying,demand,deformation,body,material,processLoad,plurality,
   canCarryAll:Math.max(...Object.values(deformation))<.035};
}


// ---- UMWELT / OTHERNESS / RENDERING REVISION -----------------------------
function apertureVector(p){return {receptor:clamp(p.apparatus?.receptor??.2),attention:clamp(p.apparatus?.attention??.2),
 retention:clamp(p.apparatus?.retention??p.apparatus?.memory??.2),mobility:clamp(p.material?.mobility??0),
 visibility:clamp(p.material?.visibility??0)}}
export function umweltOverlap(w,a,b){
 const A=apertureVector(a),B=apertureVector(b),shared={},asymmetry={};
 for(const k of Object.keys(A)){shared[k]=Math.min(A[k],B[k]);asymmetry[k]=A[k]-B[k]}
 return {shared,asymmetry,diagnosticShared:avg(Object.values(shared)),
  diagnosticAsymmetry:avg(Object.values(asymmetry).map(Math.abs))};
}
function realityFingerprint(w,f){
 const structure=structuralReading(w,f),P=recursiveProcessState(w,f);
 return {structure,processMomentum:clamp(P.unresolvedMomentum||0),processPlurality:clamp((P.trajectories?.length||0)/8),
  material:{stock:clamp(f.material?.stock||0),mobility:clamp(f.material?.mobility||0),visibility:clamp(f.material?.visibility||0)}};
}
function renderingFingerprint(p,id){
 const rs=p.renderings.filter(r=>r.referent===id).slice(-16);
 return {confidence:rs.length?avg(rs.map(r=>r.confidence||0)):0,
  diversity:clamp(new Set(rs.map(r=>r.label||r.kind||r.geometry||"render")).size/6),count:rs.length};
}
export function othernessAudit(w,a,b){
 const overlap=umweltOverlap(w,a,b),reality=realityFingerprint(w,b),rendered=renderingFingerprint(a,b.id);
 const prev=(a.othernessHistory||[]).filter(x=>x.other===b.id).slice(-1)[0]||null;
 let realityChange=0,renderingChange=0;
 if(prev){const d=[];for(const br of BRANCHES)d.push(Math.abs((reality.structure?.[br]||0)-(prev.reality?.structure?.[br]||0)));
  d.push(Math.abs(reality.processMomentum-prev.reality.processMomentum),Math.abs(reality.processPlurality-prev.reality.processPlurality));
  realityChange=avg(d);
  renderingChange=avg([Math.abs(rendered.confidence-prev.rendered.confidence),Math.abs(rendered.diversity-prev.rendered.diversity),
   clamp(Math.abs(rendered.count-prev.rendered.count)/8)]);
 }
 const accessibleChange=clamp(realityChange*overlap.diagnosticShared);
 return {other:b.id,overlap,reality,rendered,realityChange,accessibleChange,renderingChange,
  revisionLag:Math.max(0,accessibleChange-renderingChange),
  overProjection:Math.max(0,rendered.confidence-overlap.diagnosticShared)};
}
export function recordOthernessMoment(w,a,b){
 const x=othernessAudit(w,a,b);a.othernessHistory.push({clock:w.clock,...x});
 if(a.othernessHistory.length>240)a.othernessHistory.shift();return x;
}

// ---- MATERIAL WORLD / AFFORDANCE / BODY / MORTALITY -----------------------
// One environment, unequal affordances. Resources are not values; terrain does not "mean" the same thing
// to every Form. Affordance is relation(Form, Environment, Moment).

export function terrainAffordance(w,f,cell=null){
 const c=cell||w.cell?.(f.pos?.x||0,f.pos?.y||0)||{};
 const receptor=clamp(f.apparatus?.receptor??.3),mobility=clamp(f.material?.mobility??.2);
 const energy=f.body?clamp(f.body.energy):1,water=f.body?clamp(f.body.water):1;
 const fertility=clamp(c.fertility??c.resource??c.food??.25);
 const wetness=clamp(c.water??c.wetness??.2),cover=clamp(c.cover??c.shelter??.15);
 const roughness=clamp(c.roughness??c.difficulty??.2),exposure=clamp(c.exposure??(1-cover));
 const protection=clamp(cover*(.5+.5*receptor));
 return {
   nourishment:clamp(fertility*receptor*(.45+.55*energy)),
   waterAccess:clamp(wetness*receptor*(.4+.6*mobility)),
   protection,
   shelter:protection, // compatibility alias only; ontology is physical protection, not a Shelter primitive.
   passage:clamp(mobility*(1-roughness*.72)),
   hazard:clamp(exposure*(1-energy)*.45+roughness*(1-mobility)*.45+(1-water)*wetness*.10)
 };
}
export function materialProfile(f){
 const m=f?.material||{};
 return {stock:clamp(m.stock??0),organic:clamp(m.organic??(m.food?1:0)),nutrient:clamp(m.nutrient??m.food??0),
   fiber:clamp(m.fiber??0),mineral:clamp(m.mineral??0),moisture:clamp(m.moisture??m.water??0),
   combustible:clamp(m.combustible??0),rigidity:clamp(m.rigidity??0),hardness:clamp(m.hardness??0),
   permeability:clamp(m.permeability??.5),thermal:clamp(m.thermal??0),cover:clamp(m.cover??0),capacity:clamp(m.capacity??0)};
}
export function assimilationPotential(receiver,source){
 if(!receiver?.body||!source?.material)return 0;
 const m=materialProfile(source),meta=receiver.metabolism||{nutrient:.65,fiber:.12,organic:.55,toxicityTolerance:.15};
 // Matter does not carry a FOOD truth. Assimilation is a relation between composition, bodily aperture,
 // and structural accessibility. `organic` marks material history/composition; it is not itself energy.
 const structuralAccess=clamp(1-m.rigidity*.55-m.hardness*.35+m.moisture*.15,.03,1);
 const biochemical=clamp(m.nutrient*(meta.nutrient??.65)+m.fiber*(meta.fiber??.12)*.08);
 return clamp(m.stock*biochemical*structuralAccess);
}
export function forceTransmissionPotential(actor,mediator=null){
 const base=clamp((actor?.material?.force??.25)*(actor?.capacities?.forceTransmission??.5));
 if(!mediator?.material)return base;
 const m=materialProfile(mediator);
 const conduct=clamp(m.rigidity*.42+m.hardness*.34+(1-m.permeability)*.16+m.stock*.08);
 return clamp(base*(1+conduct*.72));
}

export function materialComplementarity(w,a,b){
 const aa=terrainAffordance(w,a),bb=terrainAffordance(w,b),delta={};
 for(const k of Object.keys(aa))delta[k]=aa[k]-bb[k];
 const reciprocalPotential=avg(["nourishment","waterAccess","shelter","passage"].map(k=>Math.abs(delta[k])));
 return {a:aa,b:bb,delta,reciprocalPotential:clamp(reciprocalPotential)};
}
export function bodyStateAudit(w,p){
 if(!p.body)return null;
 const energy=clamp(p.body.energy),water=clamp(p.body.water);
 const hunger=clamp(1-energy),thirst=clamp(1-water);
 const exhaustion=clamp(hunger*.48+thirst*.42+(p.tensionLoad||0)*.10);
 const local=terrainAffordance(w,p);
 const exposure=clamp(local.hazard*.62+(1-(local.protection??local.shelter))* .18);
 return {energy,water,hunger,thirst,exhaustion,exposure,
   processConstraint:clamp(exhaustion*.58+exposure*.22),
   attentionConstraint:clamp(exhaustion*.42+thirst*.22)};
}
export function mortalityPressure(w,p){
 const b=bodyStateAudit(w,p); if(!b)return 0;
 // Mortality is finite embodiment, not punishment. Pressure rises from sustained bodily inability to carry.
 const ageLoad=clamp((p.age??0)/Math.max(1,p.maxAge??120));
 const injury=clamp(p.body.injury??p.body.damage??0);
 return clamp(b.exhaustion*.36+b.exposure*.20+injury*.26+ageLoad*.18);
}
export function successionTrace(w,p){
 // No inherited belief/identity. What can survive a Form is only material/relational/public residue already made real.
 const relations=[...w.relations.values()].filter(r=>r.a===p.id||r.b===p.id);
 return {
   material:clamp(p.material?.stock||0),
   relationResidue:clamp(avg(relations.map(r=>Math.min(1,(r.residue?.length||0)/60)))),
   generatedCapacity:clamp(avg(relations.flatMap(r=>Object.values(r.generatedCapacity||{}).map(x=>x.surplus||0)))),
   witness:clamp(avg(relations.map(r=>Math.min(1,(r.witness||0)/35))))
 };
}
// ---- ECOLOGY / SEEING / ACTION --------------------------------------------

function discover(w,p){
 for(const f of w.forms.values()){
  if(!f.alive||f.id===p.id||f instanceof RelationForm||f instanceof Whole)continue;
  if(md(p.pos,f.pos)>4)continue;
  if(f.kind==="mark"){encounterMark(w,p,f);continue}
  const assim=assimilationPotential(p,f);
  if(f.material.water||f.material.food||assim>.012){
   p.known.set(f.id,{confidence:1,direct:true,source:null});
   const attr=f.material.water?"water":(assim>.012?"assimilation":"food");
   render(w,p,f,attr,f.material.water?f.material.water*f.material.stock:Math.max(assim,(f.material.food||0)*f.material.stock));
  }
 }
 for(const q of w.people())if(q.id!==p.id&&md(p.pos,q.pos)<=4){
  const rr=w.rel(p.id,q.id);rr.encounters++;rr.witness++;
  const ap=activateEncounterAttributes(w,p,q,"co_presence");
  const aq=activateEncounterAttributes(w,q,p,"co_presence");
  // The retained RelationForm also changes through encounter; it does not merely count contact.
  activateEncounterAttributes(w,rr,p,"participant_activation");
  activateEncounterAttributes(w,rr,q,"participant_activation");
  render(w,p,q,"presence",clamp(q.viability()*.6+q.material.visibility*.4));
  recordOthernessMoment(w,p,q);
  // witness another at resource -> relational knowledge
  for(const f of w.forms.values())if((f.material.water||f.material.food||assimilationPotential(q,f)>.012)&&md(q.pos,f.pos)===0){
   p.known.set(f.id,{confidence:clamp((p.known.get(f.id)?.confidence||0)+.22*p.apparatus.attention),direct:false,source:q.id});
   retain(w,p,{target:q.id,kind:"resource",attribute:f.material.water?"water":"material",valence:.1,geometry:"witness_resource"});
   w.rel(p.id,q.id).benefit=clamp(w.rel(p.id,q.id).benefit+.025);
  }
  // If q has repeatedly and visibly travelled toward a resource while co-present with p,
  // p can retain a weak spatial route. This is observational learning, not transfer of q's Mental Form.
  const recent=q.history.slice(-12).filter(e=>e.target&&w.forms.get(e.target)?.kind==="resource");
  for(const e of recent.slice(-2)){
   const rf=w.forms.get(e.target);if(!rf)continue;
   const old=p.known.get(rf.id),conf=clamp((old?.confidence||0)+.06*p.apparatus.attention);
   p.known.set(rf.id,{confidence:conf,direct:old?.direct||false,source:q.id});
  }
 }
}
function visibleResponse(w,observer,actor,event){
 const m=traceSummary(w,observer,actor.id),recent=observer.socialResidue.slice(-16).filter(x=>x.target===actor.id&&x.geometry===event.geometry);
 const welcoming=recent.filter(x=>x.response==="approach").length/10;
 const encroach=event.geometry==="close_distance"&&md(observer.pos,actor.pos)<=1?recent.length/8:0;
 const attraction=clamp(m.positive*.4+welcoming+.08*observer.apparatus.attention);
 const threat=clamp(m.harm*.45+encroach*.7);
 const response=threat>attraction+.05?"avoid":"approach",harm=response==="avoid"?clamp(.1+threat):0;
 observer.socialResidue.push({clock:w.clock,target:actor.id,geometry:event.geometry,response});
 if(observer.socialResidue.length>180)observer.socialResidue.shift();
 return {response,harm};
}
function moveToward(p,t){const dx=Math.sign(t.pos.x-p.pos.x),dy=Math.sign(t.pos.y-p.pos.y);if(dx)p.pos.x+=dx;else if(dy)p.pos.y+=dy}
function moveAway(w,p,t){const dx=Math.sign(p.pos.x-t.pos.x),dy=Math.sign(p.pos.y-t.pos.y);if(dx&&p.pos.x+dx>=0&&p.pos.x+dx<w.w)p.pos.x+=dx;else if(dy&&p.pos.y+dy>=0&&p.pos.y+dy<w.h)p.pos.y+=dy}

export function actionCandidates(w,p){
 discover(w,p);const out=[],correction=correctionPressure(p);
 for(const [id,k] of p.known){
  const f=w.forms.get(id);if(!f?.alive)continue;const d=md(p.pos,f.pos);
  const ae=attributeActivationEffect(w,p,id);
  if(f.material.water)out.push({kind:"resource",target:id,attribute:"water",score:clamp((1-p.body.water)*f.material.stock*k.confidence/(1+d*.25)*
    (1+ae.processSupport*.08+ae.groundSupport*.05)-correction*.1)});
  const assim=assimilationPotential(p,f);
  if(f.material.food||assim>.012)out.push({kind:"resource",target:id,attribute:"assimilation",score:clamp((1-p.body.energy)*Math.max(assim,f.material.food*f.material.stock)*k.confidence/(1+d*.25)*
    (1+ae.processSupport*.08+ae.groundSupport*.05)-correction*.1)});
 }
 for(const q of w.people())if(q.id!==p.id){
  const d=md(p.pos,q.pos),desire=desireFor(w,p,q.id),fear=fearOf(w,p,q.id),g=gazeModel(p,q.id);
  const activation=attributeActivationEffect(w,p,q.id);
  // Biology does not erase relation, but acute material need reduces attention available to social routes.
  const socialAperture=clamp(.18 + Math.min(p.body.water,p.body.energy)*.82);
  const rf=w.rel(p.id,q.id);
  const wave=p.waveSalience.get(q.id)||0;
  const socialEvidence=desire + traceSummary(w,p,q.id).resource + traceSummary(w,p,q.id).holding + rf.autonomy*.22;
  const approachSignal=socialEvidence>.025 ? (desire+g.approach*g.confidence*.05+rf.autonomy*.08+wave*.055+
    activation.processSupport*.11+activation.orderingSupport*.03) : 
    // A fresh encounter may activate a previously latent relational Process without prior desire,
    // but only weakly and only where real proximity/conductance exists.
    (d<=3?activation.processSupport*.045:0);
  // Once co-located, "approach" has accomplished its physical work. Continued relation is carried by
  // co-presence, witnessing, rendering and response rather than manufacturing endless approach events.
  const distanceNeed=d>0?1:0;
  out.push({kind:"relation",mode:"approach",target:q.id,desire,fear,wave,score:clamp((approachSignal/(1+d*.2)-fear.rendered*.45-correction*.08)*socialAperture*distanceNeed)});
  out.push({kind:"relation",mode:"avoid",target:q.id,desire,fear,score:clamp((fear.rendered*.75+fear.real*.25-desire*.2)*socialAperture)});
 }
 // Social memory can bend action toward a referent never encountered.
 for(const r of p.renderings.slice(-40))if(r.referent&&r.prestige){
  out.push({kind:"history",target:r.referent,score:clamp(r.confidence*r.prestige*.22)});
 }
 // always permit exploratory motion; environment does not wait.
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const to={x:p.pos.x+dx,y:p.pos.y+dy};if(to.x>=0&&to.x<w.w&&to.y>=0&&to.y<w.h)out.push({kind:"move",to,score:.018});
 }
 for(const c of out){
  c.key=processKey(c);
  c.baseScore=c.score;
  const prior=p.activeProcesses.get(c.key);
  // retained Process can lean into the next Moment, but never substitutes for current Reality.
  c.processMomentum=prior?.momentum||0;
  c.score=clamp(c.baseScore+c.processMomentum*.11);
 }
 return out.sort((a,b)=>b.score-a.score);
}
function directInterferenceChannel(winner,alt){
 if(!winner||!alt)return false;
 if(winner.kind==="resource"&&alt.kind==="resource"&&winner.attribute===alt.attribute)return true;
 if(winner.kind==="relation"||winner.kind==="move"){
   // movement changes distance-dependent continuation of relational/resource/spatial routes.
   if(alt.kind==="relation"||alt.kind==="resource"||alt.kind==="move")return true;
 }
 if(winner.kind==="relation"&&alt.kind==="relation"&&winner.target===alt.target)return true;
 return false;
}
function processGroups(candidates){
 const groups=new Map();
 for(const c of candidates){
   const k=c.key;
   if(!groups.has(k))groups.set(k,{key:k,kind:c.kind,mode:c.mode||null,attribute:c.attribute||null,
     target:c.kind==="relation"||c.kind==="history"?c.target||null:null,variants:[],baseScore:0,score:0,processMomentum:0});
   const g=groups.get(k);g.variants.push(c);
   if((c.score||0)>g.score){
     g.baseScore=c.baseScore||0;g.score=c.score||0;g.processMomentum=c.processMomentum||0;
     g.routeTarget=c.target||null;g.to=c.to||null;
   }
 }
 return [...groups.values()];
}
function updateRecursiveProcesses(w,p,candidates,winner){
 const groups=processGroups(candidates);
 const winnerKey=winner?.key||null;
 const current=new Map(groups.map(g=>[g.key,g]));
 // A closed possibility can only be paid for once per closure episode.
 // If it becomes genuinely live again, it may later be foreclosed again as a new cost.
 const reopenTop=Math.max(.0001,...groups.map(g=>g.score||0));
 const reopenFloor=Math.max(.025,reopenTop*.45);
 for(const g of groups)if((g.score||0)>=reopenFloor)p.closedCostProcesses.delete(g.key);

 // Resolve previous Moment's process competitions.
 for(const pc of p.pendingCompetitions||[]){
   for(const alt of pc.alternatives){
     const now=current.get(alt.key);
     const channel=directInterferenceChannel(pc.winner,alt);
     const topNow=Math.max(.0001,...groups.map(g=>g.score||0));
     const presentFloor=Math.max(.025,topNow*.45);
     const stillLive=!!now && (now.score||0)>=presentFloor;
     const closedPresent=!stillLive;
     const change=now?Math.abs((now.baseScore||0)-(alt.baseScore||0)):Math.max(.10,alt.baseScore||0);
     const relative=change/Math.max(.05,alt.baseScore||.05);
     const routeGone=!now;
     if(channel && (routeGone || relative>.22)){
       const interference=clamp((routeGone?.52:.28)+Math.min(.42,relative*.32)+Math.min(.18,alt.momentum*.25));
       const col={id:`COL:${p.id}:${pc.clock}:${alt.key}`,clock:w.clock,originClock:pc.clock,person:p.id,
         winner:pc.winner.key,alternative:alt.key,interference,closedPresent,
         previousBase:alt.baseScore,currentBase:now?.baseScore??null,currentScore:now?.score??null,
         presentFloor,winnerKind:pc.winner.kind,alternativeKind:alt.kind,
         winnerRoute:pc.winner.routeTarget||null,alternativeRoute:alt.routeTarget||null};
       p.collisionHistory.push(col);p.processHistory.push(col);
       if(closedPresent && alt.wasLive && (!p.lastCostByProcess.has(alt.key) ||
          (p.lastProcessActualized.get(alt.key)||-1)>p.lastCostByProcess.get(alt.key))){
         p.lastCostByProcess.set(alt.key,w.clock);
         const cost={clock:w.clock,person:p.id,kind:"closed_live_trajectory",process:alt.key,
           originClock:pc.clock,originCollision:col.id,momentum:alt.momentum,
           sourceKind:alt.kind,target:alt.target||null,attribute:alt.attribute||null,mode:alt.mode||null,
           closure:"interference",previousBase:alt.baseScore,currentBase:now?.baseScore??null,presentFloor,
           preservedProcess:pc.winner.key,preservedKind:pc.winner.kind,preservedTarget:pc.winner.target||null};
         p.costHistory.push(cost);p.processHistory.push(cost);
         const preserve={clock:w.clock,person:p.id,process:pc.winner.key,kind:pc.winner.kind,
           target:pc.winner.target||null,costProcess:alt.key,costKind:alt.kind,costMomentum:alt.momentum,
           costWeight:Math.max(alt.momentum||0,alt.baseScore||0),closure:"interference",collision:col.id};
         p.preservationHistory.push(preserve);
       }
     }else if(closedPresent && alt.wasLive && (!p.lastCostByProcess.has(alt.key) ||
          (p.lastProcessActualized.get(alt.key)||-1)>p.lastCostByProcess.get(alt.key))){
       p.lastCostByProcess.set(alt.key,w.clock);
       const cost={clock:w.clock,person:p.id,kind:"closed_live_trajectory",process:alt.key,
         originClock:pc.clock,originCollision:null,momentum:alt.momentum,
         sourceKind:alt.kind,target:alt.target||null,attribute:alt.attribute||null,mode:alt.mode||null,
         closure:"temporal_or_external",previousBase:alt.baseScore,currentBase:now?.baseScore??null,presentFloor,
         preservedProcess:pc.winner.key,preservedKind:pc.winner.kind,preservedTarget:pc.winner.target||null};
       p.costHistory.push(cost);p.processHistory.push(cost);
       p.preservationHistory.push({clock:w.clock,person:p.id,process:pc.winner.key,kind:pc.winner.kind,
         target:pc.winner.target||null,costProcess:alt.key,costKind:alt.kind,costMomentum:alt.momentum,
         costWeight:Math.max(alt.momentum||0,alt.baseScore||0),closure:"temporal_or_external",collision:null});
     }
   }
 }
 p.pendingCompetitions=[];

 const topBase=Math.max(.0001,...groups.map(g=>g.baseScore||0));
 const freshFloor=Math.max(.025,topBase*.50);
 const freshLive=groups.filter(g=>(g.baseScore||0)>=freshFloor);
 const live=groups.filter(g=>(g.baseScore||0)>=freshFloor || (p.activeProcesses.get(g.key)?.momentum||0)>.08);
 const liveKeys=new Set(live.map(g=>g.key));

 for(const [k,old] of [...p.activeProcesses]){
   old.momentum*=.74;
   if(old.momentum<.018 && !liveKeys.has(k))p.activeProcesses.delete(k);
 }

 const winnerGroup=current.get(winnerKey);
 // Only processes freshly supported by this Present can create a new competition.
 // Momentum-only processes remain unresolved but cannot repeatedly manufacture fresh collisions.
 const competing=freshLive.filter(g=>winnerGroup&&g.key!==winnerGroup.key&&mutuallyConsequential(g,winnerGroup));
 if(winnerGroup&&competing.length){
   const comp={id:`COMP:${p.id}:${w.clock}`,clock:w.clock,person:p.id,
     winner:{key:winnerGroup.key,kind:winnerGroup.kind,target:winnerGroup.target||null,mode:winnerGroup.mode||null,
       attribute:winnerGroup.attribute||null,routeTarget:winnerGroup.routeTarget||null,
       baseScore:winnerGroup.baseScore,score:winnerGroup.score},
     alternatives:competing.map(g=>({key:g.key,kind:g.kind,target:g.target||null,mode:g.mode||null,
       attribute:g.attribute||null,routeTarget:g.routeTarget||null,baseScore:g.baseScore,score:g.score,
       momentum:g.processMomentum||0,wasLive:true})),
     intensity:clamp(competing.reduce((a,g)=>a+Math.min(winnerGroup.score,g.score),0)/Math.max(1,competing.length))};
   p.competitionHistory.push(comp);p.processHistory.push(comp);p.pendingCompetitions.push(comp);
 }

 for(const g of live){
   const prior=p.activeProcesses.get(g.key);
   const momentum=clamp((prior?.momentum||0)*.64+(g.baseScore||0)*.28+(g.key===winnerKey?.04:.015));
   const rec={key:g.key,kind:g.kind,target:g.target||null,routeTarget:g.routeTarget||null,
     mode:g.mode||null,attribute:g.attribute||null,variants:g.variants.length,
     momentum,lastSeen:w.clock,lastBase:g.baseScore||0,lastScore:g.score||0,
     actualized:g.key===winnerKey,deferred:g.key!==winnerKey,deferredAt:g.key!==winnerKey?w.clock:null};
   p.activeProcesses.set(g.key,rec);
 }
 if(winnerGroup){
   p.lastProcessActualized.set(winnerGroup.key,w.clock);
   p.processHistory.push({clock:w.clock,person:p.id,kind:"process_actualized",process:winnerGroup.key,
     route:winnerGroup.routeTarget||null,baseScore:winnerGroup.baseScore,score:winnerGroup.score});
 }
 return {live,competing};
}
export function stepPerson(w,p){
 if(!p.alive)return null;
 const cand=actionCandidates(w,p),c=cand[0];if(!c){w.tick(p);return null}
 updateRecursiveProcesses(w,p,cand,c);
 let e={clock:w.clock,actor:p.id},geometry="remain",valence=0;
 if(c.kind==="resource"){
  const f=w.forms.get(c.target);
  if(md(p.pos,f.pos)===0&&f.material.stock>.01){
   const potential=assimilationPotential(p,f);
   const q=Math.min(c.attribute==="water"?.25:.12,f.material.stock);f.material.stock=clamp(f.material.stock-q);
   if(c.attribute==="water")p.body.water=clamp(p.body.water+q);
   else p.body.energy=clamp(p.body.energy+q*(1.2+potential*2.4));
   geometry=c.attribute==="water"?"take_water":"material_assimilation";valence=.22;
   e={...e,type:c.attribute==="water"?"resource":"assimilation",target:f.id,attribute:c.attribute,amount:q,potential};
  }else{moveToward(p,f);geometry=`move_${c.attribute}`;e={...e,type:"motion",target:f.id,attribute:c.attribute}}
 }else if(c.kind==="relation"){
  const q=w.forms.get(c.target);
  if(c.mode==="approach"){moveToward(p,q);geometry="close_distance";valence=0}
  else{moveAway(w,p,q);geometry="increase_distance";valence=-.02}
  e={...e,type:"relation",mode:c.mode,target:q.id,fear:c.fear,desire:c.desire,waveSalience:c.wave||0};
 }else if(c.kind==="history"){
  geometry="historical_orientation";e={...e,type:"historical_orientation",referent:c.target};valence=.01;
 }else{p.pos=c.to;geometry="explore";e={...e,type:"motion",target:null}}
 const activationEvent=activateEncounterAttributes(w,p,e.target?w.forms.get(e.target):null,geometry);
 e.attributeActivation=activationEvent.activated;e.activationMean=activationEvent.meanActivation;
 e.geometry=geometry;p.history.push(e);w.actualHistory.push(e);w.events.push(e);
 retain(w,p,{target:e.target||e.referent||null,kind:e.type,attribute:e.attribute,valence,geometry});
 if(e.target&&w.forms.get(e.target) instanceof Person){
  const q=w.forms.get(e.target),rr=w.rel(p.id,q.id);rr.history.push(e);rr.benefit+=Math.max(0,valence);rr.harm+=Math.max(0,-valence);
 }
 for(const o of w.people())if(o.id!==p.id&&md(o.pos,p.pos)<=4){
  const resp=visibleResponse(w,o,p,e);
  if(e.target===o.id){updateGaze(p,o.id,resp.response,resp.harm);retain(w,p,{target:o.id,kind:"seen",valence:resp.response==="avoid"?-resp.harm:.06,geometry})}
 }
 w.tick(p);return e;
}


// ---- PRODUCTIVE RELATION / CAUSAL SURPLUS --------------------------------
//
// Source-led rule: relation can create a configuration with capacities not available to either pole alone.
// This is not ex nihilo. It requires differentiated contribution + retained relation + activation + conductance.
// Generated capacity belongs to the RelationForm while the configuration persists.

const REL_CAP_KEYS=["resource_access","orientation","cohesion","witnessing","mobility","retention"];
function personBaseCapacity(w,p,k){
 const known=[...p.known.values()];
 const rels=[...w.relations.values()].filter(r=>r.a===p.id||r.b===p.id);
 if(k==="resource_access")return clamp(known.reduce((a,x)=>a+x.confidence,0)/4);
 if(k==="orientation")return clamp((p.apparatus.attention+p.apparatus.receptor)/2);
 if(k==="cohesion")return clamp(avg(rels.map(r=>Math.min(1,r.coPresence/25)*.50+(r.conductance||0)*.25+(r.causalSurplus||0)*.15+(r.consequenceLoad||0)*.10)));
 if(k==="witnessing")return clamp(avg(rels.map(r=>Math.min(1,r.witness/20))));
 if(k==="mobility")return clamp(p.material.mobility);
 if(k==="retention")return clamp(p.apparatus.retention);
 return 0;
}
function activationBranchMean(profile,branch){return profile?.[branch]||0;}
export function productiveRelationState(w,r){
 const a=w.forms.get(r.a),b=w.forms.get(r.b);
 if(!(a instanceof Person)||!(b instanceof Person)||!a.alive||!b.alive)
   return {generated:{},surplus:0,productive:false};

 const aa=relationalPotencyActivation(w,a,b,{ignoreTension:true}).activated;
 const ab=relationalPotencyActivation(w,b,a,{ignoreTension:true}).activated;
 const tensionA=r.priorDirectionalTension?.[a.id]?.load||0,tensionB=r.priorDirectionalTension?.[b.id]?.load||0;
 const unresolved=clamp((tensionA+tensionB)/2);

 // v1.08 — Earned causal surplus. Acknowledgement/co-presence may retain a Relation, but they do not
 // by themselves prove that becoming has actually passed through it. Productive generation therefore
 // requires prior Moment-bound consequential history. This history is non-semantic: neutral reciprocal
 // encounter is sufficient actuality; friendship/help/hostility labels are neither required nor inferred.
 const actualEpisodes=(r.residue||[]).filter(x=>x?.kind==='moment_relation_trace'&&x.actualityBound&&
   ((x.consequence||0)>0||(x.realityConsequence?.physical||0)>0)).length;
 // v1.13 safety reconciliation with three-reality consequence: representation-level actuality is
 // real in Consciousness/Mental registers but cannot mint Physical productive capacity. Physical
 // causal surplus requires history whose Physical consequence is itself non-zero.
 const consequenceGate=(r.consequenceLoad||0)>0
   ?clamp((r.consequenceLoad||0)*2.15+Math.min(1,actualEpisodes/6)*.28):0;
 const historicalRetention=clamp((r.priorConductance||0)*.48+(r.priorAutonomy||0)*.12+
   Math.min(1,r.coPresence/45)*.18+(r.traceLoad||0)*.14+Math.min(1,r.witness/35)*.08);
 const retained=clamp(historicalRetention*consequenceGate);

 // Differentiation is not semantic complementarity. It is structural difference in the actual
 // Ground/Order/Process activation each participant contributes to this encounter configuration.
 const complement=clamp(structuralProfileDistance(aa,ab)*1.8+
   Math.abs(activationBranchMean(aa,"ground")-activationBranchMean(ab,"ground"))*.35+
   Math.abs(activationBranchMean(aa,"process")-activationBranchMean(ab,"process"))*.35);
 const reciprocalActivation=clamp(gm([Math.max(.001,structuralProfileMean(aa)),Math.max(.001,structuralProfileMean(ab))]));
 // Distinct contribution does not require numerical dissimilarity. Two equally capable finite poles can
 // generate a new carrying configuration (for example by jointly bearing a load). Structural complement
 // strengthens the effect, while reciprocal activation proves that both poles are actually contributing.
 const differentiatedContribution=clamp(reciprocalActivation*(.22+complement*.78));

 const generated={};let surplusSum=0;
 for(const k of REL_CAP_KEYS){
   const ca=personBaseCapacity(w,a,k),cb=personBaseCapacity(w,b,k),best=Math.max(ca,cb);
   let basis=0;
   if(k==="resource_access")basis=activationBranchMean(aa,"ground")*.45+activationBranchMean(ab,"ground")*.45;
   if(k==="orientation")basis=activationBranchMean(aa,"process")*.35+activationBranchMean(ab,"process")*.35+
     activationBranchMean(aa,"order")*.15+activationBranchMean(ab,"order")*.15;
   if(k==="cohesion")basis=reciprocalActivation*.55+(r.priorConductance||0)*.35;
   if(k==="witnessing")basis=reciprocalActivation*.42+Math.min(1,r.witness/30)*.38;
   if(k==="mobility")basis=activationBranchMean(aa,"process")*.42+activationBranchMean(ab,"process")*.42;
   if(k==="retention")basis=activationBranchMean(aa,"order")*.30+activationBranchMean(ab,"order")*.30+
     Math.min(1,r.residue.length/80)*.28;

   // Synergy is earned by consequential relational history AND differentiated contribution. There is
   // deliberately no baseline synergy constant: identical contributors or acknowledgement-only history
   // cannot manufacture a capacity the Relation has never causally demonstrated. Excess unresolved
   // tension can reduce the usable expression of an otherwise productive configuration.
   const tensionGate=clamp(1-Math.max(0,unresolved-.35)*.9);
   const joint=clamp(best + basis*retained*differentiatedContribution*tensionGate);
   const surplus=Math.max(0,joint-best);
   generated[k]={joint,participantBest:best,surplus};
   surplusSum+=surplus;
 }
 const surplus=clamp(surplusSum/REL_CAP_KEYS.length*2.2);
 return {generated,surplus,productive:surplus>.018,retained,historicalRetention,consequenceGate,actualEpisodes,
   complement,differentiatedContribution,reciprocalActivation,unresolved};
}

export function updateProductiveRelation(w,r){
 const st=productiveRelationState(w,r);
 // Numerical sampling is not additional becoming. Productive capacity approaches its current
 // relational possibility in physical time so 12 and 24 samples/day do not manufacture different
 // histories. The response constant is engineering, not a new ontological property.
 const dt=Math.max(0,w.time?.dtDays??1),tauDays=.75,alpha=clamp(1-Math.exp(-dt/tauDays));
 const prev=r.generatedCapacity||{},next={};
 for(const k of REL_CAP_KEYS){
   const old=prev[k]?.joint??st.generated[k]?.participantBest??0,now=st.generated[k]?.joint||0;
   next[k]={...st.generated[k],joint:clamp(old+(now-old)*alpha)};
   next[k].surplus=Math.max(0,next[k].joint-(st.generated[k]?.participantBest||0));
 }
 r.generatedCapacity=next;
 const oldSurplus=r.causalSurplus||0;
 r.causalSurplus=clamp(oldSurplus+(st.surplus-oldSurplus)*alpha);

 // A productive relation is a state/episode, not a frame event. Record opening (and rare material
 // changes) only; continuous solver frames while it remains open do not mint new history.
 const nowElapsed=w.elapsedDays??w.clock??0,opening=st.productive&&!r.productiveOpen;
 const last=r.generationHistory.at(-1);
 const materialChange=st.productive&&last&&Math.abs((last.surplus||0)-st.surplus)>.04&&
   nowElapsed-(r.lastGenerationRecordElapsed??-Infinity)>.5;
 if(opening||materialChange){
   r.generationHistory.push({kind:opening?'productive_relation_open':'productive_relation_change',clock:w.clock,elapsedDays:nowElapsed,
     surplus:st.surplus,retained:st.retained,consequenceGate:st.consequenceGate,actualEpisodes:st.actualEpisodes,
     complement:st.complement,differentiatedContribution:st.differentiatedContribution,unresolved:st.unresolved,generated:st.generated});
   r.lastGenerationRecordElapsed=nowElapsed;if(r.generationHistory.length>180)r.generationHistory.shift();
 }
 r.productiveOpen=st.productive;
 return {...st,smoothedSurplus:r.causalSurplus};
}

export function relationGeneratedAffordances(w,r){
 const st=updateProductiveRelation(w,r),out=[];
 if(!st.productive)return out;
 for(const [capacity,x] of Object.entries(r.generatedCapacity||{})){
   if((x.surplus||0)>.008)out.push({relation:r.id,capacity,joint:x.joint,
     participantBest:x.participantBest,surplus:x.surplus});
 }
 return out.sort((a,b)=>b.surplus-a.surplus);
}

// ---- GENERATED WHOLE FUNCTION-SPACES --------------------------------------
//
// No fixed human-readable role triad.
// A Whole computes deficits in low-level capacities. The strongest distinct deficits become temporary
// necessary spaces. At most one member occupies each space in a Moment.

const CAP_KEYS=["resource_access","orientation","cohesion","witnessing","mobility","retention"];
function memberCaps(w,p,g){
 const internal=g.members.filter(id=>id!==p.id).map(id=>w.rel(p.id,id));
 const resourceAccess=[...p.known.values()].reduce((s,k)=>s+k.confidence,0)/4;
 const base={
  resource_access:clamp(resourceAccess),
  orientation:clamp((p.apparatus.attention+p.apparatus.receptor)/2),
  cohesion:clamp(avg(internal.map(r=>Math.min(1,r.coPresence/25)*.50+(r.conductance||0)*.25+(r.causalSurplus||0)*.15+(r.consequenceLoad||0)*.10))),
  witnessing:clamp(avg(internal.map(r=>Math.min(1,r.witness/20)))),
  mobility:p.material.mobility,
  retention:p.apparatus.retention
 };
 // A member can conduct a capacity partly because a retained relation has generated an affordance neither
 // participant carries alone. The affordance belongs to the relation; this only makes it available to the Whole.
 for(const k of REL_CAP_KEYS){
   const relSurplus=avg(internal.map(r=>r.priorGeneratedCapacity?.[k]?.surplus||0));
   base[k]=clamp(base[k]+relSurplus*.55);
 }
 return base;
}
function wholeDeficits(w,g){
 const live=g.members.map(id=>w.forms.get(id)).filter(p=>p instanceof Person&&p.alive);
 const avgCaps={};for(const k of CAP_KEYS)avgCaps[k]=avg(live.map(p=>memberCaps(w,p,g)[k]));
 // necessity derives from current world/body/history, not occupation names.
 const avgWater=avg(live.map(p=>p.body.water)),avgEnergy=avg(live.map(p=>p.body.energy));
 return {
  resource_access:clamp((1-avgWater)*.45+(1-avgEnergy)*.45+(1-avgCaps.resource_access)*.25),
  orientation:clamp((1-avgCaps.orientation)*.35+(1-g.boundary)*.22),
  cohesion:clamp((1-avgCaps.cohesion)*.5),
  witnessing:clamp((1-avgCaps.witnessing)*.35+avg(Object.values(g.prestigeLedger))*0.05),
  mobility:clamp((1-avgCaps.mobility)*.25),
  retention:clamp((1-avgCaps.retention)*.3)
 };
}
export function resolveWhole(w,g){
 const live=g.members.map(id=>w.forms.get(id)).filter(p=>p instanceof Person&&p.alive),def=wholeDeficits(w,g);
 const slots=Object.entries(def).filter(([,v])=>v>.12).sort((a,b)=>b[1]-a[1]).slice(0,Math.min(3,live.length));
 g.slots=slots.map(([capacity,pressure],i)=>({id:`${g.id}:slot:${capacity}`,capacity,pressure}));
 const used=new Set(),assign=new Map();
 for(const slot of g.slots){
  const ranked=live.filter(p=>!used.has(p.id)).map(p=>({id:p.id,score:memberCaps(w,p,g)[slot.capacity]*slot.pressure})).sort((a,b)=>b.score-a.score);
  if(ranked[0]&&ranked[0].score>.025){assign.set(slot.id,ranked[0].id);used.add(ranked[0].id);
   g.functionMemory.push({clock:w.clock,slot:slot.capacity,holder:ranked[0].id,score:ranked[0].score});
   const k=`${slot.capacity}:${ranked[0].id}`;g.prestigeLedger[k]=clamp((g.prestigeLedger[k]||0)+.02);}
 }
 g.assignments=assign;g.persist++;
 const internal=[];for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)internal.push(w.rel(live[i].id,live[j].id));
 const outside=live.map(p=>avg(w.people().filter(o=>!g.members.includes(o.id)).map(o=>Math.min(1,w.rel(p.id,o.id).coPresence/25))));
 g.boundary=clamp(g.boundary*.85+Math.max(0,avg(internal.map(r=>Math.min(1,r.coPresence/25)))-avg(outside))*.15);
 g.history.push({clock:w.clock,deficits:def,slots:g.slots,assignments:Object.fromEntries(assign),boundary:g.boundary});
 return g.history.at(-1);
}
export function maybeFormWholes(w){
 const ps=w.people(),created=[];
 const activeMemberships=id=>[...w.wholes.values()].filter(g=>g.alive&&g.members.includes(id)).length;
 const membershipCapacity=p=>1+(p.apparatus.attention>.62?1:0); // finite relational aperture

 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)for(let k=j+1;k<ps.length;k++){
  const persons=[ps[i],ps[j],ps[k]],members=persons.map(p=>p.id);
  if(persons.some(p=>activeMemberships(p.id)>=membershipCapacity(p)))continue;

  const rels=[w.rel(members[0],members[1]),w.rel(members[0],members[2]),w.rel(members[1],members[2])];
  const continuity=avg(rels.map(r=>Math.min(1,r.coPresence/22)));
  const mutualWitness=avg(rels.map(r=>Math.min(1,r.witness/18)));
  const consequence=avg(rels.map(r=>clamp((r.consequenceLoad||0)+(r.causalSurplus||0)*.55+(r.benefit||0)+(r.harm||0))));
  if(continuity<.42||mutualWitness<.28||consequence<.025)continue;

  const id=`W:${[...members].sort().join("+")}`;
  if(w.wholes.has(id))continue;

  // Candidate must generate several distinct necessary spaces and have unique viable carriers.
  const temp=new Whole(id,members),def=wholeDeficits(w,temp);
  const slots=Object.entries(def).filter(([,v])=>v>.14).sort((a,b)=>b[1]-a[1]).slice(0,3);
  if(slots.length<2)continue;
  const used=new Set();let assigned=0,totalFit=0;
  for(const [cap,pressure] of slots){
   const ranked=persons.filter(p=>!used.has(p.id)).map(p=>({p,score:memberCaps(w,p,temp)[cap]*pressure})).sort((a,b)=>b.score-a.score);
   if(ranked[0]?.score>.04){used.add(ranked[0].p.id);assigned++;totalFit+=ranked[0].score}
  }
  const causalSurplus=clamp(continuity*.3+mutualWitness*.2+consequence*.2+(assigned/slots.length)*.3);
  if(assigned<2||causalSurplus<.34)continue;

  const g=new Whole(id,members);g.boundary=clamp(continuity*.55+mutualWitness*.25);
  w.add(g);members.forEach(x=>w.forms.get(x).memberships.push(id));created.push(g);
 }
 return created;
}
export function stepWholes(w){
 maybeFormWholes(w);const out=[];
 for(const g of w.wholes.values())if(g.alive){
  const live=g.members.filter(id=>w.forms.get(id)?.alive);
  if(live.length<2){g.alive=false;continue}
  const r=resolveWhole(w,g);out.push(r);
  for(const [slotId,holder] of g.assignments){
   const slot=g.slots.find(s=>s.id===slotId),p=w.forms.get(holder);
   if(p)retain(w,p,{target:g.id,kind:"function",valence:.08,geometry:`conduct_${slot.capacity}`,whole:g.id});
  }
 }
 return out;
}


export function contradictionProbe(w,p,target,attribute,objective){
 // Test hook using the exact ordinary rendering law; not a separate correction mechanic.
 return render(w,p,target,attribute,objective);
}


export function updateRelationForm(w,r,event=null){
 // Numerical sampling is not a Moment. Any chronologically accumulated relation-state scales with dt.
 const dt=w.time?.dtDays??1;
 // Snapshot prior state before calculating this interval.
 r.priorDirectionalTension=JSON.parse(JSON.stringify(r.directionalTension||{}));
 r.priorGeneratedCapacity=JSON.parse(JSON.stringify(r.generatedCapacity||{}));
 r.priorConductance=r.conductance||0;r.priorAutonomy=r.autonomy||0;
 const a=w.forms.get(r.a),b=w.forms.get(r.b);
 const together=a?.alive&&b?.alive&&md(a.pos,b.pos)<=1;
 if(together)r.absence=clamp(r.absence-.08*dt,0,5);else r.absence=clamp(r.absence+.012*dt,0,5);

 if(event){
  const pa=a instanceof Person?relationalPotencyActivation(w,r,a):null;
  const pb=b instanceof Person?relationalPotencyActivation(w,r,b):null;
  if(pa||pb){
    r.history.push({clock:w.clock,type:"attribute_activation",a:pa?.activated||null,b:pb?.activated||null});
  }
  const val=event.benefit||0;
  const geometry=event.type||event.geometry||"contact";
  const item={clock:w.clock,geometry,valence:val,actors:[r.a,r.b],form:event.form||null,target:event.toward||null};
  r.present.push(item);r.residue.push(item);r.history.push(item);r.lastJointClock=w.clock;
  if(r.present.length>18)r.present.shift();if(r.residue.length>180)r.residue.shift();
  r.material.stock=clamp(r.material.stock+.025+val*.15);
  r.material.visibility=clamp(r.material.visibility+(event.type==="joint_place"?.06:.015));
 }
 // Retained relation conductance is generated by continuity + consequences + differentiated history.
 const recent=r.residue.slice(-40),types=new Set(recent.map(x=>x.geometry));
 const consequence=clamp((r.consequenceLoad||0)+r.benefit+r.harm+avg(recent.map(x=>Math.abs(x.valence||0)+(x.consequence||0)*.35)));
 const continuity=clamp(r.coPresence/80);
 const differentiation=clamp(types.size/5);
 r.conductance=clamp(continuity*.35+consequence*.35+differentiation*.2+r.material.stock*.1+r.reactivation*.08-r.absence*.035);

 // Autonomy is now distinct from conductance: retained relational organisation that persists
 // beyond immediate co-presence/current event. It requires historical depth + differentiated residue
 // and is strongest when the relation remains causally structured during absence.
 const historicalDepth=clamp(r.residue.length/90);
 const patternDepth=clamp(types.size/6);
 const absentPersistence=clamp((together?0:.35)+Math.min(.45,r.absence*.12));
 const retainedOrganisation=clamp(historicalDepth*.34+patternDepth*.28+r.material.stock*.18+
   Math.min(1,r.witness/35)*.20);
 r.autonomy=clamp(retainedOrganisation*(.35+.65*absentPersistence));

 // Tension is stored relational displacement. It may persist in absence without being a current collision.
 const ts=relationTensionState(w,r);
 r.directionalTension=ts.directional;r.tensionLoad=ts.load;
 if(r.tensionLoad>.012){
   const last=r.tensionHistory.at(-1),changed=!last||Math.abs((last.load||0)-r.tensionLoad)>.035||(w.clock-(last.clock??-Infinity))>.25;
   if(changed){const tr={clock:w.clock,load:r.tensionLoad,directional:Object.fromEntries(Object.entries(ts.directional).map(([id,x])=>[id,{load:x.load,projected:x.projected,absencePull:x.absencePull,distance:x.distance,profile:x.profile}]))};
     r.tensionHistory.push(tr);if(r.tensionHistory.length>180)r.tensionHistory.shift();}
 }
 // Productive relation is calculated after activation/tension because both alter what the configuration can carry.
 updateProductiveRelation(w,r);
 // Relation Present is finite too.
 if(!together && r.present.length && w.clock-r.present[0].clock>240)r.present.shift();
 return r;
}

export function relationPressureOnPerson(w,p){
 let pressure=0;
 for(const r of w.relations.values()){
  if(r.a!==p.id&&r.b!==p.id)continue;
  const other=r.a===p.id?r.b:r.a,op=w.forms.get(other);
  if(!op?.alive)continue;
  // No RELATION POWER bonus: retained relation-history changes route conductance by making the other
  // practically present to this Self. Fear can oppose it later in candidate scoring.
  pressure+=r.autonomy/(1+md(p.pos,op.pos)*.25);
 }
 return clamp(pressure/3);
}

// ---- RETROSPECTIVE VALUE / WILL AUDIT -------------------------------------

export function valueWillAudit(w,p){
 // Retrospective only. Value is not repetition by itself: it requires preservation when another
 // genuinely live Process closed. The audit never feeds back into action selection.
 const rows=new Map();
 for(const x of p.preservationHistory||[]){
   const r=rows.get(x.process)||{process:x.process,kind:x.kind,target:x.target||null,count:0,
     weightedCost:0,costKinds:new Set(),closures:new Set(),first:x.clock,last:x.clock};
   r.count++;
   r.weightedCost+=x.costWeight??x.costMomentum??0;
   r.costKinds.add(x.costKind||"unknown");
   r.closures.add(x.closure||"unknown");
   r.last=x.clock;
   rows.set(x.process,r);
 }
 const values=[...rows.values()].map(r=>({...r,costKinds:[...r.costKinds],closures:[...r.closures],
   span:r.last-r.first,
   diagnosticStrength:clamp(r.count/7+r.weightedCost/3+r.costKinds.size*.12)}))
   .sort((a,b)=>b.diagnosticStrength-a.diagnosticStrength);
 return {values,willDirection:values[0]?.process||null}; // names are audit language, not causal variables
}

export function relationAudit(w,p,otherId){
 // Descriptive only: no Love/obsession/friendship semantic diagnosis.
 const r=w.relations.get(keyPair(p.id,otherId));
 const other=w.forms.get(otherId);
 if(!r||!(other instanceof Person))return null;
 const toward=p.history.filter(e=>e.target===otherId&&(e.geometry==="close_distance"||e.mode==="approach")).length;
 const away=p.history.filter(e=>e.target===otherId&&(e.geometry==="increase_distance"||e.mode==="avoid")).length;
 const reciprocal=other.history.filter(e=>e.target===p.id&&(e.geometry==="close_distance"||e.mode==="approach")).length;
 const preserved=(p.preservationHistory||[]).filter(x=>x.kind==="relation"&&x.target===otherId);
 const costs=preserved.reduce((a,x)=>a+(x.costWeight||0),0);
 const responses=p.socialResidue.filter(x=>x.target===otherId);
 const transform=availabilityTransformationByRelation(w,p,otherId);
 return {other:otherId,toward,away,reciprocal,conductance:r.conductance,autonomy:r.autonomy,
   benefit:r.benefit,harm:r.harm,witness:r.witness,coPresence:r.coPresence,
   costlyPreservations:preserved.length,preservationCost:costs,
   availabilityTransform:transform,
   observedApproach:responses.filter(x=>x.response==="approach").length,
   observedAvoid:responses.filter(x=>x.response==="avoid").length};
}

export function stepWorld(w){
 const ev=[];for(const p of [...w.people()]){const e=stepPerson(w,p);if(e)ev.push(e)}
 const wholes=stepWholes(w);return {events:ev,wholes};
}


export function flattenIntrinsic(w,f){
 const h=intrinsicHologram(w,f),arr=[];
 for(const l of LAYERS)for(const b of BRANCHES)arr.push(h[l][b]);
 return arr;
}
export function flattenCube(w,f,receiver=null){
 const c=contextualProjection(w,f,receiver),arr=[];
 for(const l of LAYERS)for(const fld of FIELDS)for(const b of BRANCHES)arr.push(c[`${l}.${fld}`][b]);
 return arr;
}
