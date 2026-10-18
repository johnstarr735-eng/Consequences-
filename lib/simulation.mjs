import { World, Person, Form } from '../engine/destiny-v113/destiny_unified_kernel.js';
import { initializeWorldTime, deriveWorldConditions, snapshotReality, accessibilityPhase, integrationStep } from '../engine/controlled-moment-engine.js';
import { distance, reachRadius, formRadius } from '../engine/destiny-v113/destiny_embodied_geometry.js';
import { encodeWorld, decodeWorld } from './world-codec.mjs';

export const SCENARIO = {
  title: 'The last entry', subtitle: 'An archive. Two investigators. One missing ledger.',
  goal: 'Be first to lodge a supported account of who moved ledger L-17.',
  rules: 'Identify the person and destination using “File: [name] moved L-17 to the [east/west] archive”. Your known trace records are attached automatically: you need two different original traces and must have read at least one yourself. Lodge the account within speaking distance of Nell. Shared copies retain their original source. Two valid accounts at the same in-world time draw. The test ends after 16 exchanges or three simulated days; otherwise both goals fail.',
  maxExchanges: 16,
};

export const NAMES = { A: 'Mara', B: 'Jonah', N: 'Nell', receipt: 'Receipt', docket: 'Counterfoil', ledger: 'Ledger' };
const TRACES = {
  receipt: { title: 'Borrowing receipt', text: '09:10 — Nell signed ledger L-17 out of the reading room. Destination: east archive.', event: 'prior:signout' },
  docket: { title: 'Archive counterfoil', text: '09:20 — Ledger L-17 received in the east archive. Delivered by Nell; receipt checked against the borrowing record.', event: 'prior:arrival' },
  ledger: { title: 'Ledger endpaper', text: 'L-17. East archive accession, 09:20. Brought from the reading room by Nell; accession witnessed and countersigned.', event: 'prior:accession' },
};
const OTHER = { A: 'B', B: 'A' };
const DAY = 1440;
const clean = x => String(x || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();

export class GameError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function addEntry(state, audience, kind, text, extra = {}) {
  const id = `e${++state.serial}`;
  state.entries.push({ id, audience: [...new Set(audience)], kind, text, exchange: state.exchange, at: state.world.elapsedDays, ...extra });
  return id;
}

function makePerson(id, pos) {
  const p = new Person(id, { pos, energy: .88, bodyWater: .88, bodyWarmth: .74, receptor: .8, attention: .75, retention: .75 });
  p.age = 32; p.baseAge = 32; p.sleepDebt = .12; p.clothing = .7; p.injury = 0; p.illness = 0;
  p.learnedScripts = ['archive-en']; // Established starting history for these people, not universal literacy.
  return p;
}

export function createState() {
  const world = new World(6, 6);
  world.seed = 17017; world.terrain = new Map(); world.elapsedDays = .5;
  world.add(makePerson('A', { x: 1.5, y: 2.3 }));
  world.add(makePerson('B', { x: 3, y: 2.3 }));
  world.add(makePerson('N', { x: 2.25, y: 3.5 }));
  for (const [id, pos] of Object.entries({ receipt: { x: .92, y: 2.3 }, docket: { x: 3.58, y: 2.3 }, ledger: { x: 2.25, y: 1.35 } })) {
    world.add(new Form(id, { pos, stock: .06, rigidity: .4, hardness: .1, visibility: .9, fiber: .4, nutrient: 0, organic: 0, moisture: .1 }));
  }
  initializeWorldTime(world, { dtDays: 1 / 24 }); deriveWorldConditions(world);
  accessibilityPhase(world, snapshotReality(world));
  const state = {
    format: 1, world, startedAt: world.elapsedDays, exchange: 1, serial: 0,
    joined: false, pending: {}, receipts: {}, entries: [], signals: [], discoveries: { A: [], B: [] },
    notes: { A: '', B: '' }, history: [], result: null,
    actuality: [
      { id: 'prior:signout', actor: 'N', object: 'ledger', from: 'reading room', to: 'east archive', time: '09:10' },
      { id: 'prior:arrival', actor: 'N', object: 'ledger', to: 'east archive', time: '09:20' },
      { id: 'prior:accession', actor: 'N', object: 'ledger', to: 'east archive', time: '09:20' },
    ],
  };
  addEntry(state, ['A', 'B'], 'opening', 'The archive is quiet. Ledger L-17 has left the reading room. Nell is still here. You and another investigator have been asked to establish who moved it, and where it went.');
  addEntry(state, ['A'], 'private', 'A receipt is close beside you, toward the west. You can see the paper; its words will only become evidence when you read it.');
  addEntry(state, ['B'], 'private', 'A counterfoil is close beside you, toward the east. You can see the paper; its words will only become evidence when you read it.');
  return state;
}

export function packState(state) { return JSON.stringify(encodeWorld(state)); }
export function unpackState(text) { return decodeWorld(JSON.parse(text)); }

function visible(state, seat, target) {
  const f = state.world.forms.get(target), p = state.world.forms.get(seat);
  return !!(f?.alive && p?.alive && (seat === target || state.world._accessState?.get(`${seat}|${target}`)?.active));
}
function canRead(state, seat, target) {
  const p = state.world.forms.get(seat), f = state.world.forms.get(target);
  return p.learnedScripts?.includes('archive-en') && visible(state, seat, target) && distance(p.pos, f.pos) <= reachRadius(p) + formRadius(f) + .03;
}
function canHear(state, from, to) {
  const a = state.world.forms.get(from), b = state.world.forms.get(to);
  // Explicit prototype calibration: unobstructed voice, finite range, no walls in this scene.
  return !!(a?.alive && b?.alive && distance(a.pos, b.pos) <= 1.85 && (b.apparatus?.receptor || 0) > .1);
}
function targetFor(state, seat, raw) {
  const name = clean(raw).toLowerCase().replace(/^(?:the|a)\s+/, '').replace(/[.!?]+$/, '').trim();
  const aliases = { mara: 'A', jonah: 'B', nell: 'N', receipt: 'receipt', 'borrowing receipt': 'receipt', 'west desk': 'receipt',
    docket: 'docket', counterfoil: 'docket', 'archive counterfoil': 'docket', 'east desk': 'docket', ledger: 'ledger', 'ledger l-17': 'ledger', 'l-17': 'ledger' };
  const id = aliases[name];
  if (!id || (!visible(state, seat, id) && !state.world.forms.get(seat).known?.has(id))) {
    throw new GameError('Name something you can see or have encountered: for example Receipt, Counterfoil, Ledger or Nell.');
  }
  return id;
}

export function parseIntention(state, seat, text) {
  const prompt = clean(text);
  if (!prompt || prompt.length > 600) throw new GameError('Write one intention, up to 600 characters.');
  let m;
  if (/^(?:i\s+)?(?:wait|stay|rest)(?:\s+(?:here|still|for\s+(?:one|1)\s+hour))?[.!]?$/i.test(prompt)) return { kind: 'wait', duration: 60 / DAY, summary: 'Wait for one hour', prompt };
  if (/^(?:i\s+)?(?:look|look around|observe|survey the room)[.!]?$/i.test(prompt)) return { kind: 'look', duration: 1 / DAY, summary: 'Look around', prompt };
  if ((m = prompt.match(/^(?:i\s+)?(?:go|walk|move|approach)(?:\s+(?:to|towards?|closer to))?\s+(.+?)[.!]?$/i))) {
    const target = targetFor(state, seat, m[1]);
    if (target === seat) throw new GameError('Choose another person or a visible object.');
    const p = state.world.forms.get(seat), known = p.known.get(target);
    const goal = visible(state, seat, target) ? state.world.forms.get(target).pos : known?.lastPos;
    return { kind: 'move', target, goal: { ...goal }, duration: .25, summary: `Approach ${NAMES[target]}`, prompt };
  }
  if ((m = prompt.match(/^(?:i\s+)?(?:read|inspect|examine)\s+(.+?)[.!]?$/i))) {
    const target = targetFor(state, seat, m[1]);
    if (!TRACES[target]) throw new GameError('This first test supports reading the Receipt, Counterfoil or Ledger.');
    return { kind: 'read', target, duration: 5 / DAY, summary: `Read ${NAMES[target]}`, prompt };
  }
  if ((m = prompt.match(/^(?:i\s+)?share\s+(.+?)\s+with\s+(Mara|Jonah|Nell)[.!]?$/i))) {
    const target = targetFor(state, seat, m[1]), to = targetFor(state, seat, m[2]);
    const discovery = state.discoveries[seat].find(d => d.root === target);
    if (!discovery) throw new GameError('You can share a trace only after you have encountered its content.');
    if (to === seat) throw new GameError('Choose a listener other than yourself.');
    return { kind: 'share', target, to, discovery: { ...discovery }, duration: 1 / DAY, summary: `Share ${NAMES[target]} with ${NAMES[to]}`, prompt };
  }
  if ((m = prompt.match(/^(?:i\s+)?(?:tell|say to)\s+(Mara|Jonah|Nell)\s*:\s*([\s\S]+)$/i))) {
    const to = targetFor(state, seat, m[1]), words = clean(m[2]).replace(/^[“"]|[”"]$/g, '');
    if (!words || to === seat) throw new GameError('Choose another listener and write the words you want to say.');
    return { kind: 'say', to, words, duration: Math.max(1 / DAY, words.split(/\s+/).length / (140 * DAY)), summary: `Speak to ${NAMES[to]}`, prompt };
  }
  if ((m = prompt.match(/^(?:i\s+)?(?:file|lodge)(?:\s+(?:an?|my|the))?(?:\s+account)?\s*:\s*([\s\S]+)$/i))) {
    const words = clean(m[1]);
    const account = words.match(/^(Mara|Jonah|Nell)\s+moved\s+(?:ledger\s+)?L-17\s+to\s+(?:the\s+)?(east|west)\s+archive[.!]?$/i);
    if (!account) throw new GameError('State one clear account: File: [Mara, Jonah or Nell] moved L-17 to the [east or west] archive.');
    return { kind: 'file', words, mover: { mara: 'A', jonah: 'B', nell: 'N' }[account[1].toLowerCase()], destination: account[2].toLowerCase(), duration: 3 / DAY, summary: 'Lodge your account with Nell', prompt };
  }
  throw new GameError('Try one intention: Read receipt · Approach Nell · Tell Jonah: … · Share receipt with Jonah · File: [name] moved L-17 to the [east/west] archive · Look around · Wait.');
}

export function previewIntention(state, seat, text) {
  const intent = parseIntention(state, seat, text);
  return { summary: intent.summary, minutes: Math.round(intent.duration * DAY), warning: intent.kind === 'move'
    ? 'Begin a six-hour approach using the current movement calibration. You may need another exchange to get close enough. This does not promise arrival.'
    : intent.kind === 'read' && !canRead(state, seat, intent.target)
      ? 'You are not within reading distance. This attempt may fail; approaching first is safer.'
      : intent.kind === 'share' || intent.kind === 'say'
        ? 'Anyone within hearing range can hear the delivered words. Your private intention stays private.' : null };
}

function completeRead(state, seat, intent) {
  if (!canRead(state, seat, intent.target)) {
    addEntry(state, [seat], 'consequence', `You cannot make out ${NAMES[intent.target]}'s contents from here. Approach it, and try again when you are close enough and there is light.`); return;
  }
  const trace = TRACES[intent.target];
  const observers = ['A', 'B'].filter(s => s !== seat && visible(state, s, seat));
  if (observers.length) addEntry(state, observers, 'observation', `${NAMES[seat]} studies ${trace.title.toLowerCase()}. Seeing the act does not give you the words on the page.`);
  if (!state.discoveries[seat].some(d => d.root === intent.target && d.mode === 'direct')) {
    state.discoveries[seat] = state.discoveries[seat].filter(d => d.root !== intent.target);
    state.discoveries[seat].push({ root: intent.target, title: trace.title, text: trace.text, mode: 'direct', source: null, event: trace.event, acquiredAt: state.world.elapsedDays });
    addEntry(state, [seat], 'discovery', trace.text, { title: trace.title, root: intent.target });
    state.actuality.push({ id: `read:${state.serial}`, actor: seat, carrier: intent.target, referent: trace.event, at: state.world.elapsedDays });
  } else addEntry(state, [seat], 'consequence', `You read ${trace.title.toLowerCase()} again. The inscription is unchanged; this is still the same source.`);
}

function completeSignal(state, seat, intent) {
  const body = state.world.forms.get(seat);
  if (!body?.alive || (body.body?.integrity || 0) <= .05) {
    addEntry(state, [seat], 'consequence', 'Your bodily condition prevents you from producing the intended speech.'); return;
  }
  const isShare = intent.kind === 'share';
  const words = isShare ? intent.discovery.text : intent.words;
  const audience = ['A', 'B'].filter(s => s === seat || canHear(state, seat, s));
  const signal = { id: `signal:${state.signals.length + 1}`, producer: seat, intendedFor: intent.to, words,
    root: isShare ? intent.target : null, originMode: isShare ? intent.discovery.mode : null,
    via: isShare ? [...(intent.discovery.via || []), seat] : [seat], at: state.world.elapsedDays, encounteredBy: audience.filter(s => s !== seat) };
  state.signals.push(signal);
  const heardByTarget = canHear(state, seat, intent.to);
  addEntry(state, audience, 'speech', words, { speaker: NAMES[seat], addressedTo: NAMES[intent.to], signalId: signal.id,
    title: isShare ? `Shared ${NAMES[intent.target].toLowerCase()}` : 'Spoken words', reported: true });
  for (const listener of audience.filter(s => s !== seat)) {
    if (isShare && !state.discoveries[listener].some(d => d.root === intent.target)) {
      state.discoveries[listener].push({ root: intent.target, title: intent.discovery.title, text: words, mode: 'reported', source: seat,
        event: intent.discovery.event, via: signal.via, acquiredAt: state.world.elapsedDays });
    }
  }
  if (!heardByTarget) addEntry(state, [seat], 'consequence', `${NAMES[intent.to]} is beyond the test scene's speaking range. You spoke, but cannot treat those words as delivered to them.`);
  if (intent.to === 'N' && heardByTarget) addEntry(state, audience, 'consequence', 'Nell hears you. Her silence establishes neither agreement nor the truth of your account.');
}

function adjudicate(state, seat, intent) {
  if (!canHear(state, seat, 'N')) {
    addEntry(state, [seat], 'consequence', 'Nell cannot hear your account from here. You need to approach her before lodging it.'); return false;
  }
  const evidence = state.discoveries[seat];
  const unique = new Set(evidence.map(d => d.root));
  const correct = intent.mover === 'N' && intent.destination === 'east';
  const grounded = unique.size >= 2 && evidence.some(d => d.mode === 'direct');
  // An accepted case is an explicit scenario predicate, not a truth score shown on reports.
  const valid = correct && grounded;
  const audience = ['A', 'B'].filter(s => s === seat || canHear(state, seat, s));
  const supported = evidence.filter(d => TRACES[d.root] && d.event === TRACES[d.root].event);
  state.actuality.push({ id: `account:${state.exchange}:${seat}`, actor: seat, words: intent.words,
    sourceRoots: [...unique], accepted: valid && supported.length === evidence.length, at: state.world.elapsedDays });
  if (valid && supported.length === evidence.length) {
    addEntry(state, audience, 'verdict', `${NAMES[seat]} lodges an account supported by two original traces. Nell moved L-17 to the east archive.`, { actor: seat }); return true;
  }
  addEntry(state, [seat], 'consequence', 'Your account is not established. It needs the correct mover and destination, two distinct trace origins, and at least one trace you read yourself. An unsupported accusation earns no verdict.'); return false;
}

export function resolveExchange(state) {
  if (!state.pending.A || !state.pending.B || state.result) throw new GameError('Both contributions are required.', 409);
  const pair = { A: state.pending.A.intent, B: state.pending.B.intent };
  const start = state.world.elapsedDays;
  const positionsBefore = Object.fromEntries(['A', 'B'].map(seat => [seat, { ...state.world.forms.get(seat).pos }]));
  const stop = Math.max(pair.A.duration, pair.B.duration);
  const done = new Set(), wins = [];
  let t = 0, kernelEvents = 0, localMoments = 0;
  while (t < stop - 1e-11) {
    const nextAction = Math.min(...['A', 'B'].filter(s => !done.has(s)).map(s => pair[s].duration));
    const next = Math.min(stop, t + 1 / 24, nextAction);
    const orientations = new Map();
    for (const seat of ['A', 'B']) orientations.set(seat, { goal: !done.has(seat) && pair[seat].kind === 'move' ? pair[seat].goal : null });
    state.world._playerOrientations = orientations;
    const stepped = integrationStep(state.world, { dtDays: next - t });
    delete state.world._playerOrientations;
    kernelEvents += stepped.events.length; localMoments += stepped.moments.length; t = next;
    // Refresh access at the actual completion position, without minting a polling event.
    accessibilityPhase(state.world, snapshotReality(state.world));
    const due = ['A', 'B'].filter(s => !done.has(s) && pair[s].duration <= t + 1e-11);
    for (const seat of due) {
      const intent = pair[seat]; done.add(seat);
      if (intent.kind === 'read') completeRead(state, seat, intent);
      else if (intent.kind === 'say' || intent.kind === 'share') completeSignal(state, seat, intent);
      else if (intent.kind === 'file') { if (adjudicate(state, seat, intent)) wins.push({ seat, at: state.world.elapsedDays }); }
      else if (intent.kind === 'move') {
        const p = state.world.forms.get(seat);
        const moved = distance(positionsBefore[seat], p.pos) > 1e-8;
        const observers = ['A', 'B'].filter(s => s !== seat && visible(state, s, seat));
        if (moved && observers.length) addEntry(state, observers, 'observation', `${NAMES[seat]}'s position in the archive has changed. Their intention remains their own.`);
        const target = state.world.forms.get(intent.target);
        const near = visible(state, seat, intent.target) && distance(p.pos, target.pos) <= reachRadius(p) + formRadius(target) + .03;
        addEntry(state, [seat], 'consequence', !moved
          ? `You try to approach ${NAMES[intent.target]}, but your position does not change. The current conditions constrain the attempt.`
          : near ? `${NAMES[intent.target]} is now within reach. Check your surroundings before deciding what to do next.`
            : `You make a limited approach toward where you saw ${NAMES[intent.target]}. Arrival has not been assumed.`, { target: intent.target });
      } else if (intent.kind === 'wait') addEntry(state, [seat], 'consequence', 'You wait for an hour. The world continues around you; waiting supplies no food or water.');
      else addEntry(state, [seat], 'observation', 'You take another look at the people and material traces currently within your access. The surroundings panel reflects what you can presently see.');
    }
  }
  state.history.push({ exchange: state.exchange, durationDays: state.world.elapsedDays - start, kernelEvents, localMoments,
    A: { requestId: state.pending.A.requestId, prompt: pair.A.prompt, summary: pair.A.summary },
    B: { requestId: state.pending.B.requestId, prompt: pair.B.prompt, summary: pair.B.summary } });
  if (wins.length) {
    const earliest = Math.min(...wins.map(w => w.at));
    const winners = wins.filter(w => Math.abs(w.at - earliest) < 1e-10).map(w => w.seat);
    state.result = { winners, reason: winners.length === 2 ? 'Both accounts were established at the same in-world time.' : `${NAMES[winners[0]]} established the first supported account.`, exchange: state.exchange };
  } else if (state.exchange >= SCENARIO.maxExchanges || state.world.elapsedDays - state.startedAt >= 3) {
    state.result = { winners: [], reason: 'The disclosed test limit was reached without a supported account. Both starting goals failed.', exchange: state.exchange };
  }
  state.pending = {}; state.exchange++;
  return state;
}

export function expectedSeat(state) {
  const first = state.exchange % 2 ? 'A' : 'B';
  return state.pending[first] ? OTHER[first] : first;
}

export function commitIntention(state, seat, { exchange, requestId, prompt }) {
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(requestId)) throw new GameError('A valid request identifier is required.');
  if (state.receipts[requestId]) {
    if (state.receipts[requestId].seat !== seat) throw new GameError('That identifier is already in use.', 409);
    if (state.receipts[requestId].prompt !== clean(prompt) || state.receipts[requestId].exchange !== exchange) throw new GameError('A retry identifier cannot be reused for a different intention.', 409);
    return false;
  }
  if (!state.joined) throw new GameError('Waiting for the second player to join.', 409);
  if (state.result) throw new GameError('This match has ended.', 409);
  if (exchange !== state.exchange) throw new GameError('The exchange has changed. Refresh your view before committing.', 409);
  if (state.pending[seat]) throw new GameError('Your intention is already locked for this exchange.', 409);
  if (expectedSeat(state) !== seat) throw new GameError('It is the other player’s contribution first.', 409);
  const intent = parseIntention(state, seat, prompt);
  state.pending[seat] = { requestId, intent };
  state.receipts[requestId] = { seat, exchange, prompt: clean(prompt) };
  if (state.pending.A && state.pending.B) resolveExchange(state);
  return true;
}

