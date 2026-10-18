'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Download, Smartphone, Trash2, X } from 'lucide-react';
import type { GameView } from './game-types';
import { bundledApp, clearNativeData, downloadJournal, persistDevice } from './client-platform';
import { forgetDevice, perspectiveExport } from '../lib/client-state.mjs';
import { useDialog } from './use-dialog';

type Props = { close: () => void; view: GameView | null; onForgotten: () => void };
export default function Settings({ close, view, onForgotten }: Props) {
  const ref = useRef<HTMLElement>(null), [message, setMessage] = useState(''), [clearing, setClearing] = useState(false),[removing,setRemoving]=useState(false);
  const [reading, setReading] = useState(() => { try { return localStorage.getItem('consequences:reading') || 'standard'; } catch { return 'standard'; } });
  const dismiss=useCallback(()=>{if(!removing)close();},[removing,close]);
  useDialog(true, ref, dismiss);
  useEffect(()=>{if(!removing)return;const block=(event:Event)=>event.preventDefault();window.addEventListener('consequences:back',block,true);return()=>window.removeEventListener('consequences:back',block,true);},[removing]);
  function changeReading(value: string) {
    setReading(value); document.documentElement.dataset.reading = value;
    try { localStorage.setItem('consequences:reading', value); persistDevice(); } catch { setMessage('Reading size changed for this visit. This device could not save the preference.'); }
  }
  async function exportJournal() {
    if (!view) return;
    try { await downloadJournal(view, JSON.stringify(perspectiveExport(view), null, 2)); setMessage('Your saved perspective is ready. It includes private notes; choose carefully who receives it.'); }
    catch (e) { if ((e as Error)?.name !== 'AbortError') setMessage('The journal could not be exported. Your saved game is unchanged.'); }
  }
  async function clear() {
    if(removing)return;setRemoving(true);
    try {
      onForgotten();
      forgetDevice(localStorage); forgetDevice(sessionStorage); await clearNativeData();
      document.documentElement.dataset.reading = 'standard'; close();
    } catch { setMessage('Some local data could not be removed. Try again before leaving this device.'); setClearing(false);setRemoving(false); }
  }
  return <div className="modal-backdrop" onClick={dismiss}><section className="help-modal settings-modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()}>
    <button className="modal-close icon-button" onClick={dismiss} disabled={removing} aria-label="Close settings"><X size={21}/></button>
    <div className="eyebrow">MAKE YOURSELF AT HOME</div><h2 id="settings-title">Your place<br/><em>in the world.</em></h2>
    <section className="setting-section"><h3>Reading</h3><p>Choose a comfortable size for the story, evidence and notes. Your device’s accessibility settings still apply.</p><fieldset className="reading-options"><legend className="sr-only">Story text size</legend>{[['standard', 'Standard'], ['large', 'Large'], ['larger', 'Larger']].map(([value, label]) => <label key={value}><input type="radio" name="reading-size" value={value} checked={reading === value} onChange={() => changeReading(value)}/><span>{label}</span></label>)}</fieldset></section>
    <section className="setting-section"><h3><Smartphone size={16}/> {bundledApp() ? 'On this phone' : 'Keep it close'}</h3>{bundledApp() ? <p>Practice runs on this device, including without a connection. Multiplayer opens the private online game in your browser. Native multiplayer sign-in and closed-app alerts are still in development.</p> : <><p>On iPhone or iPad, open in Safari and use Share → Add to Home Screen. On Android, use your browser’s Install app or Add to Home screen option.</p><p>Online matches need a connection. Turn alerts currently work only while the app is open.</p></>}</section>
    <section className="setting-section"><h3>Your data</h3><p>{bundledApp() ? 'Practice worlds and drafts are saved locally. Your device’s backups may include app data. There is no analytics or advertising SDK in this build. An exported journal leaves the app when you choose to share it.' : 'Online worlds and saved notes are held on the game server. This browser holds player keys and unfinished drafts. Each player receives their own perspective. The app has no analytics or advertising SDK.'}</p><p>Free-form language interpretation is pending. When connected, only the submitting player’s prompt and filtered perspective are sent for interpretation.</p>{view && <button className="secondary-button" onClick={exportJournal}><Download size={15}/> Export saved journal <ArrowUpRight size={14}/></button>}<small>Exports include saved notes and findings. Unsubmitted drafts and player keys are excluded.</small></section>
    <section className="setting-section"><h3>Forget this device</h3><p>{bundledApp() ? 'Remove practice saves, player keys, drafts and reading preferences from this app. Local practice cannot be recovered afterwards.' : 'Remove player keys, drafts and preferences from this browser. Server matches and account links remain. An unlinked seat can become inaccessible.'}</p>{clearing ? <div className="confirm-forget"><p>Remove this device’s data now?</p><button className="danger-button" disabled={removing} onClick={clear}>{removing?'Removing…':'Remove local data'}</button><button className="text-button" disabled={removing} onClick={() => setClearing(false)}>Keep my data</button></div> : <button className="text-button" onClick={() => setClearing(true)}><Trash2 size={14}/> Forget local data…</button>}</section>
    {message && <p className="settings-message" role="status">{message}</p>}
    <p className="settings-version">Consequences · Build 0.8.1 · Private alpha</p>
  </section></div>;
}
