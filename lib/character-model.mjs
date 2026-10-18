import {person,NAMES,namesFor,refreshAccess,entry} from './case-world.mjs';
import {GameError} from './simulation.mjs';
import {nameKey,reservedTargetName} from './name-resolution.mjs';

import {ROLES,BACKGROUNDS,PHYSIQUES,CHARACTER_PRESETS} from './character-catalog.mjs';
export {ROLES,BACKGROUNDS,PHYSIQUES,CHARACTER_PRESETS} from './character-catalog.mjs';

export function validateCharacter(input,names={},seat=null){
  if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['preset','name','role','background','physique'].includes(k)))throw new GameError('Choose a character from the supported background builder.');
  const preset=input.preset&&input.preset!=='custom'?CHARACTER_PRESETS.find(p=>p.id===input.preset):null;
  if(input.preset&&input.preset!=='custom'&&!preset)throw new GameError('Choose an available character.');
  const name=String(input.name||'').normalize('NFKC').trim();
  if(!/^[\p{L}][\p{L} '-]{1,29}$/u.test(name)||Object.values(names).some(v=>nameKey(v)===nameKey(name))||(seat&&reservedTargetName(name,seat))||['my','you','me','body','police','wait','continue','end turn'].includes(nameKey(name)))throw new GameError('Choose a distinct name of 2–30 letters, spaces, apostrophes or hyphens. Existing target names and their spelling variants are reserved.');
  const character={preset:preset?.id||'custom',name,role:preset?.role||input.role,background:preset?.background||input.background,physique:preset?.physique||input.physique};
  if(!ROLES.some(x=>x.id===character.role)||!BACKGROUNDS.some(x=>x.id===character.background)||!PHYSIQUES.some(x=>x.id===character.physique))throw new GameError('Choose an available position, background and physical build.');
  return character;
}
export function applyCharacter(s,seat,input){
  if(s.setup?.phase!=='setup')throw new GameError('Characters are fixed after both players confirm.',409);
  const occupied=Object.fromEntries(Object.entries(namesFor(s)).filter(([id])=>![seat,`note${seat}`,`pen${seat}`,`phone${seat}`].includes(id))),c=validateCharacter(input,occupied,seat),p=person(s,seat);
  if(Object.entries(NAMES).some(([id,name])=>id!==seat&&['A','B','N','D','S','P','body'].includes(id)&&name.toLowerCase()===c.name.toLowerCase()))throw new GameError('That name already identifies another person in this scenario.');
  s.setup.characters[seat]=c;s.setup.confirmed[seat]=false;
  s.names[seat]=c.name;s.names[`note${seat}`]=`${c.name}’s ${s.setup.profileId==='roman-court'?'writing leaf':'paper'}`;s.names[`pen${seat}`]=`${c.name}’s pen`;if(s.environment.devices[`phone${seat}`])s.names[`phone${seat}`]=`${c.name}’s phone`;
  const base=p.creationBody||=( {stock:p.material.stock,force:p.material.force,mobility:p.material.mobility} ),frame=c.physique==='light'?{stock:.88,force:.9,mobility:1.06}:c.physique==='solid'?{stock:1.12,force:1.1,mobility:.94}:{stock:1,force:1,mobility:1};
  for(const k of ['stock','force','mobility'])p.material[k]=base[k]*frame[k];
  const background=BACKGROUNDS.find(b=>b.id===c.background),role=ROLES.find(r=>r.id===c.role);
  p.situatedHistory=[{source:'scenario:prior-visit',description:'Prior visit and admission to the open inquiry'},{source:'scenario:practised-background',description:background.history,...(background.handling?{handling:{...background.handling}}:{}),...(background.observation?{observation:background.observation}:{})}];
  p.retainedHandling=background.handling?[{...background.handling,source:'scenario:practised-background'}]:[];p.retainedObservation=background.observation?{kind:background.observation,source:'scenario:practised-background'}:null;
  s.environment.roles[seat]={title:role.title,basis:role.basis,supports:[background.history,'Can read the local archive script from prior schooling.'],limits:['No title grants hidden knowledge, compulsory cooperation or guaranteed outcomes.']};
  refreshAccess(s);return c;
}
export function confirmCharacter(s,seat){
  if(s.setup?.phase!=='setup')throw new GameError('This setup is already complete.',409);
  if(!s.setup.characters[seat])throw new GameError('Choose your character first.');
  s.setup.confirmed[seat]=true;
  if(s.setup.confirmed.A&&s.setup.confirmed.B){s.setup.phase='play';entry(s,['A','B'],'opening','Both players confirmed the world and their characters. Your starting goals are fixed. Each turn allows several actions within fifteen simulated minutes.');}
  return true;
}
export function handlingCoordination(p,encounter=null){
  const base=p.capacities?.manipulation||0,matched=encounter?.counterpart?.kind==='person'&&encounter.direct===true&&encounter.timeProfile==='sustained'&&!encounter.instrument&&p.retainedHandling?.some(h=>h.counterpartKind==='person'&&h.contact==='direct'&&h.timeProfile==='sustained'&&h.instrument===false&&h.source);
  return Math.min(1,base*(matched?1.15:1));
}
export function observationEfficiency(s,seat,target){const p=person(s,seat),f=person(s,target),kind=target==='body'||f?.kind==='person'?'visible-body':s.patterns[target]&&f?.material?.surfaceInkAffinity>.3?'inscribed-surface':null;return kind&&p.retainedObservation?.kind===kind?1.12:1;}
