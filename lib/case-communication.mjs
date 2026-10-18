import { NAMES, namesFor,HUMAN_IDS,NPC_IDS,person,hears,entry,inhabitantIds,nonPlayerIds } from './case-world.mjs';
import {canSpeak} from './case-life.mjs';
export function acquire(s,seat,record,mode,source=null){
  const key=`${record.root}:${record.version||1}`;
  const old=s.discoveries[seat].find(d=>d.key===key);
  if(old){if(mode==='direct'&&old.mode!=='direct'){old.mode='direct';old.source=null;}return false;}
  s.discoveries[seat].push({...record,key,mode,source,acquiredAt:s.world.elapsedDays});return true;
}
export function emit(s,from,to,words,record=null){
  const producer=person(s,from);if(!canSpeak(producer))return[];
  const listeners=inhabitantIds(s).filter(id=>id!==from&&hears(s,from,id));
  const audience=HUMAN_IDS.filter(id=>id===from||listeners.includes(id));
  const signal={id:`speech:${++s.serial}`,producer:from,to,words,at:s.world.elapsedDays,encounteredBy:listeners,root:record?.root||null};s.signals.push(signal);
  if(audience.length)entry(s,audience,'speech',words,{speaker:namesFor(s)[from],addressedTo:namesFor(s)[to],signalId:signal.id});
  for(const id of listeners){
    if(HUMAN_IDS.includes(id)&&record)acquire(s,id,record,'reported',from);
    if(record?.category==='incident'){s.encounters||={};s.encounters[id]||=[];if(!s.encounters[id].some(e=>e.root===record.root))s.encounters[id].push({...record,mode:'reported',source:from});}
    retainWords(s,from,id,words,record,signal.id,'local');
  }
  return listeners;
}

export function retainWords(s,from,to,words,record,signalId,channel='local'){
  if(!nonPlayerIds(s).includes(to))return;
  const k=s.npcKnowledge[to];
  k.memory.push({signal:signalId,from,to,words,root:record?.root||null,at:s.world.elapsedDays,channel});
  if(record?.category==='identity_claim')(k.identityClaims||=[]).push({from,words,source:record.root,at:s.world.elapsedDays,status:'heard'});
  if(record&&['access','means','timeline'].includes(record.category)&&!k.seenRoots.includes(record.root))k.seenRoots.push(record.root);
  for(const subject of NPC_IDS){
    const named=new RegExp(`\\b${namesFor(s)[subject]}\\b`,'i').test(words);
    if(named&&/\b(killed|murdered|killer|guilty)\b/i.test(words)&&!/\b(not|never|without evidence|might|maybe|whether|if|ask)\b/i.test(words)){
      if(k.promises[from]&&!record&&!k.seenRoots.length&&!k.breaches.includes(from)){
        k.breaches.push(from);
        for(const c of s.commitments[from]||[])if(c.to===to&&c.status==='heard')c.status='broken';
      }
    }
  }
}
