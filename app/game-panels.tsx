'use client';
import { ArrowRight, Check, ChevronDown, Clock3, Eye, Flag, LockKeyhole, MessageCircle, MapPin, Radio, Smartphone, PencilLine } from 'lucide-react';
import { useState } from 'react';
import type { GameView } from './game-types';
import { evidenceCoverage, latestExchange, turnState } from '../lib/perspective-summary.mjs';

export type ReviewedIntention = {summary:string;minutes:number;warning:string|null;reviewId?:string;interpreted?:boolean;clarification?:string;modelRequired?:boolean;steps?:{kind:string;summary:string;minutes:number}[]};
export const duration = (n:number) => n>=60?`${Number((n/60).toFixed(1))}h`:`${n} min`;

export function TurnRibbon({view,onNotebook,onWrite}:{view:GameView;onNotebook:()=>void;onWrite:()=>void}){
  if(view.turn){
    const t=view.turn;if(view.result||!view.joined)return null;
    const limit=t.reaction?t.reaction.limitMinutes:t.limitMinutes,available=Math.max(0,t.availableMinutes??Math.min(t.remainingMinutes,limit));
    return <section className={`turn-ribbon timed-turn ${view.canSubmit?'phase-ready':'phase-waiting'}`} aria-label="Virtual time available">
      <div className="turn-ribbon-copy"><span className="eyebrow">TURN {String(t.number).padStart(2,'0')} · {t.reaction?'BRIEF RESPONSE':'FIFTEEN VIRTUAL MINUTES'}</span><strong>{t.reaction?t.reaction.isYours?'An opportunity to respond.':`${t.reaction.name} can respond.`:view.canSubmit?'Your time. Your next move.':`${t.activeName} has control.`}</strong><p>{t.reaction?`${t.reaction.text} This response uses up to one virtual minute within the active turn.`:view.canSubmit?'Keep a conversation going, follow a lead, or change your approach. Each action uses time in the world.':'Their prompts stay private. Their actions can still meet your character and the world.'}</p></div>
      <div className="turn-clock"><strong>{available.toFixed(1)}<small> / {limit} min</small></strong><div role="progressbar" aria-label={t.reaction?'Time available for this response':'Time available before handoff or the inquiry deadline'} aria-valuenow={Math.round(available*10)/10} aria-valuemin={0} aria-valuemax={limit}><i style={{width:`${available/limit*100}%`}}/></div><span>{t.reaction?'Available for this response':view.canSubmit?'Available in this turn':'Available in the active turn'}</span></div><button className="text-button" onClick={view.canSubmit?onWrite:onNotebook}>{view.canSubmit?'Continue the scene':'Open your notebook'} <ArrowRight size={14}/></button>
    </section>;
  }
  const turn=turnState(view);
  if(turn.phase==='closed'||turn.phase==='lobby')return null;
  return <section className={`turn-ribbon phase-${turn.phase}`} aria-label="Exchange progress">
    <div className="turn-ribbon-copy"><span className="eyebrow">EXCHANGE {String(view.exchange).padStart(2,'0')}</span><strong>{turn.label}</strong><p>{turn.detail}</p></div>
    <div className="contribution-pair"><div className={view.committed?'is-committed':''}><span>{view.committed?<Check size={12}/>:<PencilLine size={12}/>}</span><strong>You</strong><small>{view.committed?'Locked':view.canSubmit?'Your move':'Waiting'}</small></div><i/><div className={view.otherCommitted?'is-committed':''}><span>{view.otherCommitted?<Check size={12}/>:<LockKeyhole size={12}/>}</span><strong>{view.otherName}</strong><small>{view.otherCommitted?'Locked':'Pending'}</small></div></div>
    <button className="text-button" onClick={turn.phase==='waiting'?onNotebook:onWrite}>{turn.phase==='waiting'?'Open your notebook':'Write your intention'} <ArrowRight size={14}/></button>
  </section>;
}

export function ExchangeRecap({view}:{view:GameView}){
  const last=latestExchange(view);if(!last)return null;
  return <section className="exchange-recap" aria-label={`Consequences of exchange ${last.exchange}`}>
    <div className="recap-heading"><span className="eyebrow">THE CONSEQUENCES</span><span><Clock3 size={12}/>{duration(last.minutes)} passed</span></div>
    <h2>You tried. The world answered.</h2><p className="recap-intention">“{last.intention}”</p>
    <div className="recap-counts">{!!last.readings&&<span><Eye size={12}/>{last.readings} {last.readings===1?'trace reading':'trace readings'}</span>}{!!last.speech&&<span><MessageCircle size={12}/>{last.speech} {last.speech===1?'delivered statement':'delivered statements'}</span>}<span>EXCHANGE {String(last.exchange).padStart(2,'0')}</span></div>
  </section>;
}

