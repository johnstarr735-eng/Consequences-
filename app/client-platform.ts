import type { GameView } from './game-types';
import { deadlineRequest } from '../lib/client-flow.mjs';

export class MatchRequestError extends Error {
  constructor(message:string,public status:number){super(message);this.name='MatchRequestError';}
}

type Platform = {
  bundled: boolean;
  onlineOrigin: string;
  request: (action: string, data: Record<string, unknown>, key?: string) => Promise<unknown>;
  share: (data: { title: string; text?: string; url?: string }) => Promise<void>;
  openOnline: (url: string) => Promise<void>;
  feedback: () => void;
  persist: () => void;
  clear: () => Promise<void>;
};
let platform: Platform | null = null;
export function configurePlatform(value: Platform) { platform = value; }
export function bundledApp() { return platform?.bundled === true; }
export function onlineOrigin() { return platform?.onlineOrigin || location.origin; }
export function persistDevice() { platform?.persist(); }
export function feedback() { platform?.feedback(); }
export async function clearNativeData() { await platform?.clear(); }
export async function openOnline(url = onlineOrigin()) { if (platform) await platform.openOnline(url); }

export async function matchRequest(action: string, data: Record<string, unknown>, key?: string) {
  if (platform) return await platform.request(action, data, key);
  const reading = action === 'read';
  const response = await deadlineRequest(fetch,reading ? `/api/matches?id=${encodeURIComponent(String(data.id))}` : '/api/matches', {
    method: reading ? 'GET' : 'POST', cache: 'no-store',
    headers: { ...(reading ? {} : { 'Content-Type': 'application/json' }), ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    ...(reading ? {} : { body: JSON.stringify({ action, ...data }) }),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Open the app again to sign in, then retry. Your confirmed match is saved.');
  const result = await response.json() as {error?:string};
  if (!response.ok) throw new MatchRequestError(result.error || 'The request could not be completed.',response.status);
  return result;
}

export async function shareContent(data: { title: string; text?: string; url?: string }) {
  if (platform) {await platform.share(data);return 'shared';}
  if (navigator.share) {await navigator.share(data);return 'shared';}
  await navigator.clipboard.writeText(data.url || data.text || '');
  return 'copied';
}
export function downloadJournal(view: GameView, text: string) {
  if (platform) return platform.share({ title: `${view.name}’s Consequences journal`, text });
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `Consequences-${view.name}-exchange-${view.exchange}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve();
}
