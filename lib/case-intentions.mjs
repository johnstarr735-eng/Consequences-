import {awayGoal} from './case-processes.mjs';
import { GameError } from './simulation.mjs';
import { NAMES, namesFor, NPC_IDS, MINUTE, person, visible, reachable, resolveName, inhabitantIds } from './case-world.mjs';
import { maxTravel, distance, reachRadius, formRadius } from '../engine/scene-geometry.js';

const clean = s=>String(s||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();
function lead(text){return text.replace(/^(?:please\s+)?(?:(?:i\s+(?:would like to|want to|try to|am going to|will)|i['’](?:ll|d like to)|can i|let me)\s+|i\s+)?/i,'').replace(/[.!?]+$/,'').trim();}
function socialTarget(s,seat,text){const id=resolveName(s,seat,text);if(!inhabitantIds(s).includes(id))throw new GameError('Address a person you have encountered.');if(id===seat)throw new GameError('Choose another person to address.');return id;}
function task(kind,minutes,extra={}){return {kind,duration:minutes*MINUTE,...extra};}
export function approach(s,seat,target,tight=false){
  const p=person(s,seat),f=person(s,target),direct=visible(s,seat,target),goal=direct?f.pos:p.known.get(target)?.lastPos;
  if(!goal)throw new GameError('You have no encountered position to approach.');
  const stopDistance=tight?Math.min(.74,reachRadius(p)+formRadius(f)-.05):f.kind==='person'?1.2:reachRadius(p)+formRadius(f)-.05;
  const speed=Math.max(.001,maxTravel(p,MINUTE)),gap=Math.max(0,distance(p.pos,goal)-stopDistance);
  return task('move',Math.max(.2,Math.min(20,gap/speed*1.35+1)),{target,goal:{...goal},stopDistance,summary:`Approach ${namesFor(s)[target]}`});
}
export function nearTasks(s,seat,t,noApproach=false){
  const target=t.to||t.target;if(!target||noApproach)return[t];
  const knownPosition=visible(s,seat,target)?person(s,target).pos:person(s,seat).known.get(target)?.lastPos;
  const close=t.to?knownPosition&&distance(person(s,seat).pos,knownPosition)<=1.65:reachable(s,seat,target);
  return close?[t]:[approach(s,seat,target,!!t.target),t];
}

function parseOne(s,seat,raw,noApproach=false){
  const text=canonicalTargetText(s,lead(raw)),planningLimit=s.turn?1440:30;let m;
  if((m=text.match(/^(?:my purpose(?: is)?|purpose)\s*:\s*(.+)$/i))||(m=text.match(/^my purpose is\s+(.+)$/i)))return[task('purpose',.5,{words:clean(m[1]),summary:'Reflect on your present purpose'})];
  if((m=text.match(/^(?:my identity(?: is)?|my account of myself|self account)\s*:\s*(.+)$/i))||(m=text.match(/^(?:my identity is|(?:i )?see myself as)\s+(.+)$/i)))return[task('self_account',.5,{words:clean(m[1]),summary:'Reflect on your account of yourself'})];
  if((m=text.match(/^(?:focus on|attend to|watch)\s+(.+?)(?:\s+for\s+(\d+(?:\.\d+)?)\s+minutes?)?$/i))){const target=resolveName(s,seat,m[1]),minutes=m[2]?Number(m[2]):2;if(minutes<.5||minutes>planningLimit)throw new GameError(`Choose a focus interval between half a minute and ${planningLimit} minutes.`);return[task('focus',minutes,{target,summary:`Attend to ${namesFor(s)[target]} from your present position`})];}
  if((m=text.match(/^introduce myself to\s+(.+?)\s+as\s+(.+)$/i))){const to=socialTarget(s,seat,m[1]);return nearTasks(s,seat,task('introduce',1,{to,words:`I present myself as ${clean(m[2])}`,summary:`Introduce yourself to ${namesFor(s)[to]}`}),noApproach);}
  if((m=text.match(/^(?:switch|turn)\s+(on|off)\s+(.+)$/i))){const target=resolveName(s,seat,m[2]);return nearTasks(s,seat,task('power',.5,{target,powered:m[1].toLowerCase()==='on',summary:`Switch ${namesFor(s)[target]} ${m[1].toLowerCase()}`}),noApproach);}
  if((m=text.match(/^(call|phone|text|sms|message)\s+(.+?)\s*:\s*([\s\S]+)$/i))){
    const to=socialTarget(s,seat,m[2].replace(/\s+(?:online|over the internet)$/i,'')),channel=/call|phone/i.test(m[1])?'voice':/text|sms/i.test(m[1])?'sms':'internet',words=clean(m[3]);
    return[task('transmit',1,{to,channel,words,summary:`${channel==='voice'?'Call':channel==='sms'?'Text':'Message'} ${namesFor(s)[to]}${channel==='internet'?' over the internet':''}`})];
  }
  if((m=text.match(/^(?:text|sms)\s+(.+?)\s+to\s+(.+)$/i))){
    const to=socialTarget(s,seat,m[2]);let carrier;try{carrier=resolveName(s,seat,m[1]);}catch{}
    const discovery=s.discoveries[seat].find(d=>d.root===carrier||d.carrier===carrier||d.title.toLowerCase()===m[1].toLowerCase()||d.root.toLowerCase()===m[1].toLowerCase());
    if(!discovery)throw new GameError('Acquire that record before transmitting its content.');
    return[task('transmit',1,{to,channel:'sms',discovery:{...discovery},summary:`Text ${discovery.title} to ${namesFor(s)[to]}`})];
  }
  if(/^(?:call|phone|text|sms|message)\b/i.test(text))throw new GameError('Include the words to deliver, for example “Call police: Please check on Nell” or “Text Jonah: Meet me at the desk”.');
  if((m=text.match(/^(strangle|choke|throttle|grapple|restrain|hold down|pin down|attack|hit|strike|punch|kick|slap|kill|push|shove|pull)\s+(.+)$/i))){
    const rest=m[2],targetText=rest.split(/\s+(?:with|using|for|until)\s+/i)[0],target=socialTarget(s,seat,targetText),tool=rest.match(/\s+(?:with|using)\s+(.+?)(?:\s+for\s+|$)/i),instrument=tool?resolveName(s,seat,tool[1]):null;
    const effect=/strangle|choke|throttle/i.test(m[1])?'compress':/grapple|restrain|hold|pin/i.test(m[1])?'restrain':'impact';
    const time=rest.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(?:minutes?|mins?)/i),minutes=time?Math.max(.1,Math.min(s.turn?1440:10,Number(time[1]))):/kill/i.test(m[1])?3:1;
    return nearTasks(s,seat,task('contact',minutes,{target,instrument,effect,summary:`Attempt ${m[1].toLowerCase()} contact with ${namesFor(s)[target]}${instrument?` using ${namesFor(s)[instrument]}`:''}; resistance and interruption resolve in the world`}),noApproach);
  }
  if(/^(?:defend myself|guard myself|protect myself|fight back|resist|brace myself)$/i.test(text))return[task('defend',1,{summary:'Guard yourself and resist physical contact'})];
  if((m=text.match(/^(?:help|protect|rescue|aid|save|defend)\s+(.+)$/i))){const target=socialTarget(s,seat,m[1]);return nearTasks(s,seat,task('aid',1,{target,summary:`Try to reach and help ${namesFor(s)[target]}`}),noApproach);}
  if((m=text.match(/^(?:flee|run away|escape|back away|retreat)(?:\s+(?:from|away from))?\s*(.*)$/i))){const recent=s.encounters?.[seat]?.at(-1),target=m[1]?resolveName(s,seat,m[1]):recent?.actor;if(!target)throw new GameError('Which encountered danger are you trying to get away from?');return[task('flee',2,{target,summary:`Try to get away from ${namesFor(s)[target]}`})];}
  if((m=text.match(/^(?:tear up|rip up|tear|rip|break|smash|destroy|crush|damage|erase|rub out|wipe|scratch out|burn|set fire to)\s+(.+)$/i))){const target=resolveName(s,seat,m[1]),kind=/^(?:erase|rub|wipe|scratch)/i.test(text)?'erase':/^(?:burn|set fire)/i.test(text)?'ignite':'damage';return nearTasks(s,seat,task(kind,2,{target,summary:`Attempt a material change to ${namesFor(s)[target]}`}),noApproach);}
  if(/^(?:look(?: around)?|observe(?: the court)?|survey(?: the scene)?|check (?:my )?surroundings)$/i.test(text))return[task('look',.5,{summary:'Observe your surroundings'})];
  if((m=text.match(/^(?:wait|rest|stay(?: here)?)(?:\s+(?:for\s+)?(\d{1,4}(?:\.\d+)?)\s*(?:minutes?|mins?))?$/i))){const minutes=m[1]?Number(m[1]):2;if(minutes<1||minutes>planningLimit)throw new GameError(`Choose a wait between 1 and ${planningLimit} minutes.`);return[task('wait',minutes,{summary:`Wait ${minutes} minutes`})];}
  if((m=text.match(/^(?:walk|move|go|head|approach|follow)(?:\s+(?:over|closer))?(?:\s+(?:to|towards?|over to))?\s+(.+)$/i)))return[approach(s,seat,resolveName(s,seat,m[1]))];
  if((m=text.match(/^(?:read|inspect|examine|search|study|check|look (?:at|over|through)|investigate|take a (?:closer )?look at)\s+(.+)$/i))){
    const timed=m[1].match(/^(.*?)\s+for\s+(\d+(?:\.\d+)?)\s+minutes?$/i),minutes=timed?Number(timed[2]):2;
    if(minutes<.1||minutes>planningLimit)throw new GameError(`Choose an inspection interval between a tenth of a minute and ${planningLimit} minutes.`);
    const target=resolveName(s,seat,timed?timed[1]:m[1]);return nearTasks(s,seat,task('inspect',minutes,{target,summary:`Inspect ${namesFor(s)[target]} for ${minutes} minutes`}),noApproach);
  }
  if((m=text.match(/^(?:take|pick up|collect|grip|carry|lift)\s+(.+)$/i))){const target=resolveName(s,seat,m[1]);return nearTasks(s,seat,task('take',.5,{target,summary:`Try to take ${namesFor(s)[target]}`}),noApproach);}
  if((m=text.match(/^(?:drop|put down|release|set down|leave behind)\s+(.+)$/i)))return[task('drop',.5,{target:resolveName(s,seat,m[1]),summary:'Release the held object'})];
  if((m=text.match(/^(?:write|inscribe|note down)\s+["“]?([\s\S]+?)["”]?\s+on\s+(.+)$/i))){
    const target=resolveName(s,seat,m[2]),words=clean(m[1]).replace(/^[“"]|[”"]$/g,'');
    if(!words||words.length>400)throw new GameError('Write a message of 1–400 characters on an existing surface.');
    return nearTasks(s,seat,task('write',Math.max(1,words.split(/\s+/).length/20),{target,words,summary:`Write on ${namesFor(s)[target]}`}),noApproach);
  }
  if((m=text.match(/^(?:share|show|quote|read out|tell .+? about)\s+(.+?)\s+(?:with|to)\s+(Mara|Jonah|Nell|Ada|Silas|Officer Vale|Vale|police)$/i))){
    const to=socialTarget(s,seat,m[2]);let root;
    try{root=resolveName(s,seat,m[1]);}catch{root=s.discoveries[seat].find(d=>d.title.toLowerCase().includes(m[1].toLowerCase()))?.root;}
    const discovery=s.discoveries[seat].find(d=>d.root===root||d.carrier===root)||s.discoveries[seat].find(d=>d.title.toLowerCase()===m[1].toLowerCase()||d.root.toLowerCase()===m[1].toLowerCase());
    if(!discovery)throw new GameError('You can share a trace only after acquiring its content.');
    return nearTasks(s,seat,task('share',1,{to,discovery:{...discovery},summary:`Share ${discovery.title} with ${namesFor(s)[to]}`}),noApproach);
  }
  if((m=text.match(/^(?:ask|question|interview|speak to|talk to)\s+(Mara|Jonah|Nell|Ada|Silas|Officer Vale|Vale|police)(?:\s+(?:about|regarding|on))?\s*:?\s*([\s\S]*)$/i))){
    const to=socialTarget(s,seat,m[1]),topic=clean(m[2])||'what happened last night';
    return nearTasks(s,seat,task('ask',1.5,{to,words:topic,summary:`Ask ${namesFor(s)[to]} about ${topic}`}),noApproach);
  }
  if((m=text.match(/^(?:confront|challenge)\s+(Nell|Ada|Silas)(?:\s+(?:with|about|over))?\s*([\s\S]*)$/i))){
    const to=socialTarget(s,seat,m[1]);return nearTasks(s,seat,task('confront',2,{to,words:clean(m[2])||'the acquired evidence',summary:`Present your acquired evidence to ${namesFor(s)[to]}`}),noApproach);
  }
  if((m=text.match(/^(?:tell|say to|warn|assure|promise|offer|apologise to|apologize to|retract to)\s+(Mara|Jonah|Nell|Ada|Silas|Officer Vale|Vale|police)\s*(?::|that\b)?\s*([\s\S]+)$/i))){
    const to=socialTarget(s,seat,m[1]),words=clean(m[2]).replace(/^[“"]|[”"]$/g,'');
    const kind=/^(?:promise|offer|assure)/i.test(text)?'promise':/^(?:apolog|retract)/i.test(text)?'retract':'say';
    return nearTasks(s,seat,task(kind,Math.max(1,words.split(/\s+/).length/140),{to,words,summary:`${kind==='promise'?'Offer a commitment to':kind==='retract'?'Retract your accusation before':'Speak to'} ${namesFor(s)[to]}`}),noApproach);
  }
  if((m=text.match(/^(?:offer|promise)\s+(Nell|Ada|Silas)\s+([\s\S]+)$/i))){const to=socialTarget(s,seat,m[1]);return nearTasks(s,seat,task('promise',1,{to,words:clean(m[2]),summary:`Offer a commitment to ${namesFor(s)[to]}`}),noApproach);}
  if((m=text.match(/^(?:file|lodge|submit|present)(?:\s+(?:my|a|the))?(?:\s+(?:case|account|evidence))?\s*(?::|against)?\s*(Nell|Ada|Silas)(?:\s+(?:killed|murdered)\s+Rowan)?$/i))|| (m=text.match(/^(?:accuse|charge)\s+(Nell|Ada|Silas)(?:\s+of\s+(?:killing|murdering)\s+Rowan)?$/i))){
    const accused={nell:'N',ada:'D',silas:'S'}[m[1].toLowerCase()];return nearTasks(s,seat,task('file',3,{target:'cabinet',accused,summary:`Lodge a case naming ${namesFor(s)[accused]}`}),noApproach);
  }
  if(/\b(?:convince|make .+? confess|force .+? to|guarantee|win|everyone believes)\b/i.test(text))throw new GameError('Describe what you attempt or say. Another person’s response and the result cannot be written into your intention.');
  throw new GameError('I could not map that wording to a supported attempt. Try asking someone about a topic, inspecting an object, offering a commitment, taking or releasing an object, writing on paper, sharing a trace, or lodging a case.');
}

export function parseCaseIntention(s,seat,input){
  const prompt=clean(input);if(!prompt||prompt.length>600)throw new GameError('Write one intention, up to 600 characters.');
  const noApproach=/^(?:i\s+)?(?:stay|remain) here and /i.test(prompt);
  const text=noApproach?prompt.replace(/^(?:i\s+)?(?:stay|remain) here and /i,''):prompt;
  const parts=splitImmediatePlan(text);
  if(parts.length>6)throw new GameError('Describe up to six immediate steps. Longer ambitions can continue in later exchanges.');
  let tasks=[];
  for(let i=0;i<parts.length;i++){
    const previous=tasks.at(-1),previousTarget=previous?.to||previous?.target;
    const part=followupPronoun(s,parts[i],previousTarget);
    // A just-completed approach supplies a position attempt, not a guaranteed
    // arrival. The follow-up still needs actual reach/hearing at completion.
    const direct=parseOne(s,seat,part,true),firstTarget=direct[0]?.to||direct[0]?.target;
    const sameApproach=previous?.kind==='move'&&firstTarget===previousTarget;
    const next=noApproach||sameApproach?direct:parseOne(s,seat,part,false);
    tasks.push(...next);
  }
  let offset=0;for(const t of tasks){t.starts=offset;offset+=t.duration;t.ends=offset;}
  if(offset>(s.turn?1440:30)*MINUTE+1e-12)throw new GameError(s.turn?'Describe a supported immediate plan. The turn keeps unfinished activity.':'Describe the immediate part of this plan, within 30 simulated minutes.');
  return {prompt,tasks,duration:offset,summary:tasks.map(t=>t.summary).join(' → ')};
}

export function splitImmediatePlan(text){
  const parts=[];let start=0,quote=null;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quote){if(c===quote&&text[i-1]!=='\\')quote=null;continue;}
    if(c==='"'||c==='“'||c==='«'){quote=c==='“'?'”':c==='«'?'»':'"';continue;}
    const tail=text.slice(i),delimiter=tail.match(/^(?:\s*,?\s+((?:and\s+)?then|and)\s+|;\s*(?:(?:and\s+)?then\s+)?|\n+)/i);
    if(!delimiter)continue;
    const part=text.slice(start,i).trim();
    // Unquoted conjunctions inside words being spoken or written stay content.
    // Explicit "then" and semicolons remain reviewable plan separators.
    if(delimiter[1]?.toLowerCase()==='and'&&/^(?:my purpose\b|purpose\s*:|my identity\b|(?:i )?see myself\b|introduce myself\b)/i.test(lead(part)))continue;
    if(delimiter[1]?.toLowerCase()==='and'&&/^(?:tell|say to|warn|assure|promise|offer|apologise to|apologize to|retract to|write|inscribe|note down|ask|question|interview|speak to|talk to|call|phone|text|sms|message)\b/i.test(lead(part)))continue;
    if(part)parts.push(part);
    i+=delimiter[0].length-1;start=i+1;
  }
  const last=text.slice(start).trim();if(last)parts.push(last);
  if(quote)throw new GameError('Close the quotation around the words you intend to say or write.');
  if(!parts.length)throw new GameError('Describe the immediate action you intend to attempt.');
  return parts;
}

function followupPronoun(s,raw,target){
  let text=lead(raw);
  if(target&&namesFor(s)[target]&&!['A','B',...NPC_IDS].includes(target)&&/^(?:hit|strike|attack|push|restrain|strangle|choke|grapple|kill)\b/i.test(text))text=text.replace(/\b(with|using)\s+it\b/i,`$1 ${namesFor(s)[target]}`);
  const match=text.match(/^((?:ask|question|interview|speak to|talk to|tell|say to|warn|assure|promise|offer|apologise to|apologize to|retract to|confront|challenge|strangle|choke|throttle|grapple|restrain|hold down|pin down|attack|hit|strike|punch|kick|slap|kill|push|shove|pull|help|protect|rescue|aid|save|defend|inspect|examine|read|take|pick up|drop|release|approach|follow|flee from|run away from|tear up|destroy|erase)\s+)(her|him|them|it)(?=\s|:|$)/i);
  if(!match)return text;
  if(!target||!namesFor(s)[target])throw new GameError('Name the person or object you mean. No earlier target makes that reference clear.');
  if(match[2].toLowerCase()!=='it'&&!['A','B',...NPC_IDS].includes(target))throw new GameError('Name the person you mean. The previous target was an object.');
  return text.replace(match[0],match[1]+namesFor(s)[target]);
}

export function previewCase(s,seat,prompt){
  if(s.turn&&/^(?:end turn|pass turn|continue|continue (?:my |existing )?(?:action|activity|journey|plan))$/i.test(String(prompt).trim()))return{summary:/end|pass/i.test(prompt)?'End your turn and pass control':'Continue your existing activity',minutes:/end|pass/i.test(prompt)?0:Math.min(s.turn.reaction?1:15-s.turn.usedMinutes,s.ongoing?.[seat]?.duration/MINUTE||1),steps:[],warning:'Existing progress and the shared world persist.'};
  const intent=parseCaseIntention(s,seat,prompt);
  return{summary:intent.summary,minutes:Math.round(intent.duration/MINUTE*10)/10,
    warning:intent.tasks.some(t=>t.kind==='transmit')?'A handset, a retained contact and a working route are required. Sending, reaching a device, reading and accepting a claim are separate. Outgoing calls can be overheard nearby.':intent.tasks.some(t=>t.kind==='contact')?'This is a harmful physical attempt. Contact, resistance, interruption and bodily condition determine what happens; anyone who encounters it may remember or report it.':intent.tasks.some(t=>t.kind==='move')?'The approach uses your current condition and an encountered position. Contact or changed circumstances can prevent the follow-up.':intent.tasks.some(t=>t.to)?'Nearby listeners may hear delivered words. Private intentions remain private.':null,
    steps:intent.tasks.map(t=>({kind:t.kind,summary:t.summary,minutes:Math.round(t.duration/MINUTE*10)/10}))};
}

function canonicalTargetText(s,text){
  const verbs=/^(?:(?:ask|question|interview|speak to|talk to|tell|say to|warn|assure|promise|offer|apologise to|apologize to|retract to|confront|challenge|call|phone|text|sms|message|introduce myself to|accuse|charge)\s+|(?:file|lodge|submit|present)(?:\s+(?:my|a|the))?(?:\s+(?:case|account|evidence))?\s*(?::|against)?\s+)$/i;
  const ids=['A','B','N','D','S','P'].sort((a,b)=>(namesFor(s)[b]?.length||0)-(namesFor(s)[a]?.length||0));
  for(const id of ids){
    const actual=namesFor(s)[id];if(!actual||actual===NAMES[id])continue;
    const idx=text.toLowerCase().indexOf(actual.toLowerCase());if(idx<0)continue;
    const before=text.slice(0,idx),after=text.slice(idx+actual.length);
    if(after&&!/^[\s:,.!?]/.test(after))continue;
    if(verbs.test(before)||(/^(?:share|show|quote|read out)\b/i.test(text)&&/\b(?:with|to)\s+$/i.test(before)&&!after.trim())){text=before+NAMES[id]+after;break;}
  }
  if(/^(?:file|lodge|submit|present|accuse|charge)\b/i.test(text)&&namesFor(s).body!==NAMES.body){
    const victim=namesFor(s).body,suffix=text.slice(-victim.length);
    if(suffix.toLowerCase()===victim.toLowerCase()&&/\b(?:killed|murdered|killing|murdering)\s+$/i.test(text.slice(0,-victim.length)))text=text.slice(0,-victim.length)+NAMES.body;
  }
  return text;
}