function clockText(state) {
  const elapsed = state.world.elapsedDays;
  const minutes = Math.round((elapsed % 1) * DAY), h = Math.floor(minutes / 60) % 24;
  return `Day ${Math.floor(elapsed) + 1} · ${String(h).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function playerView(state, seat, roomId, revision = 0) {
  const p = state.world.forms.get(seat), first = state.exchange % 2 ? 'A' : 'B';
  const surroundings = ['A', 'B', 'N', 'receipt', 'docket', 'ledger'].filter(id => id !== seat && visible(state, seat, id)).map(id => {
    const f = state.world.forms.get(id), d = distance(p.pos, f.pos);
    return { id, name: NAMES[id], kind: f.kind === 'person' ? 'person' : 'trace',
      range: TRACES[id] ? (canRead(state, seat, id) ? 'Within reading distance' : 'Approach to read') : (canHear(state, seat, id) ? 'Within speaking distance' : 'Beyond speaking distance'),
      direction: Math.abs(f.pos.x - p.pos.x) > Math.abs(f.pos.y - p.pos.y) ? (f.pos.x < p.pos.x ? 'west' : 'east') : (f.pos.y < p.pos.y ? 'north' : 'south') };
  });
  return {
    roomId, revision, scenario: SCENARIO, seat, name: NAMES[seat], otherName: NAMES[OTHER[seat]],
    exchange: state.exchange, joined: state.joined, first: NAMES[first], practice: !!state.practice,
    canSubmit: state.joined && !state.result && !state.pending[seat] && expectedSeat(state) === seat,
    committed: !!state.pending[seat], otherCommitted: !!state.pending[OTHER[seat]],
    ownPrompt: state.pending[seat]?.intent.prompt || null,
    clock: clockText(state), elapsedDays: state.world.elapsedDays - state.startedAt,
    result: state.result ? { ...state.result, achieved: state.result.winners.includes(seat), winnerNames: state.result.winners.map(s => NAMES[s]) } : null,
    entries: state.entries.filter(e => e.audience.includes(seat)).map(({ audience, ...entry }) => entry),
    discoveries: state.discoveries[seat].map(({ event, ...d }) => ({ ...d, source: d.source ? NAMES[d.source] : null })),
    notes: state.notes[seat], surroundings,
    condition: { energy: p.body.energy, water: p.body.water, integrity: p.body.integrity, sleepDebt: p.sleepDebt || 0 },
    completedExchanges: state.history.map(h => ({ exchange: h.exchange, minutes: Math.round(h.durationDays * DAY), ownPrompt: h[seat].prompt, kernelEvents: h.kernelEvents, localMoments: h.localMoments })),
  };
}
