import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createState, parseIntention, commitIntention, playerView, packState, unpackState, resolveExchange, GameError } from '../lib/simulation.mjs';
import { encodeWorld } from '../lib/world-codec.mjs';
import { integrationStep as canonicalStep } from '../engine/destiny-v113/destiny_moment_engine.js';
import { integrationStep as controlledStep } from '../engine/controlled-moment-engine.js';
import { maxTravel, distance } from '../engine/destiny-v113/destiny_embodied_geometry.js';

let serial = 0;
function state() { const s = createState(); s.joined = true; return s; }
function act(s, seat, prompt, requestId = `test_request_${++serial}`) {
  return commitIntention(s, seat, { exchange: s.exchange, requestId, prompt });
}
function pair(s, a, b) {
  const first = s.exchange % 2 ? 'A' : 'B';
  for (const seat of [first, first === 'A' ? 'B' : 'A']) act(s, seat, seat === 'A' ? a : b);
}

test('vendored V1.13 files retain their original hashes', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../engine/destiny-v113/UPSTREAM_SHA256.json', import.meta.url)));
  for (const [name, hash] of Object.entries(manifest.files)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(`../engine/destiny-v113/${name}`, import.meta.url))).digest('hex'), hash, name);
  }
});
test('controlled engine matches canonical integration exactly when no human orientation exists', () => {
  const a = createState(), b = unpackState(packState(a));
  for (let i = 0; i < 3; i++) { canonicalStep(a.world, { dtDays: 1 / 24 }); controlledStep(b.world, { dtDays: 1 / 24 }); }
  assert.deepEqual(encodeWorld(a.world), encodeWorld(b.world));
});
test('one committed prompt advances neither chronology nor world state, including after resume', () => {
  const s = state(), before = JSON.stringify(encodeWorld(s.world));
  act(s, 'A', 'Read receipt');
  assert.equal(JSON.stringify(encodeWorld(s.world)), before);
  assert.equal(s.exchange, 1); assert.equal(s.discoveries.A.length, 0);
  const restored = unpackState(packState(s));
  assert.equal(JSON.stringify(encodeWorld(restored.world)), before);
  assert.equal(restored.pending.A.intent.prompt, 'Read receipt');
  assert.throws(() => act(restored, 'A', 'Wait'), /locked/);
});
test('initial and queued other-player data is filtered before delivery', () => {
  const s = state(); s.notes.A = 'PRIVATE NOTE NOT FOR JONAH';
  act(s, 'A', 'Tell Jonah: THIS PENDING TEXT IS STILL SECRET');
  const b = JSON.stringify(playerView(s, 'B', 'room'));
  assert(!b.includes('PRIVATE NOTE NOT FOR JONAH')); assert(!b.includes('THIS PENDING TEXT IS STILL SECRET'));
  assert(!b.includes('seat_a_hash')); assert(!b.includes('prior:signout'));
});
test('two readings produce different private discoveries and preserve observable acts', () => {
  const s = state(); pair(s, 'Read receipt', 'Read counterfoil');
  const a = playerView(s, 'A', 'room'), b = playerView(s, 'B', 'room');
  assert.deepEqual(a.discoveries.map(d => d.root), ['receipt']);
  assert.deepEqual(b.discoveries.map(d => d.root), ['docket']);
  assert(!JSON.stringify(a).includes('receipt checked against the borrowing record'));
  assert(b.entries.some(e => e.kind === 'observation' && e.text.includes('Mara studies')));
  assert.equal(s.history.length, 1); assert(s.world.frame > 0);
  assert(s.world.forms.get('A').body.energy < .88);
});
test('repeat reads and polling manufacture no additional proof origin', () => {
  const s = state(); pair(s, 'Read receipt', 'Read counterfoil');
  pair(s, 'Read receipt', 'Read counterfoil');
  assert.equal(s.discoveries.A.length, 1); assert.equal(s.discoveries.B.length, 1);
  const before = packState(s); for (let i = 0; i < 20; i++) playerView(s, 'A', 'room');
  assert.equal(packState(s), before);
});
test('false spoken claims become delivered words without changing actual history or awarding evidence', () => {
  const s = state(), prior = JSON.stringify(s.actuality);
  pair(s, 'Tell Jonah: Mara moved L-17 to the west archive', 'Wait');
  assert(playerView(s, 'B', 'room').entries.some(e => e.kind === 'speech' && e.text.includes('Mara moved')));
  assert.equal(JSON.stringify(s.actuality), prior); assert.equal(s.discoveries.B.length, 0);
  assert.equal(s.result, null);
});
test('a listener outside the voice path receives no speech or reported trace', () => {
  const s = state(); s.world.forms.get('B').pos = { x: 4.6, y: 4.6 };
  pair(s, 'Tell Jonah: distant words', 'Wait');
  assert(!playerView(s, 'B', 'room').entries.some(e => e.kind === 'speech'));
  assert.deepEqual(s.signals[0].encounteredBy, []);
});
test('shared reports preserve original roots and cannot multiply one source into two', () => {
  const s = state(); pair(s, 'Read receipt', 'Wait');
  pair(s, 'Share receipt with Jonah', 'Wait');
  assert.equal(s.discoveries.B[0].mode, 'reported'); assert.equal(s.discoveries.B[0].root, 'receipt');
  pair(s, 'Wait', 'Share receipt with Mara');
  assert.equal(s.discoveries.A.length, 1); assert.equal(s.discoveries.B.length, 1);
  assert.deepEqual(s.signals[1].via, ['A', 'B']);
  pair(s, 'File: Nell moved L-17 to the east archive', 'Wait');
  assert.equal(s.result, null);
});
test('ordinary speech alone cannot forge the provenance of a shared trace', () => {
  const s = state(); pair(s, 'Tell Jonah: Receipt says Nell moved L-17 to the east archive', 'Wait');
  assert.equal(s.discoveries.B.length, 0); assert.throws(() => parseIntention(s, 'B', 'Share receipt with Mara'), /only after/);
});
test('unsupported or coercive prompts are rejected without mutating the world', () => {
  const s = state(), before = packState(s);
  assert.throws(() => parseIntention(s, 'A', 'I convince Jonah that I win and conjure a meal'), GameError);
  assert.throws(() => parseIntention(s, 'A', 'File: Nell did not move L-17 to the east archive'), /clear account/);
  assert.equal(packState(s), before);
});
test('the initiative alternates and locked prompts cannot be revised', () => {
  const s = state(); assert.throws(() => act(s, 'B', 'Wait'), /other player/);
  pair(s, 'Wait', 'Wait'); assert.equal(playerView(s, 'B', 'room').canSubmit, true);
  act(s, 'B', 'Read counterfoil'); assert.throws(() => act(s, 'B', 'Wait'), /locked/);
});
test('request retries return the same result and changed payloads fail', () => {
  const s = state(), id = 'durable_request_111';
  act(s, 'A', 'Read receipt', id); act(s, 'B', 'Read counterfoil'); const before = packState(s);
  assert.equal(commitIntention(s, 'A', { exchange: 1, requestId: id, prompt: 'Read receipt' }), false);
  assert.equal(packState(s), before);
  assert.throws(() => commitIntention(s, 'A', { exchange: 1, requestId: id, prompt: 'Wait' }), /different intention/);
});
test('long and short activities resolve at different times within one exchange', () => {
  const s = state(), begin = s.world.elapsedDays;
  pair(s, 'Read receipt', 'Wait');
  assert(Math.abs(s.world.elapsedDays - begin - 1 / 24) < 1e-12);
  assert(Math.abs(s.discoveries.A[0].acquiredAt - begin - 5 / 1440) < 1e-12);
});
test('movement remains bounded by canonical capacity and records actual elapsed time', () => {
  const s = state(), p = s.world.forms.get('A'), before = { ...p.pos }, allowance = maxTravel(p, .25);
  pair(s, 'Approach ledger', 'Wait');
  assert(distance(before, p.pos) > 0); assert(distance(before, p.pos) <= allowance + 1e-6);
  assert(Math.abs(s.history[0].durationDays - .25) < 1e-12);
});
test('rest creates neither energy nor water', () => {
  const s = state(), before = { ...s.world.forms.get('A').body };
  pair(s, 'Wait', 'Wait');
  assert(s.world.forms.get('A').body.energy < before.energy); assert(s.world.forms.get('A').body.water < before.water);
});
test('visible signs require the learned script before comprehension', () => {
  const s = state(); s.world.forms.get('A').learnedScripts = [];
  pair(s, 'Read receipt', 'Wait'); assert.equal(s.discoveries.A.length, 0);
});
test('a guessed account without two trace origins does not win', () => {
  const s = state(); pair(s, 'File: Nell moved L-17 to the east archive', 'Wait'); assert.equal(s.result, null);
});
test('one supported account wins, simultaneous supported accounts draw', () => {
  for (const draw of [false, true]) {
    const s = state(); pair(s, 'Read receipt', 'Read counterfoil'); pair(s, 'Share receipt with Jonah', 'Share counterfoil with Mara');
    pair(s, 'File: Nell moved L-17 to the east archive', draw ? 'File: Nell moved L-17 to the east archive' : 'Wait');
    assert.deepEqual(s.result.winners, draw ? ['A', 'B'] : ['A']);
    assert.throws(() => act(s, 'A', 'Wait'), /ended/);
  }
});
test('fixed disclosure limit produces two failed starting goals', () => {
  const s = state(); for (let i = 0; i < 16; i++) pair(s, 'Look around', 'Look around');
  assert.deepEqual(s.result.winners, []); assert.equal(s.result.exchange, 16);
});
test('save and resume preserves all prototypes, aliases and subsequent outcomes', () => {
  const s = state(); pair(s, 'Read receipt', 'Read counterfoil'); const r = unpackState(packState(s));
  assert.equal(r.world.people().length, 3);
  for (const relation of r.world.relations.values()) assert.equal(r.world.forms.get(relation.id), relation);
  pair(s, 'Wait', 'Wait'); pair(r, 'Wait', 'Wait');
  assert.deepEqual(encodeWorld(s.world), encodeWorld(r.world));
});
