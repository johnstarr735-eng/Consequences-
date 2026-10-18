import {advanceAttention,agencyView} from './case-agency.mjs';
import {advanceEnvironment,nextMessageAt,policeMovement,environmentView} from './case-environment.mjs';
import {conscious,bodyState} from './case-life.mjs';
import {advancePhysicalInterval,preparePhysicalInterval,physicalOrientation,npcOrientation,reportEncounters} from './case-processes.mjs';
import { integrationStep } from '../engine/controlled-moment-engine.js';
import { distance } from '../engine/scene-geometry.js';
import { CASE, NAMES, namesFor, MINUTE, HUMAN_IDS, NPC_IDS, createCaseState, person, visible, reachable, hears, observers, entry, nonPlayerIds } from './case-world.mjs';
import { parseCaseIntention, previewCase } from './case-intentions.mjs';
import { completeTask, carried } from './case-interactions.mjs';
import { navigationOrientation } from './case-navigation.mjs';
import { GameError } from './simulation.mjs';
import {commitTimed,settleTimedIncapacity,timedTurnView} from './case-time-turns.mjs';
import {setupView} from './game-setup.mjs';

export { createCaseState, previewCase };
export function expectedSeat(s){if(s.turn)return s.turn.reaction?.seat||s.turn.seat;const first=s.exchange%2?'A':'B';return s.pending[first]?(first==='A'?'B':'A'):first;}
function taskAt(intent,t){return intent.tasks.find(a=>a.starts<=t+1e-12&&a.ends>t+1e-12);}

export function resolveCaseExchange(s,{maxStepMinutes=1,durationLimit=Infinity,beforeFrame=null,afterFrame=null,progress=null,submittedBy=null}={}){
  if(!s.pending.A||!s.pending.B||s.result)throw new GameError('Both contributions are required.',409);
  const pair={A:s.pending.A.intent,B:s.pending.B.intent},start=s.world.elapsedDays,deadline=s.setup?.deadlineMinutes||180,stop=Math.min(durationLimit,Math.max(pair.A.duration,pair.B.duration),Math.max(0,s.startedAt+deadline*MINUTE-start));
  advanceEnvironment(s,0);
  const taskOrigins=new Map();
  const completed=new Set(),wins=[];let t=0,kernelEvents=0,localMoments=0;
  while(t<stop-1e-11){
    const nextEnd=Math.min(...HUMAN_IDS.flatMap(id=>pair[id].tasks.map((a,i)=>completed.has(`${id}:${i}`)?Infinity:a.ends)));
    const tasks=Object.fromEntries(HUMAN_IDS.map(id=>[id,taskAt(pair[id],t)]));
    if(beforeFrame?.({tasks,t,pair}))break;
    for(const id of HUMAN_IDS){const a=tasks[id];if(a?.kind==='move'){const key=`${id}:${pair[id].tasks.indexOf(a)}`;if(!taskOrigins.has(key))taskOrigins.set(key,{...person(s,id).pos});}}
    const physical=HUMAN_IDS.some(id=>['contact','flee','aid','defend'].includes(tasks[id]?.kind))||HUMAN_IDS.some(id=>person(s,id)?.sceneBody?.conscious===false);
    const moving=physical||HUMAN_IDS.some(id=>tasks[id]?.kind==='move')||nonPlayerIds(s).some(id=>s.npcKnowledge[id].breaches.length)||!!policeMovement(s)||nextMessageAt(s)<Infinity;
    const next=Math.min(stop,nextEnd,nextMessageAt(s)-start,moving?t+Math.min(maxStepMinutes,1)*MINUTE:stop);
    const orientations=new Map();
    for(const id of HUMAN_IDS){
      const a=taskAt(pair[id],t);
      const orientation=conscious(person(s,id))?(a?.kind==='move'?navigationOrientation(s,id,a):physicalOrientation(s,id,a)):{goal:null,stopDistance:0};
      if(a?.kind==='move'&&orientation.goal){orientation.representedTarget=a.target;orientation.intendedDistance=a.stopDistance;}
      orientations.set(id,orientation);
    }
    for(const id of nonPlayerIds(s)){const reactive=npcOrientation(s,id),civic=id==='P'?policeMovement(s):null;orientations.set(id,reactive.goal||!civic?reactive:navigationOrientation(s,id,civic));}
    advancePhysicalInterval(s,tasks,next-t);
    for(const id of HUMAN_IDS)advanceAttention(s,id,tasks[id],next-t);
    const restoreMobility=preparePhysicalInterval(s,tasks);
    s.world._playerOrientations=orientations;
    const r=integrationStep(s.world,{dtDays:next-t});delete s.world._playerOrientations;restoreMobility();
    kernelEvents+=r.events.length;localMoments+=r.moments.length;advanceEnvironment(s,next-t);t=next;
    // Equal-time attempts at the same material do not acquire it by seat order.
    const dueTakes=HUMAN_IDS.flatMap(id=>pair[id].tasks.filter((a,i)=>a.kind==='take'&&!completed.has(`${id}:${i}`)&&a.ends<=t+1e-11).map(a=>({id,a})));
    for(const take of dueTakes)if(dueTakes.some(other=>other.id!==take.id&&other.a.target===take.a.target&&Math.abs(other.a.ends-take.a.ends)<1e-10&&reachable(s,take.id,take.a.target)&&reachable(s,other.id,other.a.target)))take.a.contested=true;
    for(const id of HUMAN_IDS)for(let i=0;i<pair[id].tasks.length;i++){
      const a=pair[id].tasks[i],key=`${id}:${i}`;
      if(!completed.has(key)&&a.ends<=t+1e-11){
        completed.add(key);
        if(a.kind==='move'){
          const moved=distance(taskOrigins.get(key)||person(s,id).pos,person(s,id).pos)>.005;
          entry(s,[id],'consequence',moved?`You cross part of the court toward ${namesFor(s)[a.target]}. Your next attempt depends on the position you actually reached.`:`Your approach to ${namesFor(s)[a.target]} makes no further progress. Your next attempt depends on where you actually are.`);
          const seen=observers(s,id);if(moved&&seen.length)entry(s,seen,'observation',`${namesFor(s)[id]} changes position in the court. You do not receive their private plan.`);
        }else if(completeTask(s,id,a))wins.push({seat:id,at:s.world.elapsedDays});
      }
    }
    if(wins.length||afterFrame?.({tasks,t,pair,completed}))break;
  }
  reportEncounters(s);
  s.history.push({exchange:s.exchange,durationDays:s.world.elapsedDays-start,kernelEvents,localMoments,...(submittedBy?{submittedBy}:{}),A:{requestId:s.pending.A.requestId,prompt:pair.A.prompt,summary:pair.A.summary},B:{requestId:s.pending.B.requestId,prompt:pair.B.prompt,summary:pair.B.summary}});
  if(wins.length){const earliest=Math.min(...wins.map(x=>x.at)),winners=wins.filter(x=>Math.abs(x.at-earliest)<1e-10).map(x=>x.seat);s.result={winners,reason:winners.length===2?'Both cases were established at the same in-world time.':`${namesFor(s)[winners[0]]} established the first supported case.`,exchange:s.exchange,ending:'established'};}
  else if((!s.turn&&s.exchange>=CASE.maxExchanges)||s.world.elapsedDays-s.startedAt>=deadline*MINUTE-1e-10)s.result={winners:[],reason:'The inquiry closed without an established case. Both starting goals failed.',exchange:s.exchange,ending:'limit'};
  if(progress)Object.assign(progress,{elapsed:t,pair,completed:[...completed],kernelEvents,localMoments});
  s.pending={};s.exchange++;return s;
}

