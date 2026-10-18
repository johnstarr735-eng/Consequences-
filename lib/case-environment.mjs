import { Form } from '../engine/destiny-v113/destiny_unified_kernel.js';
import { createPhysicalCoupling } from '../engine/destiny-v113/destiny_material_dynamics.js';
import { distance } from '../engine/scene-geometry.js';
import { NAMES, namesFor, MINUTE, HUMAN_IDS, person, visible, reachable, hears, entry } from './case-world.mjs';
import { conscious, canSpeak } from './case-life.mjs';
import { acquire, emit, retainWords } from './case-communication.mjs';

// Scenario conditions and bounded app processes, not new sovereign Field laws.
// Device rates, coverage and dispatch policy are game calibrations; see docs/SOCIAL_ENVIRONMENT.md.
export const ROLE_HISTORIES = {
  A: { title:'Appointed inquiry researcher', basis:'The civic inquiry invited you to examine the open records and lodge an account.', supports:['You can read the archive script and operate your handset.','You know Nell from an earlier archive visit.'], limits:['Your appointment grants no power to detain people or compel a reply.'] },
  B: { title:'Independent local reporter', basis:'You have visited the observatory before; the inquiry admitted you to the same open evidence.', supports:['You can read the archive script and operate your handset.','You know Ada from an earlier visit to the signal room.'], limits:['Your press role supplies neither confidential records nor another person’s trust.'] },
  N: { title:'Records custodian', basis:'Nell issued the service keys and maintained the register.', supports:['Retained experience of issuing the key.'], limits:['A remembered account can still differ from the surviving record.'] },
  D: { title:'Signal technician', basis:'Ada worked with the observatory’s recorder and communications equipment.', supports:['Familiarity with the signal log and its location.'], limits:['Technical familiarity supplies no remote access to someone else’s handset.'] },
  S: { title:'Stores porter', basis:'Silas handled observatory stores and the cargo tally.', supports:['Familiarity with the stores and the weight’s usual place.'], limits:['Handling stores does not establish involvement in the killing.'] },
  P: { title:'Local duty officer', basis:'Officer Vale was assigned to check Nell’s report of a body and met both investigators at the entrance.', supports:['One body, a working duty handset, and the reports actually received.'], limits:['No automatic knowledge, reinforcements, search result or compelled confession.'] },
};

export function initializeEnvironment(s) {
  const p=person(s,'P');
  s.npcKnowledge.P={goal:'check received reports and interrupt encountered harm',memory:[],promises:{},breaches:[],seenRoots:[],lastReaction:null};
  const initialReport={id:'prior:body-report',from:'N',to:'P',words:'A body has been found in the observatory court. It appears to be Rowan.',at:s.startedAt-15*MINUTE,channel:'voice',root:null};
  s.npcKnowledge.P.memory.push(initialReport);
  s.environment={
    version:1,id:'port-serein-2026',place:'Port Serein · harbour observatory',region:'Fictional coastal municipality',date:'2026-10-17',startsAt:'12:00',
    publicContext:[
      'An ordinary civilian municipality. The observatory has opened its court and listed evidence to the afternoon inquiry.',
      'At the opening, one local officer is at the entrance checking a report of Rowan’s body. No secret police or military unit is operating in this case.',
      'Mobile voice, SMS and mobile data are available. Observatory WiFi needs the local router, mains power and an internet uplink.',
      'Nell keeps records, Ada maintains the signals, and Silas handles stores. Their work gives different histories of the same place.',
    ],
    institutions:[{id:'local-police',name:'Local civic police',members:['P'],mandate:'Check reports and respond to encountered immediate harm',jurisdiction:'Observatory and town',equipment:['phoneP'],origin:initialReport.id}],
    infrastructure:{cellularVoice:true,cellularSMS:true,cellularData:true,internetUplink:true,mainsPower:true,router:'router',wifiRadius:3.2},
    roles:JSON.parse(JSON.stringify(ROLE_HISTORIES)),devices:{},messages:[],police:{processed:[initialReport.id],assignment:{source:initialReport.id,from:'N',target:'body',lastPos:{...person(s,'body').pos},words:initialReport.words,status:'checking'},checks:[]},
  };
  for(const id of ['A','B','P']){
    const owner=person(s,id),phoneId=`phone${id}`,pos={x:owner.pos.x+.34,y:owner.pos.y};
    s.world.add(new Form(phoneId,{pos,stock:.018,rigidity:.55,hardness:.35,mineral:.7,visibility:.9}));
    createPhysicalCoupling(s.world,id,phoneId,{reason:'prior_carried_handset'});
    s.environment.devices[phoneId]={owner:id,unlockedFor:[id],battery:.85,powered:true,contacts:Object.fromEntries(['A','B','P'].filter(other=>other!==id).map(other=>[other,`phone${other}`])),wifiJoined:true,inbox:[]};
    owner.learnedProcedures=['handset'];
  }
  s.world.add(new Form('router',{pos:{x:7.15,y:1.4},stock:.045,rigidity:.5,hardness:.3,mineral:.65,visibility:.9}));
  s.environment.routerPowered=true;
  // Prior introductions carry known locations/contact details; they do not disclose private contents.
  for(const id of ['A','B','N','D','S','P'])for(const target of ['P','phoneA','phoneB','phoneP','router']){
    if(target===id)continue;const f=person(s,target);
    person(s,id).known.set(target,{confidence:.65,direct:false,source:'entrance_briefing',clock:s.world.clock,lastPos:{...f.pos}});
  }
  for(const id of ['A','B','N','D','S'])p.known.set(id,{confidence:.65,direct:false,source:'entrance_briefing',clock:s.world.clock,lastPos:{...person(s,id).pos}});
  p.known.set('body',{confidence:.55,direct:false,source:initialReport.id,clock:s.world.clock,lastPos:{...person(s,'body').pos}});
  entry(s,HUMAN_IDS,'opening','Port Serein, 17 October 2026, noon. Nell reported a body fifteen minutes ago. Officer Vale is at the entrance to check that report; no allegation about the killer has been delivered to the officer. Both investigators have a charged handset and each other’s number, plus the local duty line.');
}

