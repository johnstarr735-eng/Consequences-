import {completeAgencyTask,hasInspectionAttention,introductionRecord,retainPresentation} from './case-agency.mjs';
import {completeEnvironmentTask,policeReply} from './case-environment.mjs';
import {acquire,emit} from './case-communication.mjs';
import {conscious,bodyState} from './case-life.mjs';
import {completePhysicalTask,recentEncounter} from './case-processes.mjs';
import { createPhysicalCoupling, breakPhysicalCoupling, activeCouplingForAnchor } from '../engine/destiny-v113/destiny_material_dynamics.js';
import { CASE, NAMES, namesFor, HUMAN_IDS, NPC_IDS, person, visible, reachable, hears, observers, entry, nonPlayerIds } from './case-world.mjs';

function event(s,type,details){const e={id:`act:${++s.serial}`,type,at:s.world.elapsedDays,...details};(s.materialActs||=([])).push(e);return e;}
function report(s,npc,topic,text,assertion){
  const r={root:`witness:${npc}:${topic}`,title:`${namesFor(s)[npc]}’s ${topic==='key'?'key':'time'} account`,text,category:topic==='key'?'access':'timeline',version:1,assertion,reportId:`report:${++s.serial}`,carrier:null};
  (s.testimonies||={})[r.reportId]={...r};return r;
}
function reply(s,npc,seat,t){
  if(npc==='P'){policeReply(s,seat);return;}
  const k=s.npcKnowledge[npc],topic=t.words.toLowerCase(),recent=recentEncounter(s,npc),analog=s.setup&&s.setup.profileId!=='port-serein',record=analog?'written watch tally':'signal recorder',time=analog?'the interval between the second tally entry and the key’s return':'20:17';
  if(recent&&/attack|strang|chok|fight|injur|hurt|happened here|just happen|incident|saw|witness/.test(topic)){emit(s,npc,seat,recent.mode==='direct'?recent.text:recent.mode==='heard'?'I heard a disturbance nearby. I did not see who caused it.':`${namesFor(s)[recent.source]||'Someone'} told me: ${recent.text}`,{...recent,mode:undefined});return;}
  if((s.encounters?.[npc]||[]).some(e=>e.actor===seat&&e.target===npc&&e.harmful)){emit(s,npc,seat,'You hurt me. I remember what happened, and I will not continue this conversation as though it did not.');return;}
  if(k.breaches.includes(seat)&&t.kind!=='retract'&&t.kind!=='confront'){
    emit(s,npc,seat,`You asked for my confidence, then made an accusation without showing me its basis. I remember that. Bring something I can examine, or retract it.`);return;
  }
  if(t.kind==='retract'){
    k.breaches=k.breaches.filter(id=>id!==seat);k.lastReaction='retraction heard';
    for(const c of s.commitments[seat])if(c.to===npc&&c.status==='broken')c.status='retracted';
    emit(s,npc,seat,'I heard the retraction. It changes what you have said publicly; it does not erase the earlier words. Ask me something specific.');return;
  }
  if(t.kind==='promise'){
    k.promises[seat]={words:t.words,at:s.world.elapsedDays};
    s.commitments[seat].push({to:npc,name:namesFor(s)[npc],words:t.words,at:s.world.elapsedDays,status:'heard'});
    emit(s,npc,seat,npc==='N'?'Then put evidence before names. I will tell you what I personally remember; your promise remains yours to keep.':npc==='D'?`I will speak, but do not turn a suspicion into my guilt. Check the ${record} against the marks on ${namesFor(s).body}.`:'I will answer a question. A promise is something you may later keep or break, not proof that the night happened your way.');
    return;
  }
  if(t.kind==='confront'){
    const shown=s.discoveries[seat].filter(d=>['access','means','timeline'].includes(d.category)&&d.mode==='direct');
    if(!shown.length){emit(s,npc,seat,'You have not presented an acquired firsthand finding. An accusation does not become stronger because it is repeated.');return;}
    for(const d of shown)emit(s,seat,npc,d.text,d);
    if(k.wasCulprit){emit(s,npc,seat,'I can see what the record says. Handling a key or a weight is not, by itself, an account of the killing. Establish the sequence.');k.lastReaction='confronted with acquired trace';}
    else{emit(s,npc,seat,analog?'That fits the part I remember. Check the watch-tally sequence against the material marks.':'That fits the part I remember. The single clock strike came before the impact; check the time mark against the material marks.');k.lastReaction='corroboration offered';const r=report(s,npc,'time',analog?'I heard the impact during the interval recorded in the watch tally.':'I heard one clock strike, then the impact at the recorded 20:17 time mark.',{event:'prior:impact',time:analog?'watch-sequence':'20:17'});emit(s,npc,seat,r.text,r);}
    return;
  }
  if(/\b(key|register|access|borrow|entry)\b/.test(topic)){
    if(npc==='N'){
      const text=k.wasCulprit?'I did not issue myself the service key last night. You should check the original register before repeating anyone’s account.':`I issued the service key to ${namesFor(s)[k.keyBorrower]}. The register is the written record; inspect it yourself.`;
      const r=report(s,npc,'key',text,{event:'prior:key',actor:k.wasCulprit?null:k.keyBorrower});emit(s,npc,seat,text,r);
    }else emit(s,npc,seat,'Nell keeps the service-key register. I cannot give you firsthand knowledge of a signature I did not see.');
    return;
  }
  if(/\b(weight|weapon|coat|fibre|fiber|mark|injur|body|rowan)\b/.test(topic)){
    emit(s,npc,seat,npc==='S'?'The brass weight was out of its place. It is in the north court now. Examine the edge and what is caught on it.':`You can inspect the visible marks on ${namesFor(s).body} and compare them with the brass weight. My interpretation should not replace your own encounter.`);return;
  }
  if(/\b(time|clock|signal|record|watch|tally|sequence|alibi|night|happen|when|where|hear)\b/.test(topic)){
    const text=analog?(k.wasCulprit?'I was away from the records room before the second tally entry. That is my account.':'I heard the impact during the interval in the written watch tally. Inspect the tally to check the recorded sequence.'):(k.wasCulprit?'I was away from the map room before the clock struck. That is my account.':'I heard one clock strike, then a heavy impact. The signal recorder should let you check the 20:17 mark.');
    const r=report(s,npc,'time',text,{event:'prior:impact',time:k.wasCulprit?'claimed-earlier':analog?'watch-sequence':'20:17'});emit(s,npc,seat,text,r);return;
  }
  if(t.kind==='say'||t.kind==='share'||t.kind==='introduce'){emit(s,npc,seat,'I heard you. I will keep what you said separate from what I witnessed. Ask me about the key, the time, or the material marks.');return;}
  if(t.dialogueReply){emit(s,npc,seat,t.dialogueReply);return;}
  emit(s,npc,seat,'Ask me about a part of the night I could have encountered: the service key, the clock, or the marks. I cannot give you everyone else’s experience.');
}