export function commitCase(s,seat,{exchange,requestId,prompt,reviewId=null}){
  if(s.turn){const changed=commitTimed(s,seat,{exchange,requestId,prompt,reviewId});if(changed)settleTimedIncapacity(s);return changed;}
  if(typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{12,80}$/.test(requestId))throw new GameError('A valid request identifier is required.');
  const clean=String(prompt||'').trim();
  if(s.receipts[requestId]){
    const old=s.receipts[requestId];if(old.seat!==seat||old.exchange!==exchange||old.prompt!==clean)throw new GameError('A retry identifier cannot be reused for a different intention.',409);return false;
  }
  if(!s.joined)throw new GameError('Waiting for the second player.',409);
  if(s.result)throw new GameError('This match has ended.',409);
  if(exchange!==s.exchange)throw new GameError('The exchange changed. Refresh before committing.',409);
  if(s.pending[seat])throw new GameError('Your intention is already locked.',409);
  if(expectedSeat(s)!==seat)throw new GameError('The other player contributes first.',409);
  const prepared=reviewId?s.preparedIntents?.[seat]:null;
  if(reviewId&&(!prepared||prepared.reviewId!==reviewId||prepared.exchange!==exchange||prepared.prompt!==clean))throw new GameError('That reviewed intention is stale or belongs to another seat. Review again.',409);
  const intent=prepared?prepared.intent:parseCaseIntention(s,seat,clean);s.pending[seat]={requestId,intent};s.receipts[requestId]={seat,exchange,prompt:clean};
  if(s.pending.A&&s.pending.B)resolveCaseExchange(s);return true;
}

