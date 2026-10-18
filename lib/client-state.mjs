const PREFIX = 'consequences:';
const ROOM = /^[a-f0-9]{24}$/;
const TOKEN = /^[a-f0-9]{64}$/;

export function invitationLink(origin, id, invite) {
  if (!ROOM.test(id || '') || !TOKEN.test(invite || '')) throw new Error('This invitation is incomplete. Ask the host for a new link.');
  const url = new URL('/', origin);
  url.searchParams.set('room', id);
  url.hash = new URLSearchParams({ invite }).toString();
  return url.href;
}

export function parseInvitation(value, origin) {
  let url;
  try { url = new URL(String(value).trim(), origin); } catch { throw new Error('Paste the complete invitation link.'); }
  if (url.origin !== new URL(origin).origin || url.pathname !== '/' || url.username || url.password) throw new Error('Use a Consequences invitation from this app.');
  const id = url.searchParams.get('room'), invite = new URLSearchParams(url.hash.slice(1)).get('invite');
  if (!id || !invite) throw new Error('Paste the complete invitation link, including its private invitation fragment.');
  invitationLink(origin, id, invite);
  return { id, invite };
}

export function readSessions(storage) {
  try {
    const list = JSON.parse(storage.getItem(`${PREFIX}sessions:v1`) || '[]');
    return Array.isArray(list) ? list.filter(s => ROOM.test(s?.id || '') && TOKEN.test(s?.token || '') && ['A', 'B'].includes(s?.seat) && typeof s?.name === 'string').map(s=>({
      id:s.id,token:s.token,seat:s.seat,name:s.name.slice(0,80)|| (s.seat==='A'?'Mara':'Jonah'),practice:s.practice===true,
      ...(typeof s.title==='string'?{title:s.title.slice(0,200)}:{}),
      ...(TOKEN.test(s.invite||'')?{invite:s.invite}:{}),
      ...(Number.isInteger(s.exchange)&&s.exchange>0?{exchange:s.exchange}:{}),
      ...(Number.isInteger(s.turnNumber)&&s.turnNumber>0?{turnNumber:s.turnNumber}:{}),
      ended:s.ended===true,...(typeof s.turn==='string'?{turn:s.turn.slice(0,100)}:{}),
      ...(Number.isFinite(s.lastOpened)?{lastOpened:s.lastOpened}:{}),
    })) : [];
  } catch { return []; }
}

/** @param {any} storage @param {any} session @param {any} [view] */
export function rememberSession(storage,session,view=null){
  const existing=readSessions(storage),old=existing.find(x=>x.id===session.id&&x.seat===session.seat);
  const saved={...old,...session,lastOpened:Date.now(),...(view?{name:view.name,title:view.scenario.title,exchange:view.turn?view.exchange:Math.min(view.exchange,view.scenario.maxExchanges),...(view.turn?{turnNumber:view.turn.number}:{}),ended:!!view.result,turn:view.result?'Closed':!view.joined?'Waiting for player':view.setup?.phase==='setup'?'Choosing characters':view.turn?.reaction?.isYours?'Your response':view.committed?'Waiting':view.canSubmit?'Your turn':'Other player has control'}:{})};
  try{storage.setItem(`${PREFIX}sessions:v1`,JSON.stringify([saved,...existing.filter(x=>!(x.id===session.id&&x.seat===session.seat))]));return true;}catch{return false;}
}

export function draftKey(id, seat) { return `${PREFIX}draft:${id}:${seat}`; }
export function readDraft(storage, id, seat) {
  try {
    const d = JSON.parse(storage.getItem(draftKey(id, seat)) || 'null');
    if (!d || !Number.isInteger(d.exchange) || d.exchange < 1) return null;
    return { exchange: d.exchange, prompt: typeof d.prompt === 'string' ? d.prompt.slice(0, 600) : '', notes: typeof d.notes === 'string' ? d.notes.slice(0, 4000) : null, notesBase: typeof d.notesBase === 'string' ? d.notesBase.slice(0, 4000) : '', requestId: typeof d.requestId === 'string' && /^[a-zA-Z0-9_-]{12,80}$/.test(d.requestId) ? d.requestId : null };
  } catch { return null; }
}
export function writeDraft(storage, id, seat, draft) {
  try { storage.setItem(draftKey(id, seat), JSON.stringify(draft)); return true; } catch { return false; }
}

export function forgetDevice(storage) {
  const keys = [];
  for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (key?.startsWith(PREFIX)) keys.push(key); }
  for (const key of keys) storage.removeItem(key);
}

// Explicitly enumerate the requesting player's view; tokens, invitations, server
// world graphs and injected/unknown properties never enter a portable journal.
export function perspectiveExport(view, now = new Date()) {
  return {
    format: 'consequences-perspective', version: 1, exportedAt: now.toISOString(),
    notice: 'Contains your private notes and discoveries. Share only with people you choose. This journal cannot restore a player seat.',
    case: view.scenario.title, player: view.name, exchange: view.exchange, clock: view.clock,
    goal: view.scenario.goal, notes: view.notes,
    ...(view.agency?{orientation:{purpose:view.agency.purpose?.text||null,selfAccount:view.agency.selfAccount||null,reflections:view.agency.reflections.map(r=>({kind:r.kind,text:r.text})),presentations:view.agency.presentations.map(r=>({words:r.words,to:r.to,reached:r.reached})),encounteredConduct:view.agency.encounteredConduct.map(r=>({text:r.text}))}}:{}),
    entries: view.entries.map(e => ({ exchange: e.exchange, kind: e.kind, title: e.title, text: e.text, speaker: e.speaker, addressedTo: e.addressedTo })),
    discoveries: view.discoveries.map(d => ({ title: d.title, text: d.text, mode: d.mode, source: d.source, origin: d.root })),
    intentions: view.completedExchanges.map(h => ({ exchange: h.exchange, minutes: h.minutes, intention: h.ownPrompt })),
    result: view.result ? { achieved: view.result.achieved, reason: view.result.reason, winnerNames: [...view.result.winnerNames], ...(view.result.debrief ? { debrief: { culprit: view.result.debrief.culprit, method: view.result.debrief.method, sequence: view.result.debrief.sequence } } : {}) } : null,
  };
}