export function completeTask(s,seat,t){
  const p=person(s,seat);if(!conscious(p)){entry(s,[seat],'consequence','Your bodily condition prevents this attempt.');return false;}
  if(completeAgencyTask(s,seat,t))return false;
  if(completeEnvironmentTask(s,seat,t))return false;
  if(completePhysicalTask(s,seat,t))return false;
  if(t.kind==='move')return false;
  if(t.kind==='look'){entry(s,[seat],'observation','You take stock of the court. The surroundings show current access; known places preserve earlier encounters. A remembered position can be out of date.');return false;}
  if(t.kind==='wait'){entry(s,[seat],'consequence','You let time pass. Other inhabitants retain their own histories and concerns; waiting replenishes neither water nor energy.');return false;}
  if(t.kind==='inspect'){
    if(!reachable(s,seat,t.target)||!hasInspectionAttention(s,seat,t)){entry(s,[seat],'consequence',`You cannot inspect ${namesFor(s)[t.target]} closely enough with sustained attention under the present conditions. No contents were acquired.`);return false;}
    const inspected=person(s,t.target);if(inspected?.kind==='person'){const status=bodyState(inspected);const text=`${namesFor(s)[t.target]} is ${status}. Their observable condition does not by itself establish who caused it.`;acquire(s,seat,{root:`condition:${t.target}:${status}`,version:1,title:`${namesFor(s)[t.target]}’s observable condition`,text,category:'incident'},'direct');entry(s,[seat],'observation',text);return false;}
    if(person(s,t.target)?.material?.patternDestroyed){entry(s,[seat],'observation','The surface remains, but its inscription is no longer readable. Earlier acquired records are separate memories.');return false;}
    const pat=s.patterns[t.target];
    if(!pat){entry(s,[seat],'observation',`${namesFor(s)[t.target]} has a material presence here, but this inspection yields no readable trace.`);return false;}
    if(!p.learnedScripts?.includes('archive-en')){entry(s,[seat],'consequence','You encounter the surface but cannot read this script. No contents were acquired.');return false;}
    const added=acquire(s,seat,{...pat,carrier:t.target},'direct');
    entry(s,[seat],added?'discovery':'observation',added?pat.text:'You revisit the same trace. Repetition supplies no new independent origin.',{title:pat.title,root:pat.root});
    const audience=observers(s,seat);if(audience.length)entry(s,audience,'observation',`${namesFor(s)[seat]} examines ${namesFor(s)[t.target]}. You witness the act, rather than acquiring its content.`);
    event(s,'trace_encounter',{actor:seat,carrier:t.target,root:pat.root,version:pat.version});return false;
  }
  if(t.kind==='take'){
    if(t.contested){entry(s,[seat],'consequence','Both attempts reach this object at the same time. Neither establishes an uncontested grip; the object remains available to the encounter.');return false;}
    if(!reachable(s,seat,t.target)){entry(s,[seat],'consequence','The material is not within your actual reach. Nothing is taken.');return false;}
    const c=createPhysicalCoupling(s.world,seat,t.target,{reason:'controlled_manipulation'});
    if(!c){entry(s,[seat],'consequence',`You cannot establish a manageable grip on ${namesFor(s)[t.target]}. Its load, another coupling or your capacities constrain the attempt.`);return false;}
    event(s,'material_coupling_open',{actor:seat,material:t.target,coupling:c.id});entry(s,[seat,...observers(s,seat)],'consequence',`${namesFor(s)[seat]} establishes a grip on ${namesFor(s)[t.target]}. It remains the same finite material object.`);return false;
  }
  if(t.kind==='drop'){
    const c=s.world.materialCouplings.get(t.target);
    if(c?.anchor!==seat){entry(s,[seat],'consequence','You are not holding that object.');return false;}
    const released=breakPhysicalCoupling(s.world,t.target,'controlled_release');
    entry(s,released?[seat,...observers(s,seat)]:[seat],'consequence',released?`${namesFor(s)[seat]} releases ${namesFor(s)[t.target]} at an admissible nearby position.`:'There is no clear material position for a release yet. The coupling remains.');
    if(released)event(s,'material_coupling_break',{actor:seat,material:t.target,release:released.release});return false;
  }
  if(t.kind==='write'){
    const surface=person(s,t.target),pen=person(s,seat==='A'?'penA':'penB'),ink=t.words.split(/\s+/).length*.00005;
    if(!reachable(s,seat,t.target)||!pen?.alive||!reachable(s,seat,pen.id)||surface.material.surfaceInkAffinity<.3||pen.material.ink<ink||p.capacities.manipulation<.3||p.body.energy<.05){entry(s,[seat],'consequence','Writing needs a reachable receptive surface, your existing pen with enough ink, and bodily support. Those conditions are not all present.');return false;}
    const before=pen.material.stock+surface.material.stock;
    pen.material.ink-=ink;pen.material.stock-=ink;surface.material.stock+=ink;p.body.energy=Math.max(0,p.body.energy-ink*.2);
    const version=(s.patterns[t.target]?.version||0)+1;
    const pat={root:`inscription:${t.target}:${version}`,title:`Writing on ${namesFor(s)[t.target]}`,text:t.words,category:'statement',version,event:null,producer:seat};
    s.patterns[t.target]=pat;acquire(s,seat,{...pat,carrier:t.target},'direct');
    event(s,'surface_pattern_produced',{actor:seat,source:pen.id,target:t.target,inkTransferred:ink,stockBefore:before,stockAfter:pen.material.stock+surface.material.stock});
    entry(s,[seat],'discovery',t.words,{title:pat.title,root:pat.root});const audience=observers(s,seat);if(audience.length)entry(s,audience,'observation',`${namesFor(s)[seat]} writes on ${namesFor(s)[t.target]}. The words are not automatically available at your distance.`);return false;
  }
  if(t.kind==='file')return lodgeCase(s,seat,t.accused);
  if(t.to){
    const words=t.kind==='share'?t.discovery.text:t.kind==='ask'?`I ask ${namesFor(s)[t.to]} about ${t.words}.`:t.kind==='confront'?`I want to compare your account with the evidence I acquired.`:t.words;
    const record=t.kind==='introduce'?introductionRecord(s,seat,words):t.kind==='share'?t.discovery:null;
    const listeners=emit(s,seat,t.to,words,record);
    if(t.kind==='introduce')retainPresentation(s,seat,t.to,record,listeners.includes(t.to));
    if(!listeners.includes(t.to)){entry(s,[seat],'consequence',`${namesFor(s)[t.to]} cannot hear this attempt. An intended listener is not the same as a reached listener.`);return false;}
    if(nonPlayerIds(s).includes(t.to))reply(s,t.to,seat,t);return false;
  }
  return false;
}

