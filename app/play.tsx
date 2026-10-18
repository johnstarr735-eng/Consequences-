'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bell, BookOpen, Check, ChevronDown, Copy, Eye, Flag, Hourglass, Link2, LoaderCircle, LockKeyhole, LogOut, NotebookPen, RefreshCw, Settings2, Share2, Sparkles, Users, Volume2, X } from 'lucide-react';
import type { Discovery, Entry, GameView, Session } from './game-types';
import { invitationLink, parseInvitation, readDraft, readSessions, rememberSession, writeDraft } from '../lib/client-state.mjs';
import { bundledApp, feedback, matchRequest, onlineOrigin, openOnline, persistDevice, shareContent } from './client-platform';
import Settings from './settings';
import {WorldBuilder,MatchSetup,type SetupChoice,type CharacterChoice} from './world-setup';
import { useDialog } from './use-dialog';
import { RequestScope, samePerspective, currentReview } from '../lib/client-flow.mjs';
import {sceneEntries,intentionHistory} from '../lib/perspective-summary.mjs';
import { CaseBoard, ExchangeRecap, TurnRibbon, IntentionReview, ClarificationCard, WorldContext, SituatedCapacity, CharacterOrientation, duration, type ReviewedIntention } from './game-panels';

const STORAGE = 'consequences:sessions:v1';
function stored(): Session[] { try { return readSessions(localStorage); } catch { return []; } }
function remember(s:Session,view?:GameView){
  try{if(!rememberSession(localStorage,s,view))return false;}catch{return false;}
  try{sessionStorage.setItem(`consequences:${s.id}`,s.token);}catch{}
  persistDevice();return true;
}
function localDraft(id:string,seat:string){try{return readDraft(localStorage,id,seat);}catch{return null;}}
function message(error:unknown,fallback:string){return error instanceof Error&&error.message?error.message:fallback;}
type ApiReply = { error?: string; view: GameView; token: string; invite: string | null; preview: ReviewedIntention };
type AccountSeat = {id:string;seat:string;name:string;title:string;practice:boolean;ended:boolean};
async function api(action: string, data: Record<string, unknown>, key?: string) {
  return await matchRequest(action, data, key) as ApiReply;
}
function Mark() { return <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 26C7 15 16 8 27 8M13 32c0-11 9-18 20-18M7 26c11 0 20-7 20-18M13 32c11 0 20-7 20-18" stroke="currentColor" strokeWidth="1.5"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg>; }
function ArchiveArt() {
  return <div className="archive-art" aria-hidden="true"><svg viewBox="0 0 680 540" fill="none">
    <defs><radialGradient id="glow"><stop stopColor="#D1B57B" stopOpacity=".22"/><stop offset="1" stopColor="#D1B57B" stopOpacity="0"/></radialGradient><linearGradient id="glass" x1="290" y1="60" x2="400" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="#809B86" stopOpacity=".24"/><stop offset="1" stopColor="#809B86" stopOpacity=".02"/></linearGradient></defs>
    <circle cx="350" cy="230" r="260" fill="url(#glow)"/><path d="M240 348V168a100 100 0 0 1 200 0v180Z" fill="url(#glass)" stroke="#9C9C7F" strokeOpacity=".45"/><path d="M252 347V171a88 88 0 0 1 176 0v176M340 80v267M252 187h176M252 267h176" stroke="#9C9C7F" strokeOpacity=".35"/><path d="m242 345 175-157 220 349H80Z" fill="#D1B57B" fillOpacity=".04"/>
    <path d="M90 382h502M130 393v85M554 393v85M112 382l44-45h390l37 45" stroke="#BCA777" strokeOpacity=".55"/><path d="m212 365 117-20 104 22-106 23Z" fill="#BCA777" fillOpacity=".08" stroke="#C6B085" strokeOpacity=".6"/><path d="m329 345-2 45M225 367l92-14M342 353l77 14M225 372l93-14" stroke="#C6B085" strokeOpacity=".4"/>
    <path d="M473 341v-73m-18 0h36l-8-44h-20Z" fill="#9F9469" fillOpacity=".08" stroke="#BCA777" strokeOpacity=".55"/><ellipse cx="473" cy="342" rx="21" ry="4" stroke="#BCA777" strokeOpacity=".5"/><path d="M132 344v-14h60v14m-57-16v-12h52v12M151 314v-12h54v12M482 364l47 7 3-15-45-8Z" stroke="#9B987A" strokeOpacity=".6"/><path d="M106 452h466M56 490h568" stroke="#8B937C" strokeOpacity=".12"/><circle cx="340" cy="190" r="159" stroke="#BCA777" strokeOpacity=".07" strokeDasharray="2 9"/>
  </svg><span>THE OBSERVATORY · CASE 002</span></div>;
}

export default function Consequences() {
  const [creating,setCreating]=useState<boolean|null>(null);
  const [session,setSession]=useState<Session|null>(null),[view,setView]=useState<GameView|null>(null);
  const [sessions,setSessions]=useState<Session[]>([]),[allSessions,setAllSessions]=useState(false),[invitation,setInvitation]=useState<{id:string;invite:string}|null>(null);
  const [busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[offline,setOffline]=useState(false);
  const [help,setHelp]=useState(false),[settings,setSettings]=useState(false),[copied,setCopied]=useState(false),[tab,setTab]=useState('scene');
  const [prompt,setPrompt]=useState(''),[notes,setNotes]=useState(''),[noteStatus,setNoteStatus]=useState(''),[noteSaving,setNoteSaving]=useState(false),[noteConflict,setNoteConflict]=useState(false);
  const [preview,setPreview]=useState<ReviewedIntention|null>(null),[accountSeats,setAccountSeats]=useState<AccountSeat[]>([]),[alerts,setAlerts]=useState(false),[showEarlier,setShowEarlier]=useState(false);
  const [joinText,setJoinText]=useState(''),[joinForm,setJoinForm]=useState(false),[draftStatus,setDraftStatus]=useState(''),[evidenceFilter,setEvidenceFilter]=useState('all');
  const scope=useRef(new RequestScope()),active=useRef<Session|null>(null),latest=useRef<GameView|null>(null);
  const noteKey=useRef(''),noteBase=useRef(''),noteText=useRef(''),noteEdits=useRef(0),promptText=useRef('');
  const composer=useRef<HTMLTextAreaElement>(null),modal=useRef<HTMLElement>(null);
  const pending=useRef<{exchange:number;prompt:string;requestId:string}|null>(null);
  const closeHelp=useCallback(()=>setHelp(false),[]),closeSettings=useCallback(()=>setSettings(false),[]);
  useDialog(help,modal,closeHelp);

  const accept=useCallback((d:GameView)=>{
    if(!active.current||active.current.id!==d.roomId||active.current.seat!==d.seat)return false;
    const previous=latest.current;
    if(samePerspective(previous,d)&&previous!.revision>=d.revision)return false;
    if(samePerspective(previous,d)&&d.canSubmit&&(!previous!.canSubmit||previous!.exchange!==d.exchange)&&'Notification' in window&&Notification.permission==='granted'&&document.visibilityState==='hidden'){
      try{const n=new Notification('Your turn in Consequences',{body:`${d.name} can contribute to ${d.scenario.title}.`,tag:`${d.roomId}:${d.seat}`,icon:'/icon-192.png'});n.onclick=()=>window.focus();}catch{}
    }
    if(active.current.name!==d.name){active.current={...active.current,name:d.name};setSession(active.current);}
    latest.current=d;setView(d);document.title=d.canSubmit?'Your turn — Consequences':'Consequences';
    const fresh=noteKey.current!==`${d.roomId}:${d.seat}`,draft=localDraft(d.roomId,d.seat);
    if(fresh){
      noteKey.current=`${d.roomId}:${d.seat}`;noteText.current=draft?.notes??d.notes;noteBase.current=draft?.notes!=null?draft.notesBase:d.notes;noteEdits.current=0;
      setNotes(noteText.current);setNoteConflict(draft?.notes!=null&&noteBase.current!==d.notes&&noteText.current!==d.notes);
      setNoteStatus(draft?.notes!=null?'Your unfinished note was restored on this device.':'');
    }else if(previous?.notes!==d.notes){
      const dirty=noteText.current!==noteBase.current;
      if(!dirty||noteText.current===d.notes){noteText.current=d.notes;noteBase.current=d.notes;setNotes(d.notes);setNoteConflict(false);}
      else if(d.notes!==noteBase.current){setNoteConflict(true);setNoteStatus('The saved note changed on another device. Your draft is kept.');}
    }
    if(fresh||previous?.exchange!==d.exchange||(!previous?.committed&&d.committed)){
      const text=!d.committed&&!d.result&&draft?.exchange===d.exchange?draft.prompt:'';
      promptText.current=text;setPrompt(text);setPreview(null);
      pending.current=text&&draft?.requestId?{exchange:d.exchange,prompt:text,requestId:draft.requestId}:null;
      setDraftStatus(text?'Draft restored on this device':'');
      if(draft)try{writeDraft(localStorage,d.roomId,d.seat,{...draft,exchange:d.exchange,prompt:text,requestId:pending.current?.requestId||null});persistDevice();}catch{}
    }
    if(fresh||previous?.exchange!==d.exchange||previous?.canSubmit!==d.canSubmit||!!previous?.result!==!!d.result)remember(active.current,d);
    return true;
  },[]);

  function mount(s:Session,d:GameView){
    active.current=s;setSession(s);setOffline(false);setInvitation(null);setPreview(null);setTab('scene');setShowEarlier(false);setEvidenceFilter('all');
    const saved=remember(s,d);accept(d);history.replaceState(null,'',`/?room=${s.id}`);
    if(!saved)setNotice('This device could not remember your player key. Keep this screen open; account recovery may be available online.');
  }
  const open=useCallback(async(s:Session)=>{
    const ticket=scope.current.begin();setBusy('Opening match');setError('');setNotice('');
    try{const d=await api('read',{id:s.id},s.token);if(!scope.current.current(ticket))return;mount(s,d.view);void api('attach',{id:s.id},s.token).catch(()=>{});}
    catch(e){if(scope.current.current(ticket))setError(message(e,'Could not open this match.'));}
    finally{if(scope.current.current(ticket))setBusy('');}
  },[accept]);

  useEffect(()=>{
    const list=stored();setSessions(list);
    try{document.documentElement.dataset.reading=localStorage.getItem('consequences:reading')||'standard';}catch{}
    if('Notification' in window)setAlerts(Notification.permission==='granted');
    const ticket=scope.current.capture();void api('list',{}).then(d=>{if(scope.current.current(ticket))setAccountSeats((d as unknown as {sessions:AccountSeat[]}).sessions||[]);}).catch(()=>{});
    if(!bundledApp()&&'serviceWorker' in navigator)void navigator.serviceWorker.register('/sw.js').catch(()=>{});
    const url=new URL(location.href),id=url.searchParams.get('room');
    if(id&&new URLSearchParams(url.hash.slice(1)).has('invite')){try{setInvitation(parseInvitation(url.href,onlineOrigin()));}catch(e){setError(message(e,'The invitation is incomplete.'));}return;}
    if(id){let key:string|null=null;try{key=sessionStorage.getItem(`consequences:${id}`);}catch{}const s=list.find(s=>s.id===id&&(!key||s.token===key));if(s)void open(s);else setError('This device has no player key for that match. Recover an account-linked seat below, or use the device where you joined.');}
  },[open]);

  useEffect(()=>{
    const storageError=()=>setError('The app could not back up this device’s drafts. Keep this screen open and try again.'),badInvite=()=>setError('This invitation could not be opened. Ask the host for the complete link.');
    window.addEventListener('consequences:storage-error',storageError);window.addEventListener('consequences:bad-invite',badInvite);
    return()=>{window.removeEventListener('consequences:storage-error',storageError);window.removeEventListener('consequences:bad-invite',badInvite);};
  },[]);

  useEffect(()=>{
    if(!session)return;let cancelled=false,fetching=false;const ticket=scope.current.capture();
    const refresh=async()=>{
      if(fetching||(document.visibilityState==='hidden'&&(!('Notification' in window)||Notification.permission!=='granted')))return;
      fetching=true;
      try{const d=await api('read',{id:session.id},session.token);if(!cancelled&&scope.current.current(ticket)){accept(d.view);setOffline(false);}}
      catch(e){if(!cancelled&&scope.current.current(ticket)){if(bundledApp())setError(message(e,'Could not read this practice save.'));else setOffline(true);}}
      finally{fetching=false;}
    };
    const disconnected=()=>{if(!bundledApp())setOffline(true);};
    const timer=setInterval(refresh,3000);document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);window.addEventListener('offline',disconnected);window.addEventListener('consequences:resume',refresh);
    return()=>{cancelled=true;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('online',refresh);window.removeEventListener('offline',disconnected);window.removeEventListener('consequences:resume',refresh);};
  },[session,accept]);
  useEffect(()=>{const back=(e:Event)=>{if(e.defaultPrevented)return;if(settings){e.preventDefault();setSettings(false);}else if(help){e.preventDefault();setHelp(false);}else if(view&&tab==='notebook'){e.preventDefault();setTab('scene');}else if(session){e.preventDefault();leave();}};window.addEventListener('consequences:back',back);return()=>window.removeEventListener('consequences:back',back);});

  function saveLocal(patch:Record<string,unknown>){
    const s=active.current,v=latest.current;if(!s||!v)return false;
    const d=localDraft(s.id,s.seat)||{exchange:v.exchange,prompt:promptText.current,notes:noteText.current!==v.notes?noteText.current:null,notesBase:noteBase.current,requestId:null};
    try{const saved=writeDraft(localStorage,s.id,s.seat,{...d,exchange:v.exchange,...patch});persistDevice();setDraftStatus(saved?'Draft saved on this device':'This device cannot save drafts. Keep this screen open.');return saved;}
    catch{setDraftStatus('This device cannot save drafts. Keep this screen open.');return false;}
  }
  function changePrompt(text:string){if(busy==='Committing intention')return;promptText.current=text;setPrompt(text);setPreview(null);setError('');pending.current=null;saveLocal({prompt:text,requestId:null});}
  function changeNotes(text:string){noteEdits.current++;noteText.current=text;setNotes(text);const saved=saveLocal({notes:text,notesBase:noteBase.current});setNoteStatus(saved?'Local draft · save when ready':'This device cannot keep a draft. Save your note before closing.');}
  function focusComposer(){setTab('scene');requestAnimationFrame(()=>{composer.current?.focus();composer.current?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});}
  function editIntention(){setPreview(null);focusComposer();}
  function suggest(text:string){if(busy)return;changePrompt(text);focusComposer();}

  async function create(practice:boolean,setup?:SetupChoice){
    if(bundledApp()&&!practice){try{await openOnline();}catch{setError('Could not open the online game. Try again with a connection.');}return;}
    const ticket=scope.current.begin();setBusy('Preparing the case');setError('');setNotice('');
    try{const d=await api('create',{practice,setup:setup||{}}),s={id:d.view.roomId,token:d.token,seat:d.view.seat,name:d.view.name,title:d.view.scenario.title,practice,invite:d.invite};remember(s,d.view);if(scope.current.current(ticket))mount(s,d.view);}
    catch(e){if(scope.current.current(ticket))setError(message(e,'Could not create a match.'));}finally{if(scope.current.current(ticket))setBusy('');}
  }
  async function join(){
    if(!invitation)return;const ticket=scope.current.begin();setBusy('Taking your seat');setError('');
    try{
      if(bundledApp()){await openOnline(invitationLink(onlineOrigin(),invitation.id,invitation.invite));return;}
      const key=`consequences:joining:${invitation.id}`;let playerToken='';try{playerToken=sessionStorage.getItem(key)||'';}catch{}
      if(!playerToken){playerToken=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');try{sessionStorage.setItem(key,playerToken);}catch{}}
      const d=await api('join',{...invitation,playerToken}),s={id:d.view.roomId,token:d.token,seat:d.view.seat,name:d.view.name,title:d.view.scenario.title};remember(s,d.view);if(scope.current.current(ticket)){mount(s,d.view);setSessions(stored());}
    }catch(e){if(scope.current.current(ticket))setError(message(e,'Could not join this match.'));}finally{if(scope.current.current(ticket))setBusy('');}
  }
  function leave(){
    const ticket=scope.current.begin();active.current=null;latest.current=null;noteKey.current='';pending.current=null;promptText.current='';noteText.current='';noteBase.current='';
    setSession(null);setView(null);setCreating(null);setPrompt('');setNotes('');setPreview(null);setBusy('');setNoteSaving(false);setNoteConflict(false);setError('');setNotice('');setOffline(false);setInvitation(null);setSessions(stored());setShowEarlier(false);setCopied(false);setDraftStatus('');setTab('scene');document.title='Consequences';history.replaceState(null,'','/');
    void api('list',{}).then(d=>{if(scope.current.current(ticket))setAccountSeats((d as unknown as {sessions:AccountSeat[]}).sessions||[]);}).catch(()=>{});
  }
  async function recover(s:AccountSeat){const ticket=scope.current.begin();setBusy('Recovering your seat');setError('');try{const d=await api('recover',{id:s.id,seat:s.seat}),seat={id:s.id,seat:s.seat,name:s.name,title:s.title,practice:s.practice,token:d.token};remember(seat,d.view);if(scope.current.current(ticket))mount(seat,d.view);}catch(e){if(scope.current.current(ticket))setError(message(e,'Could not recover this seat.'));}finally{if(scope.current.current(ticket))setBusy('');}}
  async function refreshCurrent(){const s=active.current;if(!s)return;const ticket=scope.current.capture();setBusy('Checking saved world');try{const d=await api('read',{id:s.id},s.token);if(scope.current.current(ticket)){accept(d.view);setOffline(false);setError('');}}catch(e){if(scope.current.current(ticket))setError(message(e,'Could not reach the saved world.'));}finally{if(scope.current.current(ticket))setBusy('');}}
  async function confirmWorld(character:CharacterChoice){
    const s=active.current;if(!s||busy)return;const ticket=scope.current.capture();setBusy('Confirming your character');setError('');
    try{const saved=await api('character',{id:s.id,character},s.token);if(!scope.current.current(ticket))return;accept(saved.view);const ready=await api('ready',{id:s.id},s.token);if(scope.current.current(ticket))accept(ready.view);}
    catch(e){if(scope.current.current(ticket))setError(message(e,'Could not confirm your character.'));}finally{if(scope.current.current(ticket))setBusy('');}
  }
  async function controlTurn(text:string){
    const s=active.current,v=latest.current;if(!s||!v?.canSubmit||busy||offline)return;
    if(!pending.current||pending.current.exchange!==v.exchange||pending.current.prompt!==text)pending.current={exchange:v.exchange,prompt:text,requestId:crypto.randomUUID()};
    const request={...pending.current},ticket=scope.current.capture();setBusy('Advancing the scene');setError('');
    try{const d=await api('commit',{id:s.id,...request},s.token);if(scope.current.current(ticket)){accept(d.view);setPreview(null);feedback();}}
    catch(e){if(scope.current.current(ticket))setError(message(e,'The action was not confirmed. Retry to check the saved result.'));}finally{if(scope.current.current(ticket))setBusy('');}
  }
  async function enableAlerts(){if(!('Notification' in window)){setNotice('Turn alerts are unavailable on this device. Your turn indicator still updates.');return;}try{const p=await Notification.requestPermission();setAlerts(p==='granted');if(p!=='granted')setNotice('Turn alerts were not enabled. You can change notification permission in your browser settings.');}catch{setNotice('Turn alerts are unavailable in this browser.');}}
  async function resign(){const s=active.current;if(!s||!confirm('Close this match? Neither player receives an unearned victory. Your confirmed history remains saved.'))return;const ticket=scope.current.capture();setBusy('Closing match');try{const d=await api('resign',{id:s.id},s.token);if(scope.current.current(ticket))accept(d.view);}catch(e){if(scope.current.current(ticket))setError(message(e,'Could not close the match.'));}finally{if(scope.current.current(ticket))setBusy('');}}
  async function copy(){if(!session?.invite)return;try{await navigator.clipboard.writeText(invitationLink(onlineOrigin(),session.id,session.invite));setCopied(true);setNotice('Invitation copied. Send it to your second player.');}catch{setError('Copy is unavailable. Select the invitation link to copy it manually.');}}
  async function share(){if(!session?.invite)return;try{const method=await shareContent({title:'Join me in Consequences',text:'Two players. One shared world. Take the other seat.',url:invitationLink(onlineOrigin(),session.id,session.invite)});if(method==='copied'){setCopied(true);setNotice('Invitation copied. Send it to your second player.');}}catch(e){if((e as Error)?.name!=='AbortError')setError('Sharing is unavailable. Copy the invitation instead.');}}
  async function renewInvitation(){const s=active.current;if(!s)return;const ticket=scope.current.capture();setBusy('Preparing invitation');try{const d=await api('invite',{id:s.id},s.token);if(scope.current.current(ticket)){const updated={...s,invite:d.invite};active.current=updated;setSession(updated);remember(updated,d.view);accept(d.view);setNotice('New invitation ready. The earlier link has expired.');}}catch(e){if(scope.current.current(ticket))setError(message(e,'Could not prepare an invitation.'));}finally{if(scope.current.current(ticket))setBusy('');}}
  function readInvitation(){try{setInvitation(parseInvitation(joinText,onlineOrigin()));setError('');setJoinForm(false);}catch(e){setError(message(e,'The invitation is incomplete.'));}}

  async function review(){
    const s=active.current,v=latest.current,text=promptText.current;if(!s||!v?.canSubmit||!text.trim()||busy)return;
    const ticket=scope.current.capture();setBusy('Reviewing intention');setError('');
    try{const d=await api('preview',{id:s.id,prompt:text},s.token);if(currentReview(ticket,scope.current,v,latest.current,text,promptText.current))setPreview(d.preview);}
    catch(e){if(currentReview(ticket,scope.current,v,latest.current,text,promptText.current))setError(message(e,'Could not review.'));}
    finally{if(scope.current.current(ticket))setBusy('');}
  }
  async function commit(){
    const s=active.current,v=latest.current,text=promptText.current;if(!s||!v?.canSubmit||!preview||preview.interpreted===false||busy||offline)return;
    if(!pending.current||pending.current.exchange!==v.exchange||pending.current.prompt!==text)pending.current={exchange:v.exchange,prompt:text,requestId:crypto.randomUUID()};
    const request={...pending.current,reviewId:preview.reviewId},ticket=scope.current.capture();saveLocal({prompt:text,requestId:request.requestId});setBusy('Committing intention');setError('');
    try{const d=await api('commit',{id:s.id,...request},s.token);if(scope.current.current(ticket)){accept(d.view);setPreview(null);setDraftStatus('');feedback();}}
    catch(e){if(scope.current.current(ticket))setError(message(e,'The reply was not confirmed. Retry this same intention.'));}
    finally{if(scope.current.current(ticket))setBusy('');}
  }
  async function saveNotes(){
    const s=active.current;if(!s||noteSaving||noteConflict)return;const ticket=scope.current.capture(),text=noteText.current,baseText=noteBase.current,edits=noteEdits.current;
    setNoteSaving(true);setNoteStatus('Saving…');
    try{const d=await api('notes',{id:s.id,text,baseText},s.token);if(!scope.current.current(ticket))return;accept(d.view);const saved=latest.current!.notes;
      if(saved!==text){setNoteConflict(true);setNoteStatus('The saved note changed again. Your local draft is kept.');return;}
      noteBase.current=saved;setNoteConflict(false);if(edits===noteEdits.current){saveLocal({notes:null,notesBase:saved});setNoteStatus('Saved');}else{saveLocal({notes:noteText.current,notesBase:saved});setNoteStatus('Your newer edits remain in the local draft.');}
    }catch(e){if(scope.current.current(ticket)){setNoteStatus(message(e,'Could not save. Your local draft is kept.'));if((e as {status?:number}).status===409){setNoteConflict(true);try{const d=await api('read',{id:s.id},s.token);if(scope.current.current(ticket))accept(d.view);}catch{}}}}
    finally{if(scope.current.current(ticket))setNoteSaving(false);}
  }
  function useSavedNote(){const v=latest.current;if(!v)return;noteText.current=v.notes;noteBase.current=v.notes;noteEdits.current++;setNotes(v.notes);setNoteConflict(false);setNoteStatus('Using your saved note.');saveLocal({notes:null,notesBase:v.notes});}
  function keepDraft(){const v=latest.current;if(!v)return;noteBase.current=v.notes;setNoteConflict(false);setNoteStatus('Your draft is kept. Save to replace the displayed saved version.');saveLocal({notes:noteText.current,notesBase:v.notes});}
  const understood=!!preview&&preview.interpreted!==false;
  const currentCase=view?.scenario.id==='night-watch';
  const currentEntries:Entry[]=view?sceneEntries(view,showEarlier):[];
  const ownIntentions:GameView['completedExchanges']=view?intentionHistory(view):[];
  const filteredDiscoveries=view?.discoveries.filter(d=>evidenceFilter==='all'||d.mode===evidenceFilter)||[];
  const exampleTemplates=(currentCase||!view)?[['Focus on Nell for 2 minutes','Direct attention from your actual position; fine detail still needs access and time.'],['Purpose: I want to hear Nell before accusing anyone','Retain your own present purpose without replacing the starting goal.'],['My identity: a careful investigator','State a private self account; it grants no new abilities.'],['Introduce myself to Nell as an inquiry researcher','Deliver a claim that someone can hear and interpret.'],['Text Jonah: Meet me at the case desk','Use your charged handset and a working mobile route.'],['Call police: Please check on Nell','Deliver a report to a situated officer; a claim is not a verdict.'],['Message Jonah: Check the recorder','Use mobile internet or working WiFi and its uplink.'],['Approach Nell, then ask her about the key','Combine immediate steps. The review shows the whole attempt.'],['Strangle Nell','Attempt bodily contact; survival, resistance and witnesses matter.'],['Defend myself · Protect Nell · Flee from Ada','Resist, intervene or attempt to get away.'],['Tear up the key register','Change a physical trace; earlier copies and memories can survive.'],['Inspect the brass weight','Approach and inspect an encountered object.'],['Ask Nell about the service key','Question someone from within speaking distance.'],["Offer Ada I will not accuse anyone without evidence",'Make a commitment someone can remember.'],['Take my paper · Drop my paper','Grasp or release existing finite material.'],['Write Meet me at the desk on my paper','Use an existing receptive surface and your pen’s ink.'],['Confront Silas with my evidence','Present acquired firsthand findings.'],['File a case against [name]','Lodge a supported case naming Nell, Ada or Silas.'],['Look around · Wait 5 minutes','Observe, or allow physical time to pass.']]:[['Read receipt','Read a trace within reach.'],['Approach Nell','Move toward an encountered person.'],['Tell Jonah: I found something','Produce spoken words.'],['Share receipt with Jonah','Repeat an acquired trace.'],['File: [name] moved L-17 to the [east/west] archive','Lodge an account.'],['Look around · Wait','Observe, or wait for an hour.']];
  const examples=exampleTemplates.filter(([command])=>!view?.setup||view.setup.profileId==='port-serein'||!/^(?:Text|Call|Message) /.test(command)).map(([command,explanation])=>{
    if(!view)return[command,explanation];
    const names:Record<string,string>={Mara:view.seat==='A'?view.name:view.otherName,Jonah:view.seat==='B'?view.name:view.otherName,Rowan:view.setup?.profileId==='roman-court'?'Lucan':'Rowan'};
    return[command.replace(/Mara|Jonah|Rowan/g,name=>names[name]),explanation];
  });
  return <div className="app">
    <header className="site-header"><button className="brand" onClick={leave} aria-label="Consequences home"><Mark/><span>CONSEQUENCES</span></button><div className="header-right"><span className="edition"><i/> WORLD BUILD · 0.8.1</span><button className="icon-button help-button" onClick={() => setHelp(true)} aria-label="How to play"><BookOpen size={17}/><span>How to play</span></button><button className="icon-button" onClick={() => setSettings(true)} aria-label="Settings and your data"><Settings2 size={17}/></button>{view && <button className="icon-button" onClick={leave} aria-label="Return home"><LogOut size={17}/></button>}</div></header>
    {(error||notice)&&<div className={`app-feedback ${error?'is-error':''}`} role={error?'alert':'status'}><span>{error||notice}</span><button className="icon-button" onClick={()=>{setError('');setNotice('');}} aria-label="Dismiss message"><X size={17}/></button></div>}
    {!view ? <main className="home-shell">
      {!!sessions.length && !invitation && creating===null && <section className="resume-section local-resumes"><div className="resume-heading"><div className="eyebrow">YOUR STORIES</div>{sessions.length>4&&<button className="text-button" onClick={()=>setAllSessions(x=>!x)}>{allSessions?'Show recent':`Show all ${sessions.length}`} <ChevronDown size={13}/></button>}</div><div className="resume-list">{sessions.slice(0,allSessions?sessions.length:4).map(s => <button key={`${s.id}:${s.seat}`} onClick={() => open(s)} disabled={!!busy}><span className="resume-initial">{s.name[0]}</span><span><strong>{s.title||'The last entry'}</strong><small>{s.name} {s.practice?'· Practice':''}{s.turnNumber?` · Turn ${s.turnNumber}`:s.exchange?` · Exchange ${s.exchange}`:''}<span className={`resume-status ${s.ended?'is-ended':''}`}>{s.turn?`Last seen: ${s.turn}`:'Continue'}</span></small></span><ArrowUpRight size={17}/></button>)}</div></section>}
      {creating!==null?<WorldBuilder practice={creating} busy={!!busy} onCancel={()=>setCreating(null)} onStart={choice=>create(creating,choice)}/>:<><section className="home-story"><div className="eyebrow"><i/> FROM THE NOTEBOOKS · RUNNING ON DESTINY</div><h1>Your turn.<br/>A world <em>changed.</em></h1><p className="home-intro">Say something. Make a promise. Follow a suspicion.<br className="desktop-break"/> Then discover what happens when your choices meet.</p><div className="home-actions"><button className="primary-button" disabled={!!busy} onClick={() => invitation ? join() : bundledApp() ? create(false) : setCreating(false)}>{busy ? <LoaderCircle size={18} className="spin"/> : <Users size={18}/>}<span>{invitation ? 'Take the second seat' : bundledApp() ? 'Play online in your browser' : 'Start a two-player match'}</span><ArrowUpRight size={18}/></button>{!invitation && <button className="text-button" disabled={!!busy} onClick={() => setCreating(true)}>{bundledApp() ? 'Practice on this phone' : 'Try a practice match'} <ArrowRight size={16}/></button>}{!invitation && <button className="text-button" onClick={() => setJoinForm(x=>!x)}><Link2 size={15}/> Have an invitation?</button>}</div>{joinForm&&<form className="join-form" onSubmit={e=>{e.preventDefault();readInvitation();}}><label htmlFor="join-link">Paste your invitation</label><input id="join-link" type="url" autoCapitalize="none" autoCorrect="off" value={joinText} onChange={e=>setJoinText(e.target.value)} placeholder="https://…/?room=…#invite=…" required/><button className="secondary-button" type="submit">Open invitation <ArrowRight size={14}/></button></form>}<p className="fine-print"><LockKeyhole size={12}/>{invitation ? 'Your invitation opens the second player’s private perspective.' : bundledApp() ? 'Private alpha. Practice saves on this phone.' : 'Private prototype. Progress saves between visits.'}</p><p className="foundation-origin">A world of possibility, relation and becoming. What happens here changes what can happen next.</p><div className="three-lines"><span><b>01</b> Begin with one clear goal.</span><span><b>02</b> Several prompts. Fifteen virtual minutes.</span><span><b>03</b> Live with the consequences.</span></div></section>
      <section className="case-cover"><ArchiveArt/><div className="case-cover-copy"><div className="eyebrow">A SHARED WORLD WITH CONSEQUENCES</div><h2>The Night Watch</h2><p>A death during the last watch.<br/>Three witnesses. Two competing investigators.</p><span className="case-format"><Users size={13}/> 2 players <span>·</span> Choose your world · 15-minute turns</span></div></section></>}
      {!!accountSeats.filter(a=>!sessions.some(s=>s.id===a.id&&s.seat===a.seat)).length&&<section className="resume-section"><div className="eyebrow">LINKED TO YOUR ACCOUNT</div><div className="resume-list">{accountSeats.filter(a=>!sessions.some(s=>s.id===a.id&&s.seat===a.seat)).map(s=><button key={`${s.id}:${s.seat}`} onClick={()=>recover(s)} disabled={!!busy}><span className="resume-initial">{s.name[0]}</span><span><strong>{s.title}</strong><small>Recover {s.name}’s seat {s.ended?'· Closed':''}</small></span><ArrowUpRight size={17}/></button>)}</div></section>}<footer className="home-footer"><span>WHAT HAPPENS WHEN THINGS MEET.</span><span>A simulation in becoming.</span></footer>
    </main> : <main className="game-shell">
      <div className="chapter-bar"><span>{currentCase ? 'CASE 002' : 'CASE 001'} <i/> {view.setup?view.environment?.place:currentCase?'THE OBSERVATORY':'THE EAST ARCHIVE'}</span><span>{view.clock}</span></div><section className="game-title-row"><div><h1>{view.scenario.title}<span>.</span></h1><p>You are <strong>{view.name}</strong>. What you do here will stay here.</p></div><div className="exchange-badge"><span>{view.turn?'TURN':'EXCHANGE'}</span><strong>{String(view.turn?.number||Math.min(view.exchange,view.scenario.maxExchanges)).padStart(2,'0')}</strong><span>{view.turn?'15 VIRTUAL MINUTES':`OF ${view.scenario.maxExchanges}`}</span></div></section>
      {view.practice && <div className="practice-strip"><Sparkles size={14}/><span>{bundledApp()?'On-device practice':'Practice'} · {view.otherName} is an automatic helper who follows a lead, shares and waits.</span><button onClick={leave}>Play with someone <ArrowUpRight size={12}/></button></div>}{offline && <div className="connection-strip" role="status"><RefreshCw size={14}/><span>The saved world could not be refreshed. Your last confirmed scene is shown.</span><button className="text-button" disabled={!!busy} onClick={refreshCurrent}>Try again</button></div>}
      {!view.joined && <section className="lobby"><Users size={23}/><div><h2>The other seat is open.</h2><p>Invite someone to choose their own character. Your perspectives stay separate.</p><small>This prototype is private. Your invitee also needs access to the app. Replacing the link expires the earlier invitation.</small>{session?.invite && <input aria-label="Private invitation link" readOnly value={invitationLink(onlineOrigin(),session.id,session.invite)} onFocus={e => e.target.select()}/>}</div><div className="invite-actions">{!session?.invite?<button className="secondary-button" disabled={!!busy} onClick={renewInvitation}><Link2 size={15}/> Create invitation</button>:<><button className="secondary-button" disabled={!!busy} onClick={share}><Share2 size={15}/> Share invitation</button><button className="text-button" disabled={!!busy} onClick={copy}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? 'Copied' : 'Copy link'}</button><button className="text-button replace-invite" disabled={!!busy} onClick={renewInvitation}>Replace link</button></>}</div></section>}
      {view.setup?.phase==='setup'?<MatchSetup key={`${view.roomId}:${view.seat}`} view={view} busy={!!busy} onConfirm={confirmWorld}/>:<><TurnRibbon view={view} onNotebook={()=>setTab('notebook')} onWrite={focusComposer}/>
      <button className="mobile-goal" onClick={() => setTab('notebook')}><Flag size={14}/><span><small>YOUR GOAL</small> {view.scenario.goal}</span><ArrowUpRight size={14}/></button><nav className="mobile-tabs" aria-label="Game panels"><button aria-pressed={tab === 'scene'} onClick={() => setTab('scene')}><Eye size={15}/> The scene</button><button aria-pressed={tab === 'notebook'} onClick={() => setTab('notebook')}><NotebookPen size={15}/> Your notebook <span>{view.discoveries.length}</span></button></nav>
      <div className={`play-grid tab-${tab}`}>
        <section className="scene-panel" aria-label="Your scene"><WorldContext view={view}/><ExchangeRecap view={view}/><div className="section-label perspective-label"><span><Eye size={13}/> YOUR PERSPECTIVE</span><span><LockKeyhole size={11}/> PRIVATE</span></div>{view.entries.length>currentEntries.length&&<button className="earlier-scenes" onClick={()=>setShowEarlier(true)}>Opening and earlier scenes ({view.entries.length-currentEntries.length}) <ChevronDown size={13}/></button>}{showEarlier&&<button className="earlier-scenes" onClick={()=>setShowEarlier(false)}>Show latest consequences only</button>}<div className="journal">{currentEntries.map((e, i) => <JournalEntry key={e.id} entry={e} latest={i === currentEntries.length - 1}/>)}</div>
          {view.result ? <section className={`result-panel ${view.result.achieved ? 'achieved' : ''}`}><Flag size={25}/><div className="eyebrow">YOUR STARTING GOAL</div><h2>{view.result.achieved ? 'Achieved.' : 'Not achieved.'}</h2><p>{view.result.reason}</p>{view.result.debrief&&<details className="case-debrief"><summary>What actually happened <ChevronDown size={13}/></summary><p>{view.result.debrief.sequence}</p></details>}<small>The consequences remain. Your starting goal has not changed.</small><button className="secondary-button" onClick={leave}>Return to the beginning <ArrowRight size={15}/></button></section> : <section className={`composer ${view.canSubmit ? '' : 'is-locked'}`}><div className="composer-heading"><i className={view.canSubmit ? 'ready' : ''}/><strong>{view.canSubmit?view.turn?.reaction?.isYours?'Your response':view.turn?'Your next action':'Your intention':view.committed?'Saved and locked':'The world is waiting'}</strong><span>{view.turn?`${(view.turn.availableMinutes??view.turn.remainingMinutes).toFixed(1)} min available`: `${Number(view.committed)+Number(view.otherCommitted)} / 2 committed`}</span></div>
            {!view.canSubmit ? <div className="waiting-state">{view.turn ? <><Hourglass size={24}/><p>{view.turn.reaction?`${view.turn.reaction.name} can respond.`:`${view.turn.activeName} has control.`}</p><span>Your notebook remains available. You will be offered a response when your character encounters a direct interaction.</span></> : view.committed ? <><LockKeyhole size={23}/><p>“{view.ownPrompt}”</p><span>Your intention is locked. The consequences arrive after {view.otherName} commits.</span></> : <><Hourglass size={24}/><p>{view.joined ? 'The world is waiting.' : 'A story needs someone on the other side.'}</p><span>{view.joined ? `${view.otherName} contributes first. Their intention stays private.` : 'Send your invitation, or try a practice match from the home screen.'}</span></>}</div> : <><label className="sr-only" htmlFor="intention">Your next intention</label><textarea ref={composer} id="intention" maxLength={600} value={prompt} disabled={!!busy} placeholder="Say what you try. Let the world answer." onChange={e => changePrompt(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !busy) { e.preventDefault(); void (understood ? commit() : review()); } }}/>{view.turn?.continuing&&<p className="turn-continuation">Unfinished activity: {view.turn.continuing.summary}. You can continue it or choose a new action.</p>}{preview&&(understood?<IntentionReview review={preview} onEdit={editIntention} availableMinutes={view.turn?.availableMinutes}/>:<ClarificationCard review={preview} onEdit={editIntention} onHelp={()=>setHelp(true)}/>)}<div className="composer-footer">{view.turn&&<div className="turn-actions">{(view.turn.continuing||view.turn.reaction?.isYours)&&<button className="text-button" disabled={!!busy||offline} onClick={()=>controlTurn('Continue existing activity')}>{view.turn.reaction?'Continue existing activity':'Continue unfinished action'} <ArrowRight size={12}/></button>}<button className="text-button" disabled={!!busy||offline||!!view.turn.reaction} onClick={()=>controlTurn('End turn')}>End turn <ArrowRight size={12}/></button></div>}<button className="text-button syntax-button" onClick={() => setHelp(true)}>Ways to act <ChevronDown size={12}/></button><span className="character-count">{prompt.length}/600</span><button className="primary-button compact-button" disabled={!!busy || !prompt.trim() || offline} onClick={() => understood ? commit() : review()}>{busy ? <LoaderCircle size={15} className="spin"/> : understood ? <LockKeyhole size={14}/> : <ArrowRight size={15}/>} {understood ? view.turn?'Act':'Commit intention' : 'Review intention'}</button></div></>}{draftStatus&&view.canSubmit&&<p className="draft-status" role="status">{draftStatus}</p>}</section>}
          {!!ownIntentions.length && <details className="exchange-history"><summary>Your earlier intentions <ChevronDown size={13}/></summary>{[...ownIntentions].reverse().map(h => <div key={h.exchange}><span>{String(h.exchange).padStart(2, '0')}</span><p>{h.ownPrompt}</p><small>{duration(h.minutes)} elapsed</small></div>)}</details>}
        </section>
        <aside className="notebook-panel" aria-label="Your private notebook"><section className="goal-panel"><div className="eyebrow"><Flag size={13}/> YOUR ONE CLEAR GOAL</div><h2>{currentCase ? <>Establish the<br/>killer.</> : <>Establish the<br/>first account.</>}</h2><p>{view.scenario.goal}</p>{currentCase&&!view.result&&<p className="inquiry-clock">Inquiry closes in {view.remainingMinutes} simulated minutes{view.turn?'.':', or at exchange 30.'}</p>}<details><summary>What counts as success <ChevronDown size={12}/></summary><p>{view.scenario.rules}</p></details>{!view.result&&<div className="goal-actions">{!bundledApp()&&<button onClick={enableAlerts} aria-label="Enable turn alerts while the app remains open"><Bell size={13}/>{alerts?'Turn alerts on':'Turn alerts'}</button>}<button onClick={resign} disabled={!!busy}>Resign match</button></div>}<p className="alerts-note">{bundledApp()?'Practice waits for you on this device.':'Turn alerts work while the app remains open.'}</p></section>
          <CharacterOrientation key={`${view.roomId}:${view.seat}`} view={view} onPrepare={suggest}/><SituatedCapacity view={view} onPrepare={suggest}/><CaseBoard view={view} onPrepare={suggest} disabled={!!busy}/><section className="surroundings"><div className="section-label"><span>WITHIN YOUR ACCESS</span><button className="icon-button" onClick={() => suggest('Look around')} aria-label="Prepare a look around"><Eye size={14}/></button></div>{view.surroundings.map(item => <div className="surrounding" key={item.id}><span className="object-symbol">{item.kind === 'person' ? item.name[0] : <BookOpen size={14}/>}</span><div><strong>{item.name}</strong><small>{item.range} · {item.direction}</small></div><button className="icon-button" onClick={() => suggest(currentCase ? item.kind==='person' ? `Ask ${item.name} about last night` : item.kind==='trace' ? `Inspect ${item.name}` : `Approach ${item.name}` : item.kind === 'trace' && item.range === 'Within reading distance' ? `Read ${item.name}` : `Approach ${item.name}`)} aria-label={`Prepare an intention involving ${item.name}`}><ArrowUpRight size={14}/></button></div>)}</section>
          {!!view.knownPlaces?.length&&<section className="known-places"><div className="section-label"><span>REMEMBERED PLACES</span></div><p className="small-explanation">Earlier positions, not live tracking.</p><div>{view.knownPlaces.map(x=><button key={x.id} onClick={()=>suggest(`Approach ${x.name}`)}>{x.name}<ArrowUpRight size={12}/></button>)}</div></section>}
          {!!view.inventory?.length&&<section className="inventory-section"><div className="section-label"><span>PHYSICALLY HELD</span></div>{view.inventory.map(x=><div key={x.id}><BookOpen size={14}/><span>{x.name}</span><button onClick={()=>suggest(`Drop ${x.name}`)}>Release <ArrowUpRight size={12}/></button></div>)}</section>}
          {!!view.commitments?.length&&<section className="commitments-section"><div className="section-label"><span>YOUR SPOKEN COMMITMENTS</span></div>{view.commitments.map((c,i)=><div key={i}><small>To {c.name}</small><p>“{c.words}”</p><span>{c.status==='broken'?'The listener treated a later accusation as a breach.':c.status==='retracted'?'Your retraction was heard. The earlier words remain in memory.':'Heard. What you do next remains yours.'}</span></div>)}</section>}
          <section className="evidence-section"><div className="section-label"><span>RETAINED TRACES</span><span className="count-label">{view.discoveries.length}</span></div>{view.discoveries.length>0&&<div className="evidence-filters" aria-label="Filter retained traces">{[['all','All'],['direct','Firsthand'],['reported','Reported']].map(([value,label])=><button key={value} aria-pressed={evidenceFilter===value} onClick={()=>setEvidenceFilter(value)}>{label}</button>)}</div>}{filteredDiscoveries.length ? filteredDiscoveries.map(d => <Evidence key={d.key||d.root} discovery={d} otherName={view.otherName} onShare={suggest}/>) : <div className="empty-evidence"><BookOpen size={23}/><p>{evidenceFilter==='all'?'Nothing acquired yet.':evidenceFilter==='direct'?'No firsthand traces yet.':'No reported traces yet.'}</p><span>Inspect a trace or question a witness. A received claim is yours to assess.</span></div>}</section>
          <section className="notes-section"><div className="section-label"><span><NotebookPen size={13}/> PRIVATE NOTES</span><LockKeyhole size={11}/></div><label className="sr-only" htmlFor="private-notes">Private notes and hypotheses</label><textarea id="private-notes" maxLength={4000} value={notes} placeholder="A suspicion. A promise. Something you don't want to forget." onChange={e=>changeNotes(e.target.value)}/><div className="note-controls"><span aria-live="polite">{noteStatus || 'Only you receive these notes.'}</span><button disabled={notes === view.notes || offline || noteSaving || noteConflict} onClick={saveNotes}>{noteSaving?'Saving…':'Save note'}</button></div>{noteConflict&&<div className="note-conflict" role="status"><strong>Two versions of your note.</strong><p>Your draft is above. The saved version is:</p><blockquote>{view.notes||'Empty note'}</blockquote><div><button className="secondary-button" onClick={keepDraft}>Keep my draft</button><button className="text-button" onClick={useSavedNote}>Use saved version</button></div><small>Keeping your draft does not save it automatically.</small></div>}</section>
          <section className="condition-panel"><div className="section-label"><span>YOUR CONDITION</span><span>{view.condition.status||'MATTERS'}</span></div>{[['Energy', view.condition.energy], ['Water', view.condition.water], ['Integrity', view.condition.integrity]].map(([label, value]) => <div className="condition-row" key={String(label)}><span>{label}</span><div role="meter" aria-label={String(label)} aria-valuenow={Math.round(Number(value) * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Number(value) * 100}%` }}/></div><small>{Math.round(Number(value) * 100)}%</small></div>)}</section>
        </aside>
      </div></>}<footer className="game-footer"><span><Mark/> WHAT HAPPENS WHEN THINGS MEET.</span><span>{view.practice ? 'PRACTICE' : `${view.name.toUpperCase()}’S PRIVATE PERSPECTIVE`}</span></footer>
    </main>}
    {settings&&<Settings close={closeSettings} view={view} onForgotten={()=>{leave();setSessions([]);setNotes('');setDraftStatus('');}}/>}
    {help && <div className="modal-backdrop" onClick={() => setHelp(false)}><section ref={modal} className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setHelp(false)} aria-label="Close how to play"><X size={21}/></button><div className="eyebrow">BEFORE YOU COMMIT</div><h2 id="help-title">An intention is<br/><em>the beginning.</em></h2><p>Begin with one clear goal. Describe an immediate plan in your own words. Review each attempt and act. In new games you can keep prompting within fifteen virtual minutes, then pass control. A direct encounter may open a brief response. Unfinished activity and its consequences persist.</p><section className="foundation-note" aria-labelledby="foundation-title"><div className="eyebrow" id="foundation-title">THE NOTEBOOKS &amp; DESTINY</div><p>Consequences grows from the notebooks and their exploration of possibility, relation and becoming. DESTINY provides the simulation foundation: bodies, materials, access and history constrain your attempts. An encounter can change what becomes possible next.</p></section><div className="help-examples">{examples.map(([command, explanation]) => <div key={command}><code>{command}</code><span>{explanation}</span></div>)}</div><p className="help-limit">Describe what you try to do. The review confirms the attempted processes before you commit. Bodies, access, resistance and encountered information determine what follows. Witnesses can intervene or report an encounter later; absent people do not automatically learn it. Free-form interpretation needs the app’s language connection. If wording cannot yet be interpreted, clarification costs no turn.</p><button className="primary-button" onClick={() => setHelp(false)}>Return to the scene <ArrowRight size={16}/></button></section></div>}
  </div>;
}
function JournalEntry({ entry: e, latest }: { entry: Entry; latest: boolean }) {
  return <article className={`journal-entry kind-${e.kind} ${latest ? 'latest' : ''} ${['discovery', 'speech'].includes(e.kind) ? 'inset-entry' : ''}`}><div className="entry-meta"><span>{e.kind === 'opening' ? 'THE OPENING' : e.kind === 'private' ? 'YOUR CIRCUMSTANCES' : e.kind === 'discovery' ? 'YOU READ' : e.kind === 'speech' ? <><Volume2 size={12}/> {e.speaker} → {e.addressedTo}</> : e.kind === 'verdict' ? 'AN ACCOUNT ESTABLISHED' : `EXCHANGE ${String(e.exchange).padStart(2, '0')}`}</span>{e.kind === 'discovery' && <span className="entry-source">DIRECT ENCOUNTER</span>}</div>{e.kind === 'discovery' && <h3>{e.title}</h3>}<p>{e.kind === 'speech' ? `“${e.text}”` : e.text}</p>{e.kind === 'speech' && <small className="speech-note">You encountered these words. Their claim is yours to assess.</small>}</article>;
}
function Evidence({ discovery: d, otherName, onShare }: { discovery: Discovery; otherName: string; onShare: (text: string) => void }) {
  return <article className="evidence-card"><span className={`evidence-mode ${d.mode}`}><i/>{d.mode === 'direct' ? 'FIRSTHAND' : d.source?`REPORTED BY ${d.source.toUpperCase()}`:'REPORTED · SOURCE UNCLEAR'}</span><h3>{d.title}</h3><p>{d.text}</p><div><small>Origin: {d.root}</small><button onClick={() => onShare(`Share ${d.shareLabel||d.root} with ${otherName}`)}>Share <ArrowUpRight size={12}/></button></div></article>;
}
