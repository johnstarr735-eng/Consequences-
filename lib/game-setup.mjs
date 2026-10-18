import {createCaseState,CASE,NAMES,NPC_IDS,person,entry,refreshAccess,namesFor} from './case-world.mjs';
import {initializeTimedTurns} from './case-time-turns.mjs';
import {applyCharacter,confirmCharacter,validateCharacter} from './character-model.mjs';
import {environmentById,difficultyById,defaultRecipe,validateRecipe} from './scenario-catalog.mjs';
import {GameError} from './simulation.mjs';

export function normalizeSetup(input={}){
  if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['profileId','difficulty','character'].includes(k)))throw new GameError('Choose a supported environment, difficulty and character.');
  const profileId=input.profileId||'port-serein',difficulty=input.difficulty||'medium';
  if(!environmentById(profileId)||!difficultyById(difficulty))throw new GameError('Choose an available environment and difficulty.');
  const occupied={...NAMES,body:environmentById(profileId).victim,P:environmentById(profileId).officer};for(const id of ['A','noteA','penA','phoneA'])delete occupied[id];
  return{profileId,difficulty,character:input.character?validateCharacter(input.character,occupied,'A'):null};
}
export function createConfiguredState(seed=1,input={},generatedRecipe=null){
  const choice=normalizeSetup(input),profile=environmentById(choice.profileId),difficulty=difficultyById(choice.difficulty);
  let recipe;try{recipe=validateRecipe(generatedRecipe||defaultRecipe(profile.id,seed),profile.id);}catch(error){throw new GameError(error.message);}
  // Existing initial incident compiler gives each source a distinct prior event.
  const s=createCaseState(recipe.culpritIndex===0?3:recipe.culpritIndex);
  s.world.seed=seed;s.names={...NAMES,body:profile.victim,P:profile.officer,clock:profile.record};
  s.setup={version:1,phase:'setup',profileId:profile.id,family:profile.family,difficulty:difficulty.id,deadlineMinutes:difficulty.deadlineMinutes,guided:difficulty.guided,
    recipe,generator:generatedRecipe?'connected-ai':'local-validated',characters:{A:null,B:null},confirmed:{A:false,B:false}};
  s.caseDefinition={...CASE,title:profile.titles[recipe.titleIndex],goal:`Be first to establish who killed ${profile.victim}, supported by acquired evidence.`,maxExchanges:0,
    rules:`Name the killer and lodge your case at the case desk. Acquire three different original sources covering access, material means and timeline; at least two must be inspected firsthand. Copies keep their original origin. You have ${difficulty.deadlineMinutes} simulated minutes before the inquiry closes. Each player controls several prompts within a turn of up to fifteen minutes. Unfinished activity persists. Direct encounters can permit a brief response. Resignation or permanent player elimination closes the match without awarding an unsupported goal.`};
  Object.assign(s.environment,{id:profile.id,place:`${profile.title} · ${profile.place}`,region:profile.family==='historical'?'Historical fiction; invented local incident':profile.family==='fantasy'?'Invented world':'Fictional coastal municipality',date:profile.date,publicContext:[profile.history,profile.authority,profile.technology,profile.communication]});
  Object.assign(s.world.environmentDefinition,{id:profile.id,place:profile.place,period:profile.period,date:profile.date});
  if(!profile.electronic){
    for(const id of ['phoneA','phoneB','phoneP','router']){
      s.world.forms.delete(id);s.world.materialCouplings.delete(id);delete s.names[id];
      for(const p of s.world.forms.values())p.known?.delete(id);
    }
    s.environment.devices={};s.environment.routerPowered=false;s.environment.infrastructure={cellularVoice:false,cellularSMS:false,cellularData:false,internetUplink:false,mainsPower:false,router:null,wifiRadius:0};
    s.environment.institutions=[{id:'local-inquiry',name:'Local inquiry and hired guard',members:['P'],mandate:'Check received reports and encountered harm',equipment:[],origin:'prior:body-report'}];
    for(const id of ['A','B','P'])person(s,id).learnedProcedures=[];
    s.environment.roles.P={title:profile.officer,basis:'One hired guard asked to check a delivered report of a body.',supports:['Actual presence, retained report and ordinary bodily capacities.'],limits:['No remote knowledge, reinforcements or automatic obedience.']};
    s.environment.roles.D={title:'Watch-record keeper',basis:'Maintained written watch records.',supports:['Prior work with the watch tally.'],limits:['Written accounts can be mistaken or deceptive.']};
    s.environment.roles.S={...s.environment.roles.S,basis:`${namesFor(s).S} handled this court’s stores and written tally.`};
    s.npcKnowledge.P.memory[0].channel='in-person';s.npcKnowledge.P.memory[0].words=`A body believed to be ${profile.victim} was found in the records court.`;
  }
  const culprit=s.actuality.culprit,coats={N:'blue wool',D:'green cotton',S:'red linen'};
  if(!profile.electronic){
    s.patterns.register.text=`Last watch: ${namesFor(s)[culprit]} signed out the records-room service key before the watch tally was closed, and returned it after the disturbance.`;
    s.patterns.clock={...s.patterns.clock,title:'Written watch tally',text:'The watchkeeper’s ink tally places a heavy impact after the second completed entry and before the service key was returned. It records a sequence, not an exact modern minute.'};
    s.patterns.weight.text=`A fresh dent carries ${coats[culprit]}. Its narrow edge matches the visible impression beside ${profile.victim}’s temple. The same fabric is visible on ${namesFor(s)[culprit]}’s coat.`;
    s.patterns.body.text=`There is a single narrow-edged impression beside ${profile.victim}’s temple. A broken lamp and its spilled contents lie beside the body. These marks alone establish neither a culprit nor a precise time of death.`;
    s.patterns.manifest.text=`The stores tally records the brass weight absent during the last watch. ${namesFor(s)[culprit]} countersigned the correction. A countersignature alone does not establish a killing.`;
    s.actuality.at='last watch, between the second tally entry and the key’s return';
    for(const id of NPC_IDS)s.npcKnowledge[id].account=id===culprit?'I was away from the records room before the second tally entry.':'I heard the impact during the interval in the written watch tally.';
    s.actuality.sequence=`${namesFor(s)[culprit]} borrowed the service key, struck ${profile.victim} with the brass weight after the second watch-tally entry, and returned the key afterwards. The fabric caught on the weight; the independently produced written records survived.`;
    if(profile.family==='historical'){
      s.names.noteA='Mara’s writing leaf';s.names.noteB='Jonah’s writing leaf';
      for(const id of ['noteA','noteB','register','clock','manifest']){const f=person(s,id);f.material.rigidity=.45;f.material.fiber=.7;}
    }
  }
  s.originalPatterns=Object.fromEntries(Object.values(s.patterns).filter(p=>p.event).map(p=>[p.root,{...p}]));
  // Setup has no physical progress. Replace modern opening copy before the first
  // prompt, preserving the actual initial incident and each source's provenance.
  s.entries=[];s.serial=0;
  const openings=['The records court has opened for an inquiry. Three witnesses offer competing accounts.','A service key has been returned, a weight is out of place, and the inquiry is about to begin.','The morning watch has ended. Surviving marks and records remain available to both investigators.'];
  entry(s,['A','B'],'opening',`${profile.title}. ${profile.period}. ${openings[recipe.openingIndex]} ${profile.victim} was found dead during the last watch. ${profile.authority}`);
  const leads=recipe.leadOrder?['clock','register']:['register','clock'];
  for(const [i,id] of ['A','B'].entries())entry(s,[id],'private',difficulty.id==='difficult'?'You have prior familiarity with this court and admission to its open records. Establish the sequence from what you can actually encounter.':`Your starting lead is the ${s.patterns[leads[i]].title.toLowerCase()}. It is a lead, not proof. ${difficulty.guided?'Your notebook shows how acquired origins can cover access, means and timeline.':''}`);
  initializeTimedTurns(s);refreshAccess(s);
  if(choice.character)applyCharacter(s,'A',choice.character);
  return s;
}
export function configureCharacter(s,seat,character){applyCharacter(s,seat,character);return true;}
export function confirmSetup(s,seat){
  if(!s.joined)throw new GameError('Invite the second player before confirming the shared setup.',409);
  return confirmCharacter(s,seat);
}
export function configurePractice(s){
  s.practice=true;s.joined=true;
  if(s.setup){applyCharacter(s,'B',{preset:'investigator',name:'Jonah'});s.setup.confirmed.B=true;}
}
export function setupView(s,seat){
  const {recipe,characters,confirmed,...publicSetup}=s.setup;
  return{...publicSetup,profile:environmentById(s.setup.profileId),characters:{[seat]:characters[seat],...(characters[seat==='A'?'B':'A']?{[seat==='A'?'B':'A']:{name:characters[seat==='A'?'B':'A'].name,role:characters[seat==='A'?'B':'A'].role}}:{})},confirmed:{...confirmed},isConfirmed:confirmed[seat]};
}