function supported(s,id){const f=person(s,id);return !!(f?.alive&&f.material.integrity>.6&&!f.material.patternDestroyed);}
function powered(s,id){const d=s.environment?.devices[id];return !!(d?.powered&&d.battery>0&&supported(s,id));}
function controlled(s,who,id){return s.world.materialCouplings?.get(id)?.anchor===who&&s.environment.devices[id]?.unlockedFor.includes(who);}
export function usableHandset(s,who){return Object.keys(s.environment?.devices||{}).find(id=>powered(s,id)&&controlled(s,who,id));}
function wifiAvailable(s,phoneId){
  const e=s.environment,i=e.infrastructure;
  return e.devices[phoneId].wifiJoined&&i.mainsPower&&e.routerPowered&&supported(s,i.router)&&distance(person(s,phoneId).pos,person(s,i.router).pos)<=i.wifiRadius;
}
function channelAvailable(s,phoneId,channel){
  const i=s.environment.infrastructure;
  return channel==='voice'?i.cellularVoice:channel==='sms'?i.cellularSMS:(i.cellularData||(i.internetUplink&&wifiAvailable(s,phoneId)));
}
function deviceForRecipient(s,fromPhone,to){return s.environment.devices[fromPhone].contacts[to];}

export function completeEnvironmentTask(s,seat,t){
  if(t.kind==='power'){
    const device=s.environment?.devices[t.target],router=s.environment?.infrastructure.router===t.target;
    if(!device&&!router){entry(s,[seat],'consequence','There is no encountered power control for that object.');return true;}
    if(!reachable(s,seat,t.target)||(person(s,seat).capacities.manipulation||0)<.3){entry(s,[seat],'consequence','You cannot reach and operate that power control.');return true;}
    if(device)device.powered=t.powered;else s.environment.routerPowered=t.powered;
    entry(s,[seat],'consequence',`You switch ${namesFor(s)[t.target]} ${t.powered?'on':'off'}. Its material condition and supporting connections still matter.`);return true;
  }
  if(t.kind!=='transmit')return false;
  const phone=usableHandset(s,seat),p=person(s,seat);
  if(!phone||!p.learnedProcedures?.includes('handset')||(p.capacities.manipulation||0)<.3||(t.channel==='voice'&&!canSpeak(p))){entry(s,[seat],'consequence','This attempt needs a charged, working handset in your control, access to its controls, and the capacity to use it. A voice call also needs speech.');return true;}
  const recipientPhone=deviceForRecipient(s,phone,t.to);
  if(!recipientPhone){entry(s,[seat],'consequence',`You have no retained handset address for ${namesFor(s)[t.to]}. Knowing a person’s name supplies no connection.`);return true;}
  if(!channelAvailable(s,phone,t.channel)){entry(s,[seat],'consequence',`The ${t.channel==='voice'?'mobile voice':t.channel==='sms'?'SMS':'internet'} route is unavailable here. Nothing was transmitted by that route.`);return true;}
  const words=t.discovery?.text||t.words,id=`message:${++s.serial}`;
  s.environment.devices[phone].battery=Math.max(0,s.environment.devices[phone].battery-(t.channel==='voice'?.003:.001));
  const m={id,from:seat,to:t.to,fromPhone:phone,toPhone:recipientPhone,words,record:t.discovery?{...t.discovery}:null,channel:t.channel,sentAt:s.world.elapsedDays,arrivesAt:s.world.elapsedDays+.5*MINUTE,status:'in-transit',readAt:null};
  s.environment.messages.push(m);
  if(t.channel==='voice')emit(s,seat,t.to,words,t.discovery||null);
  entry(s,[seat],'consequence',`${t.channel==='voice'?'You place a call':t.channel==='sms'?'You send a text':'You send an internet message'} to ${namesFor(s)[t.to]}. Sending does not establish delivery or a reply.`);return true;
}

