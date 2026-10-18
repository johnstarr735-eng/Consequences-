import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import Consequences from '../app/play';
import { configurePlatform } from '../app/client-platform';
import { parseInvitation, invitationLink } from '../lib/client-state.mjs';
import { PracticeStore } from './practice-store';
import '../app/globals.css';
import '../app/play-improvements.css';

const ONLINE = 'https://consequences-first-light.ed222944873.chatgpt.site';
const PREFS = 'consequences.device-ui.v1';
const store = new PracticeStore();
async function loadPractice(){const {LocalPractice}=await import('../lib/local-practice.mjs');return new LocalPractice(store);}
let practice:ReturnType<typeof loadPractice>|null=null;
function getPractice(){return practice||=(loadPractice().catch(()=>{practice=null;throw new Error('Practice could not open. Your confirmed saves remain on this device. Close the app and try again.');}));}
let writes = Promise.resolve();
let backupTimer:ReturnType<typeof setTimeout>|null=null;
function persist() {
  if(backupTimer)clearTimeout(backupTimer);
  backupTimer=setTimeout(()=>{backupTimer=null;flushBackup();},160);
}
function flushBackup(){
  if(backupTimer){clearTimeout(backupTimer);backupTimer=null;}
  writes=writes.catch(()=>{}).then(async()=>{
    const snapshot:Record<string,string>={};
    for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('consequences:'))snapshot[key]=localStorage.getItem(key)||'';}
    await Preferences.set({key:PREFS,value:JSON.stringify(snapshot)});
  });
  void writes.catch(()=>window.dispatchEvent(new Event('consequences:storage-error')));
}

configurePlatform({
  bundled: true, onlineOrigin: ONLINE,
  request: async(action,data,key) => {
    if(action==='list')return{sessions:[],signedIn:false};
    if(action==='attach')return{linked:false};
    return(await getPractice()).request(action,data,key);
  },
  openOnline: async url => {
    const safe = new URL(url);
    if(safe.origin!==ONLINE || safe.pathname!=='/' || safe.username || safe.password)throw new Error('Use the Consequences game link.');
    await Browser.open({url:safe.href,toolbarColor:'#111b18'});
  },
  share: async data => {await Share.share({...data,dialogTitle:'Share from Consequences'});},
  feedback: () => {void Haptics.impact({style:ImpactStyle.Light}).catch(()=>{});},
  persist,
  clear: async () => {if(backupTimer){clearTimeout(backupTimer);backupTimer=null;}await writes.catch(()=>{});const loaded=practice?await practice.catch(()=>null):null;await loaded?.flush();await store.clear();await Preferences.remove({key:PREFS});},
});

async function invitation(url:string){
  // Development scheme carries only a one-use seat invitation, never an account
  // bearer. Universal/App Links await the owner's final identifiers and domain.
  const incoming=new URL(url);
  let canonical=url;
  if(incoming.protocol==='consequences-alpha:'&&incoming.hostname==='join')canonical=`${ONLINE}/?${incoming.searchParams.toString()}${incoming.hash}`;
  const parsed=parseInvitation(canonical,ONLINE);
  await Browser.open({url:invitationLink(ONLINE,parsed.id,parsed.invite),toolbarColor:'#111b18'});
}

class AppBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  render(){return this.state.failed?<main className="mobile-failure"><h1>The world is waiting.</h1><p>The app could not open this screen. Your confirmed practice save remains on this device.</p><button className="primary-button" onClick={()=>location.reload()}>Open again</button></main>:this.props.children;}
}

async function boot(){
  try {
    const {value}=await Preferences.get({key:PREFS});
    if(value){const saved=JSON.parse(value);if(saved&&typeof saved==='object')for(const [key,data] of Object.entries(saved))if(key.startsWith('consequences:')&&typeof data==='string'&&localStorage.getItem(key)===null)localStorage.setItem(key,data);}
  }catch{/* Keep any existing device UI data if Preferences cannot be read. */}
  createRoot(document.getElementById('root')!).render(<AppBoundary><Consequences/></AppBoundary>);
  await App.addListener('appStateChange',({isActive})=>{document.documentElement.dataset.background=isActive?'false':'true';if(isActive)window.dispatchEvent(new Event('consequences:resume'));else flushBackup();});
  await App.addListener('backButton',()=>{const e=new Event('consequences:back',{cancelable:true});window.dispatchEvent(e);if(!e.defaultPrevented)void App.exitApp();});
  await App.addListener('appUrlOpen',({url})=>{void invitation(url).catch(()=>window.dispatchEvent(new Event('consequences:bad-invite')));});
  const launch=await App.getLaunchUrl();if(launch?.url)await invitation(launch.url).catch(()=>{});
}
void boot().catch(()=>{const root=document.getElementById('root');if(root&&!root.hasChildNodes())root.textContent='Consequences could not start. Close the app and try again.';});
