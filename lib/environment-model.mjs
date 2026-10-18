import {World,Person,Form} from '../engine/destiny-v113/destiny_unified_kernel.js';

const copy=x=>JSON.parse(JSON.stringify(x));

// A profile supplies actual initial conditions, never behaviours or class bonuses.
// Game objectives and the prior events of a particular scenario are separate.
export function createEnvironmentWorld(definition,{seed=1}={}){
  const d=copy(definition),ids=new Set();
  if(!d.id||!Number.isFinite(d.space?.width)||!Number.isFinite(d.space?.height)||d.space.width<2||d.space.height<2||!Number.isFinite(d.elapsedDays)||!Array.isArray(d.people)||!Array.isArray(d.materials))throw new Error('Incomplete environment definition');
  for(const spec of [...d.people,...d.materials]){
    const pos=spec.initial?.pos;
    if(!spec.id||ids.has(spec.id)||!pos||![pos.x,pos.y].every(Number.isFinite)||pos.x<0||pos.y<0||pos.x>d.space.width-1||pos.y>d.space.height-1)throw new Error('Invalid or duplicate situated form');
    ids.add(spec.id);
  }
  for(const encounter of d.priorEncounters||[])if(!ids.has(encounter.observer)||!ids.has(encounter.target)||!encounter.source)throw new Error('A prior encounter needs existing participants and a source');
  const world=new World(d.space.width,d.space.height);world.seed=seed;world.terrain=new Map();world.elapsedDays=d.elapsedDays;
  world.environmentDefinition=d;
  for(const spec of d.people){
    const p=new Person(spec.id,copy(spec.initial));
    Object.assign(p,copy(spec.condition||{}));p.learnedScripts=[...(spec.learnedScripts||[])];p.learnedProcedures=[...(spec.learnedProcedures||[])];
    p.situatedHistory=copy(spec.history||[]);world.add(p);
  }
  for(const spec of d.materials){const f=new Form(spec.id,copy(spec.initial));Object.assign(f.material,copy(spec.stores||{}));world.add(f);}
  for(const e of d.priorEncounters||[]){const p=world.forms.get(e.observer),f=world.forms.get(e.target);if(p.kind!=='person')throw new Error('An encounter observer must have a perceptual apparatus');p.known.set(e.target,{confidence:e.confidence??.65,direct:false,source:e.source,clock:world.clock,lastPos:{...f.pos}});}
  return world;
}

export function environmentName(world,id){return [...(world.environmentDefinition?.people||[]),...(world.environmentDefinition?.materials||[])].find(f=>f.id===id)?.name||id;}
