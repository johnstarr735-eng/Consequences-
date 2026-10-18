import {resolveCaseExchange} from './case-simulation.mjs';
import {parseCaseIntention} from './case-intentions.mjs';
import {GameError} from './simulation.mjs';
import {MINUTE,HUMAN_IDS,person,visible,reachable,hears,entry,namesFor} from './case-world.mjs';
import {conscious} from './case-life.mjs';

export const TURN_MINUTES=15;
const other=id=>id==='A'?'B':'A';
const empty=()=>({prompt:'Continue existing activity',summary:'No new instruction',tasks:[],duration:0});
const clone=x=>structuredClone(x);
export function initializeTimedTurns(s){s.turn={number:1,seat:'A',usedMinutes:0,reaction:null};s.ongoing={};s.format=5;}
export function remainingTurnMinutes(s){return Math.max(0,TURN_MINUTES-s.turn.usedMinutes);}
function remainder(intent,elapsed){
  const tasks=intent.tasks.filter(t=>t.ends>elapsed+1e-10).map(t=>({...t,starts:Math.max(0,t.starts-elapsed),ends:t.ends-elapsed,duration:t.ends-elapsed-Math.max(0,t.starts-elapsed)}));
  return tasks.length?{...intent,tasks,duration:tasks.at(-1).ends}:null;
}
function endIfEliminated(s){
  const alive=HUMAN_IDS.filter(id=>person(s,id)?.alive&&person(s,id)?.body.integrity>.015);
  if(alive.length<2&&!s.result){s.result={winners:[],reason:'A player character can no longer continue the inquiry. The match is closed; no starting goal is awarded without an established case.',exchange:s.exchange,ending:'eliminated'};s.turn.reaction=null;return true;}return false;
}
function handOver(s){
  s.turn.seat=other(s.turn.seat);s.turn.number++;s.turn.usedMinutes=0;s.turn.reaction=null;
  entry(s,HUMAN_IDS,'turn',`${namesFor(s)[s.turn.seat]} now has up to fifteen simulated minutes. Existing activity and encountered consequences persist.`);
}
function validate(s,seat,r){
  if(typeof r.requestId!=='string'||!/^[a-zA-Z0-9_-]{12,80}$/.test(r.requestId))throw new GameError('A valid request identifier is required.');
  const prompt=String(r.prompt||'').trim(),old=s.receipts[r.requestId];
  if(old){if(old.seat!==seat||old.exchange!==r.exchange||old.prompt!==prompt)throw new GameError('A retry identifier cannot be reused for a different action.',409);return false;}
  if(!s.joined||s.setup?.phase!=='play')throw new GameError('Both players must confirm their characters and the setting first.',409);
  if(s.result)throw new GameError('This match has ended.',409);
  if(r.exchange!==s.exchange)throw new GameError('The scene changed. Refresh before acting.',409);
  if((s.turn.reaction?.seat||s.turn.seat)!==seat)throw new GameError('The other player has control.',409);
  return true;
}
function run(s,controller,intent,limit,{reaction=false,requestId,submittedBy=controller}={}){
  const inactive=other(controller),pair={[controller]:intent,[inactive]:s.ongoing[inactive]||empty()},progress={};
  let interruption=null;
  s.pending=Object.fromEntries(HUMAN_IDS.map(id=>[id,{requestId:id===submittedBy?requestId:`ongoing_${s.exchange}_${id}`,intent:pair[id]}]));
  const signalStart=s.signals.length,messageStart=s.environment?.messages?.length||0;
  resolveCaseExchange(s,{durationLimit:Math.min(limit*MINUTE,intent.duration),progress,submittedBy,
    beforeFrame:({tasks})=>{
      for(const actor of HUMAN_IDS){const t=tasks[actor],target=t?.target;
        // A responding player may initiate contact too. The active player gets
        // a counter-response before that new contact resolves; the two existing
        // intentions then meet without an endless chain of free reactions.
        if(reaction&&actor===controller)continue;
        if(t?.kind==='contact'&&target===other(actor)&&!t.reactionAsked&&conscious(person(s,target))&&reachable(s,actor,target)&&(visible(s,target,actor)||hears(s,actor,target))){
          t.reactionAsked=true;interruption={seat:target,from:actor,kind:'contact',text:`${namesFor(s)[actor]} is attempting a close physical encounter. You may give a brief response.`};
          // This is a local control-protocol notice, not a witnessed harm record.
          entry(s,[target],'reaction',interruption.text);return true;
        }
      }return false;
    },
    afterFrame:()=>{
      if(HUMAN_IDS.some(id=>!person(s,id)?.alive||person(s,id).body.integrity<=.015))return true;
      if(reaction)return false;
      const received=s.signals.find(sig=>HUMAN_IDS.includes(sig.producer)&&sig.to===other(sig.producer)&&sig.encounteredBy?.includes(sig.to)&&!sig.reactionOffered);
      // A delivered message can create a response opportunity too; its contents
      // have already reached that character, never an omniscient private plan.
      const message=s.environment?.messages.find(m=>HUMAN_IDS.includes(m.from)&&m.to===other(m.from)&&m.readAt&&!m.reactionOffered);
      const item=received||message;
      if(item&&conscious(person(s,item.to))){item.reactionOffered=true;interruption={seat:item.to,from:item.producer||item.from,kind:'speech',text:'You have received words addressed to you. You may give a brief response.'};return true;}return false;
    }});
  for(const id of HUMAN_IDS){const rest=remainder(pair[id],progress.elapsed||0);if(rest)s.ongoing[id]=rest;else delete s.ongoing[id];}
  s.turn.usedMinutes=Math.min(TURN_MINUTES,s.turn.usedMinutes+(progress.elapsed||0)/MINUTE);
  if(reaction){for(const sig of s.signals.slice(signalStart))sig.reactionOffered=true;for(const msg of s.environment?.messages.slice(messageStart)||[])msg.reactionOffered=true;}
  if(interruption&&!s.result&&remainingTurnMinutes(s)>1e-7)s.turn.reaction=interruption;
  if(endIfEliminated(s)||s.result)return;
  if(!s.turn.reaction&&remainingTurnMinutes(s)<1e-7)handOver(s);
}
export function commitTimed(s,seat,r){
  if(!validate(s,seat,r))return false;
  const prompt=String(r.prompt||'').trim(),isReaction=!!s.turn.reaction;
  if(/^(?:end turn|pass turn)$/i.test(prompt)){
    if(isReaction)throw new GameError('Respond to the encounter or choose “Continue existing activity”.');
    s.receipts[r.requestId]={seat,exchange:r.exchange,prompt};
    s.history.push({exchange:s.exchange++,durationDays:0,kernelEvents:0,localMoments:0,submittedBy:seat,A:{prompt:seat==='A'?prompt:'',summary:''},B:{prompt:seat==='B'?prompt:'',summary:''}});handOver(s);return true;
  }
  const continuation=/^(?:continue|continue (?:my |existing )?(?:action|activity|journey|plan))$/i.test(prompt);
  let intent;
  if(continuation){
    intent=s.ongoing[seat]?clone(s.ongoing[seat]):{prompt,summary:'Remain here',tasks:[{kind:'wait',starts:0,ends:MINUTE,duration:MINUTE,summary:'Remain here for one minute'}],duration:MINUTE};
  }else{
    const prepared=r.reviewId?s.preparedIntents?.[seat]:null;
    if(r.reviewId&&(!prepared||prepared.reviewId!==r.reviewId||prepared.exchange!==r.exchange||prepared.prompt!==prompt))throw new GameError('That interpretation is stale. Review again.',409);
    intent=clone(prepared?.intent||parseCaseIntention(s,seat,prompt));
  }
  if(!conscious(person(s,seat)))throw new GameError('Your character cannot issue a new instruction in this condition.',409);
  intent.prompt=prompt;s.receipts[r.requestId]={seat,exchange:r.exchange,prompt};
  if(isReaction){
    s.turn.reaction=null;
    const active=s.turn.seat;
    if(seat===active){run(s,seat,intent,Math.min(1,remainingTurnMinutes(s)),{reaction:true,requestId:r.requestId});}
    else{
      s.ongoing[seat]=intent;
      const resume=s.ongoing[active]||{prompt:'Pause for the encountered response',summary:'Response interval',tasks:[{kind:'wait',duration:MINUTE,starts:0,ends:MINUTE,summary:'Hear the response'}],duration:MINUTE};
      run(s,active,resume,Math.min(1,remainingTurnMinutes(s)),{reaction:true,requestId:r.requestId,submittedBy:seat});
    }
  }else run(s,seat,intent,remainingTurnMinutes(s),{requestId:r.requestId});
  return true;
}
// Called after actual action resolution, never by a read. Incapacity must not
// strand the other player behind a missing contribution.
export function settleTimedIncapacity(s){
  if(!s.turn||s.result||s.setup?.phase!=='play')return;
  if(endIfEliminated(s))return;
  if(s.turn.reaction&&!conscious(person(s,s.turn.reaction.seat)))s.turn.reaction=null;
  for(let i=0;i<Math.ceil((s.setup?.deadlineMinutes||180)/TURN_MINUTES)+3&&!s.result&&!s.turn.reaction&&!conscious(person(s,s.turn.seat));i++){
    const seat=s.turn.seat,mins=remainingTurnMinutes(s),intent={prompt:'Involuntary interval during incapacity',summary:'Time passes during incapacity',tasks:[{kind:'wait',duration:mins*MINUTE,starts:0,ends:mins*MINUTE,summary:'No conscious instruction'}],duration:mins*MINUTE};
    run(s,seat,intent,mins,{requestId:`incapacity_${s.exchange}`,submittedBy:'automatic'});
  }
}
export function timedTurnView(s,seat){
  const r=s.turn.reaction;
  const deadlineRemaining=Math.max(0,(s.setup?.deadlineMinutes||180)-(s.world.elapsedDays-s.startedAt)/MINUTE);
  return{number:s.turn.number,seat:s.turn.seat,activeName:namesFor(s)[s.turn.seat],usedMinutes:s.turn.usedMinutes,remainingMinutes:remainingTurnMinutes(s),limitMinutes:TURN_MINUTES,
    availableMinutes:Math.min(remainingTurnMinutes(s),r?1:TURN_MINUTES,deadlineRemaining),
    reaction:r?{isYours:r.seat===seat,name:namesFor(s)[r.seat],text:r.seat===seat?r.text:'The encountered player has an opportunity to respond.',limitMinutes:1}:null,
    continuing:s.ongoing[seat]?{summary:s.ongoing[seat].summary,minutes:s.ongoing[seat].duration/MINUTE}:null};
}