export function CaseBoard({view,onPrepare,disabled}:{view:GameView;onPrepare:(prompt:string)=>void;disabled:boolean}){
  const coverage=evidenceCoverage(view.discoveries),[suspect,setSuspect]=useState('');
  if(view.scenario.id!=='night-watch')return null;
  const known=new Set([...view.surroundings,...(view.knownPlaces||[])].map(x=>x.name));
  const suspects=['Nell','Ada','Silas'].filter(name=>known.has(name));
  return <section className="case-board" aria-labelledby="case-board-title"><div className="section-label"><span><Flag size={13}/> YOUR CASE, TAKING SHAPE</span></div><h3 id="case-board-title">A theory needs a trail.</h3><p>Connect what you have actually acquired.</p>
    <div className="case-coverage">{coverage.categories.map(c=><div key={c.key} className={c.count?'has-record':''}><span>{c.count?<Check size={12}/>:<i/>}</span><strong>{c.label}</strong><small>{c.count?`${c.count} ${c.count===1?'source':'sources'}`:'No record yet'}</small></div>)}</div>
    <div className="coverage-counts"><span><b>{coverage.sources}</b> distinct sources</span><span><b>{coverage.firsthand}</b> firsthand</span></div>
    <small className="coverage-caution">This organises your records. It does not confirm who is guilty or whether a claim is true.</small>
    {!view.result&&<details className="prepare-case"><summary>Prepare an accusation <ChevronDown size={13}/></summary><p>The standard is three distinct sources covering access, means and timeline, including two firsthand inspections. The case desk tests the actual evidence.</p><fieldset disabled={disabled}><legend>Who does your evidence name?</legend>{suspects.map(name=><label key={name}><input type="radio" name="case-suspect" value={name} checked={suspect===name} onChange={()=>setSuspect(name)}/><span>{name}</span></label>)}</fieldset><button className="secondary-button" disabled={disabled||!suspect||!view.canSubmit} onClick={()=>onPrepare(`File a case against ${suspect}`)}>Draft my case <ArrowRight size={13}/></button><small>This only fills your intention. Review and commit when you choose.</small></details>}
  </section>;
}