function readMessage(s,m){
  const p=person(s,m.to);
  if(!conscious(p)||!powered(s,m.toPhone)||!controlled(s,m.to,m.toPhone)||!p.learnedProcedures?.includes('handset')||!(p.apparatus?.receptor>.1))return false;
  if(m.channel!=='voice'&&!p.learnedScripts?.includes('archive-en'))return false;
  if(treatAsVoice(m)&&(!hearsOwnHandset(s,m.to,m.toPhone)||!(p.capacities.manipulation>.3)))return false;
  m.readAt=s.world.elapsedDays;
  retainWords(s,m.from,m.to,m.words,m.record,m.id,m.channel);
  if(HUMAN_IDS.includes(m.to)){
    if(m.record)acquire(s,m.to,m.record,'reported',m.from);
    else acquire(s,m.to,{root:m.id,version:1,title:`${namesFor(s)[m.from]}’s ${m.channel==='voice'?'call':'message'}`,text:m.words,category:'statement'},'reported',m.from);
    entry(s,[m.to],'speech',m.words,{speaker:namesFor(s)[m.from],addressedTo:namesFor(s)[m.to],signalId:m.id,channel:m.channel});
  }
  return true;
}
const treatAsVoice=m=>m.channel==='voice';
const hearsOwnHandset=(s,id,phone)=>person(s,id).apparatus?.receptor>.1&&distance(person(s,id).pos,person(s,phone).pos)<1;

export function nextMessageAt(s){return Math.min(Infinity,...(s.environment?.messages||[]).filter(m=>m.status==='in-transit').map(m=>m.arrivesAt));}
export function advanceEnvironment(s,dtDays=0){
  const e=s.environment;if(!e)return;
  for(const d of Object.values(e.devices))if(d.powered)d.battery=Math.max(0,d.battery-dtDays/MINUTE*.00015);
  for(const m of e.messages){
    if(m.status==='in-transit'&&m.arrivesAt<=s.world.elapsedDays+1e-11){
      if(!powered(s,m.toPhone)||!channelAvailable(s,m.toPhone,m.channel)||(m.channel==='voice'&&(!powered(s,m.fromPhone)||!channelAvailable(s,m.fromPhone,m.channel)))){
        m.status='failed';entry(s,[m.from],'consequence',`The ${m.channel==='voice'?'call':'message'} to ${namesFor(s)[m.to]} did not reach the receiving handset. The receiving device or connection was unavailable.`);continue;
      }
      m.status='delivered';m.deliveredAt=s.world.elapsedDays;e.devices[m.toPhone].inbox.push(m.id);
      if(m.channel==='voice'){
        if(!readMessage(s,m)){m.status='missed';entry(s,[m.from],'consequence',`The call reached ${namesFor(s)[m.to]}’s handset but was not answered. No words were acquired through it.`);}
        else entry(s,[m.from],'consequence',`The call connects to ${namesFor(s)[m.to]}; you deliver your words. This establishes neither agreement nor the truth of a claim.`);
      }else entry(s,[m.from],'consequence',`The message reached ${namesFor(s)[m.to]}’s handset. This receipt does not tell you whether the person read or accepted it.`);
    }
    if(m.status==='delivered'&&!m.readAt)readMessage(s,m);
  }
  updatePolice(s);
}