export function caseView(s,seat,roomId,revision=0){
  const p=person(s,seat),first=s.exchange%2?'A':'B',other=seat==='A'?'B':'A';
  const surroundings=Object.entries(namesFor(s)).filter(([id])=>id!==seat&&visible(s,seat,id)).map(([id,name])=>{
    const f=person(s,id),living=f.kind==='person'&&f.alive,close=living?hears(s,seat,id):reachable(s,seat,id);
    return{id,name,kind:f.kind==='person'?(f.alive?'person':'remains'):s.patterns[id]?'trace':'object',range:living?(close?'Within speaking distance':'Approach to speak'):(close?(f._matterReturned?'Body within inspection distance':'Within reading distance'):'Approach to inspect'),direction:Math.abs(f.pos.x-p.pos.x)>Math.abs(f.pos.y-p.pos.y)?(f.pos.x<p.pos.x?'west':'east'):(f.pos.y<p.pos.y?'north':'south')};
  });
  const minutes=Math.round((s.world.elapsedDays%1)*1440),clock=`${s.environment?s.environment.date:`Day ${Math.floor(s.world.elapsedDays)+1}`} · ${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
  return{roomId,revision,scenario:s.caseDefinition||CASE,seat,name:namesFor(s)[seat],otherName:namesFor(s)[other],exchange:s.exchange,joined:s.joined,first:namesFor(s)[s.turn?.seat||first],practice:!!s.practice,
    canSubmit:s.joined&&!s.result&&!s.pending[seat]&&expectedSeat(s)===seat&&(!s.turn||(s.setup.phase==='play'&&conscious(p))),committed:!!s.pending[seat],otherCommitted:!!s.pending[other],ownPrompt:s.pending[seat]?.intent.prompt||null,
    ...(s.setup?{setup:setupView(s,seat),turn:timedTurnView(s,seat)}:{}),
    agency:agencyView(s,seat),environment:environmentView(s,seat),clock,elapsedDays:s.world.elapsedDays-s.startedAt,remainingMinutes:Math.max(0,Math.round((s.setup?.deadlineMinutes||180)-(s.world.elapsedDays-s.startedAt)/MINUTE)),
    result:s.result?{...s.result,achieved:s.result.winners.includes(seat),winnerNames:s.result.winners.map(id=>namesFor(s)[id]),debrief:{culprit:namesFor(s)[s.actuality.culprit],method:s.actuality.method,sequence:s.actuality.sequence||`${namesFor(s)[s.actuality.culprit]} borrowed the service key at 20:03, struck Rowan with the brass weight at 20:17, and returned the key at 20:26. The fabric caught on the weight and the independent time marks survived the night.`}}:null,
    entries:s.entries.filter(e=>e.audience.includes(seat)).map(({audience,...e})=>e),
    discoveries:s.discoveries[seat].map(d=>({root:d.root,key:d.key,title:d.title,text:d.text,mode:d.mode,source:d.source?namesFor(s)[d.source]:null,category:d.category,carrier:d.carrier,shareLabel:d.carrier?namesFor(s)[d.carrier]:d.title,version:d.version})),
    notes:s.notes[seat],surroundings,knownPlaces:Object.entries(namesFor(s)).filter(([id])=>id!==seat&&p.known.has(id)&&!visible(s,seat,id)).map(([id,name])=>({id,name})),
    commitments:s.commitments[seat].map(c=>({...c,name:namesFor(s)[c.to]})),inventory:carried(s,seat),
    condition:{status:bodyState(p),energy:p.body.energy,water:p.body.water,integrity:p.body.integrity,sleepDebt:p.sleepDebt||0},
    completedExchanges:s.history.map(h=>({exchange:h.exchange,minutes:Math.round(h.durationDays/MINUTE*10)/10,ownPrompt:h[seat].prompt,ownContribution:!h.submittedBy||h.submittedBy===seat,kernelEvents:h.kernelEvents,localMoments:h.localMoments}))};
}

export function practicePrompt(s){
  // Practice is a helper with only B's own public view and retained acquisitions.
  if(!conscious(person(s,'B')))return'Wait 1 minute';
  if(s.turn?.reaction?.seat==='B')return s.turn.reaction.kind==='contact'?'Defend myself':`Tell ${namesFor(s).A}: I heard you. I will check what I can encounter.`;
  if(s.turn&&s.ongoing?.B)return 'Continue existing activity';
  const v=caseView(s,'B','practice'),w=v.discoveries;
  if(!w.some(d=>d.root==='clock'))return'Inspect signal log';
  if(!s.signals.some(e=>e.producer==='B'&&e.root==='clock'&&e.encounteredBy.includes('A')))return'Share signal log with Mara';
  return s.turn?'End turn':'Wait 2 minutes';
}