export function IntentionReview({review,onEdit,availableMinutes}:{review:ReviewedIntention;onEdit:()=>void;availableMinutes?:number}){
  return <section className="intention-preview review-card" aria-label="Review your attempted processes"><div className="review-card-heading"><span><Check size={14}/> YOUR ATTEMPT</span><span><Clock3 size={13}/>{duration(review.minutes)} planned</span></div>
    {review.steps?.length?<ol>{review.steps.map((step,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{step.summary}</p><small>{duration(step.minutes)}</small></li>)}</ol>:<p className="review-summary">{review.summary}</p>}
    {availableMinutes!==undefined&&review.minutes>availableMinutes+.001&&<p className="review-warning">Up to {duration(Number(availableMinutes.toFixed(1)))} can pass in this interval. Unfinished activity persists; an encounter can interrupt it sooner.</p>}
    {review.warning&&<p className="review-warning">{review.warning}</p>}<div className="review-card-footer"><small>These are attempts. Their outcome is still open.</small><button className="text-button" onClick={onEdit}><PencilLine size={13}/> Keep editing</button></div>
  </section>;
}

export function ClarificationCard({review,onEdit,onHelp}:{review:ReviewedIntention;onEdit:()=>void;onHelp:()=>void}){
  return <section className="clarification-card" role="status"><span className="eyebrow">NOTHING HAS HAPPENED YET</span><h3>Your intention is still yours.</h3><p>{review.clarification||'Name the immediate action and who or what it involves. No time has passed.'}</p><div><button className="text-button" onClick={onEdit}><PencilLine size={13}/> Keep writing</button><button className="text-button" onClick={onHelp}>See examples <ArrowRight size={13}/></button></div></section>;
}

export function WorldContext({view}:{view:GameView}){
  const e=view.environment;if(!e)return null;
  return <section className="world-context" aria-label="The environment you inhabit"><div className="section-label"><span><MapPin size={13}/> WHEN &amp; WHERE</span><span>{e.date}</span></div><h2>{e.place}</h2><p>{e.region}{!view.setup&&' · Present day'}</p><details><summary>The social environment <ChevronDown size={13}/></summary><div className="world-context-body">{e.context.map((text,i)=><p key={i}>{text}</p>)}<dl>{e.people.map(person=><div key={person.name}><dt>{person.name} <span>{person.role}</span></dt><dd>{person.basis}</dd></div>)}</dl></div></details></section>;
}

export function SituatedCapacity({view,onPrepare}:{view:GameView;onPrepare:(prompt:string)=>void}){
  const e=view.environment;if(!e)return null;
  return <section className="situated-capacity" aria-label="Your role and available support"><div className="section-label"><span>YOUR PLACE IN THIS WORLD</span></div><h3>{e.role.title}</h3><p>{e.role.basis}</p><details><summary>Experience, support &amp; limits <ChevronDown size={12}/></summary><ul>{[...e.role.experience,...e.role.limits].map(text=><li key={text}>{text}</li>)}</ul></details><div className="handset-state">{e.handsets.map(phone=><p key={phone.id}><Smartphone size={14}/><span>{phone.name}<small>{!phone.inControl?'Outside your control':phone.battery===null?'Current condition unavailable':`${phone.battery}% battery · ${phone.working?'working':'off or damaged'}`}</small></span></p>)}</div>{e.channels?<><div className="channel-state"><span><Radio size={12}/> YOUR CONNECTIONS</span><p>{[['Mobile calls',e.channels.voice],['SMS',e.channels.sms],['Internet',e.channels.internet],['Local WiFi',e.channels.wifi]].map(([name,available])=><small key={String(name)} className={available?'available':''}>{name} · {available?'available':'unavailable'}</small>)}</p></div>{!view.result&&<div className="contact-actions">{e.contacts.map(contact=><button className="text-button" key={contact.name} disabled={!view.canSubmit} onClick={()=>onPrepare(contact.name==='Officer Vale'?'Call police: Please check on Nell':`Text ${contact.name}: Meet me at the case desk`)}>{contact.name==='Officer Vale'?'Call the duty officer':`Text ${contact.name}`} <ArrowRight size={12}/></button>)}</div>}</>:<p className="small-explanation">No working handset is available to you now.</p>}{!!e.messages.length&&<details className="message-history"><summary>Messages &amp; calls ({e.messages.length}) <ChevronDown size={12}/></summary>{e.messages.slice(-8).map(m=><article key={m.id}><small>{m.direction==='sent'?'To':'From'} {m.name} · {m.channel} · {m.status}</small><p>“{m.words}”</p></article>)}</details>}</section>;
}

export function CharacterOrientation({view,onPrepare}:{view:GameView;onPrepare:(prompt:string)=>void}){
  const a=view.agency,[purpose,setPurpose]=useState(''),[account,setAccount]=useState('');if(!a)return null;
  return <section className="character-orientation" aria-label="Purpose, attention and identity"><div className="section-label"><span>WHAT YOU BRING TO THIS MOMENT</span></div><h3>{a.purpose?'Your present purpose.':'What matters to you now?'}</h3><p>{a.purpose?.text||'Your starting goal is clear. You decide what further purposes and commitments you develop.'}</p>{!!a.purpose?.anchors.length&&<div className="contact-actions">{a.purpose.anchors.map(x=><button key={x.id} className="text-button" disabled={!view.canSubmit} onClick={()=>onPrepare(`Focus on ${x.name}`)}>Attend to {x.name} <Eye size={12}/></button>)}</div>}{a.lastAttention&&<p className="orientation-history">Last directed attention: {a.lastAttention.name}. An earlier observation can become out of date.</p>}{a.heldPossibility&&<p className="held-possibility">You retain a possibility of reaching {a.heldPossibility.target}. Present conditions still govern whether it can happen.</p>}<details><summary>Your account of yourself <ChevronDown size={12}/></summary><p>{a.selfAccount||'You have not stated an account of yourself. Your prior position and encountered actions remain part of this world.'}</p>{a.presentations.slice(-3).map((r,i)=><article key={i}><small>Words addressed to {r.to} · {r.reached?'reached':'unreached'}</small><p>“{r.words}”</p></article>)}{!!a.encounteredConduct.length&&<div className="conduct-history"><small>ENCOUNTERED CONDUCT</small>{a.encounteredConduct.map((r,i)=><p key={i}>{r.text}</p>)}</div>}{!!a.heardClaims.length&&<div className="conduct-history"><small>INTRODUCTIONS YOU HEARD</small>{a.heardClaims.map((r,i)=><p key={i}>{r.source&&`${r.source}: `}{r.text}</p>)}</div>}</details>{!view.result&&<details><summary>Reflect on purpose or identity <ChevronDown size={12}/></summary><p>A reflection takes time and stays private. An introduction shares words; other people form their own understanding.</p><label>My present purpose<textarea maxLength={300} value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="What are you trying to bring about?"/></label><button className="text-button" disabled={!view.canSubmit||!purpose.trim()} onClick={()=>onPrepare(`Purpose: ${purpose.trim()}`)}>Draft this reflection <ArrowRight size={12}/></button><label>My account of myself<textarea maxLength={300} value={account} onChange={e=>setAccount(e.target.value)} placeholder="Who do you understand yourself to be?"/></label><button className="text-button" disabled={!view.canSubmit||!account.trim()} onClick={()=>onPrepare(`My identity: ${account.trim()}`)}>Draft this reflection <ArrowRight size={12}/></button></details>}</section>;
}
