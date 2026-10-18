import {GameError} from './simulation.mjs';
import {NAMES, namesFor,MINUTE,resolveName,person,visible} from './case-world.mjs';
import {approach,nearTasks} from './case-intentions.mjs';

export const OPERATIONS=['focus','purpose','self_account','introduce','call','text','message','power_on','power_off','move','inspect','take','drop','write','ask','say','promise','retract','share','confront','file','wait','compress','impact','restrain','defend','aid','flee','damage','erase','ignite'];
export const PLAN_SCHEMA={type:'object',additionalProperties:false,properties:{clarification:{type:'string'},steps:{type:'array',items:{type:'object',additionalProperties:false,properties:{op:{type:'string',enum:OPERATIONS},target:{type:['string','null']},instrument:{type:['string','null']},content:{type:'string'},minutes:{type:'number'}},required:['op','target','instrument','content','minutes']}}},required:['clarification','steps']};
export function compilePlan(s,seat,prompt,plan){
  if(!plan||typeof plan.clarification!=='string'||!Array.isArray(plan.steps)||plan.steps.length<1||plan.steps.length>6||Object.keys(plan).some(k=>!['clarification','steps'].includes(k)))throw new GameError('The interpretation did not describe a valid attempted process. Please clarify the immediate action.');
  const tasks=[];
  const targetFor=raw=>{if(typeof raw!=='string')throw new GameError('The attempt needs an encountered target.');return resolveName(s,seat,namesFor(s)[raw]||raw);};
  for(const step of plan.steps){
    if(!step||Object.keys(step).some(k=>!['op','target','instrument','content','minutes'].includes(k))||!OPERATIONS.includes(step.op)||typeof step.content!=='string'||step.content.length>600||!Number.isFinite(step.minutes)||step.minutes<.1||step.minutes>(s.turn?1440:30))throw new GameError('The interpreted process contains unsupported parameters.');
    const op=step.op,target=['wait','defend','purpose','self_account'].includes(op)?null:targetFor(step.target),instrument=step.instrument?targetFor(step.instrument):null;
    if(['purpose','self_account'].includes(op)){tasks.push({kind:op,duration:step.minutes*MINUTE,words:step.content,summary:op==='purpose'?'Reflect on your present purpose':'Reflect on your account of yourself'});continue;}
    if(op==='focus'){tasks.push({kind:'focus',target,duration:step.minutes*MINUTE,summary:`Attend to ${namesFor(s)[target]} from your present position`});continue;}
    if(['call','text','message'].includes(op)){if(person(s,target)?.kind!=='person'||target===seat)throw new GameError('Address another person you have encountered.');tasks.push({kind:'transmit',duration:step.minutes*MINUTE,to:target,channel:op==='call'?'voice':op==='text'?'sms':'internet',words:step.content,summary:`Try to ${op} ${namesFor(s)[target]}`});continue;}
    if(op==='move'){tasks.push(approach(s,seat,target));continue;}
    const t={kind:op,duration:Math.min(s.turn?1440:10,step.minutes)*MINUTE,target,instrument,words:step.content,summary:`Try to ${op} ${namesFor(s)[target]||''}`.trim()};
    if(op==='power_on'||op==='power_off'){t.kind='power';t.powered=op==='power_on';}
    if(['compress','impact','restrain'].includes(op)){if(person(s,target)?.kind!=='person')throw new GameError('That bodily contact requires a person as its target.');t.kind='contact';t.effect=op;t.summary=`Attempt ${op==='compress'?'sustained constraining':op} contact with ${namesFor(s)[target]}`;}
    if(['ask','say','promise','retract','confront','share','introduce'].includes(op)){t.to=target;delete t.target;if(person(s,target)?.kind!=='person')throw new GameError('Address a person you have encountered.');}
    if(op==='file'){t.target='cabinet';t.accused=target;}
    if(op==='share'){
      const d=s.discoveries[seat].find(d=>d.root===step.content||d.title===step.content||d.text===step.content);if(!d)throw new GameError('You have not acquired the record being shared.');t.discovery={...d};
    }
    const positioned=tasks.at(-1)?.kind==='move'? [t]:nearTasks(s,seat,t);
    tasks.push(...positioned);
  }
  let offset=0;for(const t of tasks){t.starts=offset;offset+=t.duration;t.ends=offset;}
  if(offset>(s.turn?1440:30)*MINUTE)throw new GameError('Describe the immediate part of this plan, within 30 simulated minutes.');
  return{prompt,tasks,duration:offset,summary:tasks.map(t=>t.summary).join(' → '),interpretation:'model'};
}
export function privateInterpretationContext(view){
  // The interpreter sees only the requesting player's already-filtered knowledge.
  // No other prompt, NPC private memory, culprit flag or authoritative world graph.
  return{seat:view.seat,name:view.name,clock:view.clock,surroundings:view.surroundings,knownPlaces:view.knownPlaces,inventory:view.inventory,condition:view.condition,environment:view.environment,agency:view.agency,
    acquired:view.discoveries.map(d=>({root:d.root,title:d.title,text:d.text,mode:d.mode})),recent:view.entries.slice(-10).map(e=>({kind:e.kind,text:e.text}))};
}