export function proofFor(s,seat,accused){
  const valid=[];
  for(const d of s.discoveries[seat]){
    const original=s.originalPatterns[d.root];
    if(original&&d.version===original.version&&d.text===original.text&&original.supports===accused)valid.push(d);
    else if(d.reportId){
      const r=s.testimonies?.[d.reportId];
      if(r&&r.text===d.text&&r.assertion?.event==='prior:key'&&r.assertion.actor===accused)valid.push(d);
      else if(r&&r.text===d.text&&r.assertion?.event==='prior:impact'&&r.assertion.time===(s.setup&&s.setup.profileId!=='port-serein'?'watch-sequence':'20:17'))valid.push(d);
    }
  }
  const roots=new Set(valid.map(d=>d.root)),categories=new Set(valid.map(d=>d.category));
  return{valid,roots,categories,direct:valid.filter(d=>d.mode==='direct').length,
    complete:accused===s.actuality.culprit&&roots.size>=3&&['access','means','timeline'].every(c=>categories.has(c))&&valid.filter(d=>d.mode==='direct').length>=2};
}
function lodgeCase(s,seat,accused){
  if(!reachable(s,seat,'cabinet')){entry(s,[seat],'consequence','You have not reached the case desk. No case has been lodged.');return false;}
  const proof=proofFor(s,seat,accused);event(s,'case_lodged',{actor:seat,accused,roots:[...proof.roots],accepted:proof.complete});
  if(!proof.complete){entry(s,[seat],'consequence','The case is not established. The named person, the original trace origins, firsthand acquisitions and the supported sequence must meet the published standard. A plausible allegation is insufficient.');return false;}
  entry(s,HUMAN_IDS,'verdict',`${namesFor(s)[seat]} establishes a supported case: ${namesFor(s)[accused]} killed ${namesFor(s).body} with the brass weight. The case connects access, the material marks and the recorded timeline.`,{actor:seat});return true;
}

export function carried(s,seat){return activeCouplingForAnchor(s.world,seat).map(c=>({id:c.material,name:namesFor(s)[c.material]||c.material}));}