function updatePolice(s){
  const police=s.environment.police,p=person(s,'P');
  if(!conscious(p))return;
  // A report produces a task to check, not a true crime, a location oracle, or a sentence.
  for(const m of s.npcKnowledge.P.memory){
    if(police.processed.includes(m.signal||m.id))continue;police.processed.push(m.signal||m.id);
    if(!/\b(help|hurt|injur\w*|attack\w*|danger|threat\w*|strang\w*|chok\w*|body|dead|check)\b/i.test(m.words))continue;
    const named=['N','D','S','A','B'].map(id=>({id,index:m.words.search(new RegExp(`\\b${namesFor(s)[id]}\\b`,'i'))})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index)[0]?.id;
    const target=named||m.from,known=p.known.get(target);
    if(!known?.lastPos)continue;
    police.assignment={source:m.signal||m.id,from:m.from,target,lastPos:{...known.lastPos},words:m.words,status:'checking'};
  }
  const a=police.assignment;if(!a||a.status!=='checking')return;
  if(visible(s,'P',a.target))a.lastPos={...person(s,a.target).pos};
  if(distance(p.pos,a.lastPos)<=1.35){
    a.status='checked';police.checks.push({source:a.source,target:a.target,at:s.world.elapsedDays,encountered:visible(s,'P',a.target)});
    emit(s,'P',a.from,'I have reached the reported area. I will separate what was reported from what I can encounter here. A name in a report does not establish guilt.');
  }
}

export function policeMovement(s){
  const a=s.environment?.police.assignment;
  return a?.status==='checking'?{kind:'move',target:a.target,goal:{...a.lastPos},stopDistance:1.2}:null;
}
export function policeReply(s,seat){
  const k=s.npcKnowledge.P,received=k.memory.filter(m=>m.from===seat);
  emit(s,'P',seat,received.length?`I have received your words. I can check a report; an allegation does not establish who killed ${namesFor(s).body}. The inquiry still needs its published evidence.`:`${namesFor(s).N} reported a body. That report did not identify a killer. I can check reports and respond to what I encounter, using the people and equipment actually here.`);
}

export function environmentView(s,seat){
  const e=s.environment;if(!e)return null;
  const role=e.roles[seat],aware=conscious(person(s,seat))&&person(s,seat).apparatus.receptor>.1,phone=aware?usableHandset(s,seat):null;
  const ownPhones=Object.entries(e.devices).filter(([id,d])=>d.owner===seat||controlled(s,seat,id)).map(([id,d])=>({id,name:namesFor(s)[id],battery:aware&&controlled(s,seat,id)?Math.round(d.battery*100):null,inControl:controlled(s,seat,id),working:aware&&controlled(s,seat,id)?powered(s,id):null}));
  return {place:e.place,region:e.region,date:e.date,context:[...e.publicContext],role:{title:role.title,basis:role.basis,experience:[...role.supports],limits:[...role.limits]},
    people:['N','D','S','P'].filter(id=>person(s,seat).known.has(id)).map(id=>({name:namesFor(s)[id],role:e.roles[id].title,basis:e.roles[id].basis})),
    handsets:ownPhones,channels:phone?{voice:channelAvailable(s,phone,'voice'),sms:channelAvailable(s,phone,'sms'),internet:channelAvailable(s,phone,'internet'),wifi:wifiAvailable(s,phone)}:null,
    contacts:phone?Object.keys(e.devices[phone].contacts).map(id=>({name:namesFor(s)[id]})):[],
    messages:e.messages.filter(m=>m.from===seat||m.to===seat&&m.readAt).map(m=>({id:m.id,direction:m.from===seat?'sent':'received',name:namesFor(s)[m.from===seat?m.to:m.from],channel:m.channel,words:m.words,status:m.from===seat?(!phone?'Sent':m.status==='delivered'?'Reached handset':m.status==='missed'?'Unanswered':m.status==='failed'?'Failed':'In transit'):'Received'}))};
}
