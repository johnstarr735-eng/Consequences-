import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { Rooms, makeToken } from '../lib/rooms.mjs';
import { unpackState } from '../lib/simulation.mjs';

class LocalD1 {
  constructor() {
    this.sql = new DatabaseSync(':memory:');
    for(const name of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())this.sql.exec(fs.readFileSync(new URL(`../drizzle/${name}`,import.meta.url),'utf8'));
  }
  prepare(sql) {
    const db = this.sql;
    return { bind(...args) { return {
      async run() { const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
      async first() { return db.prepare(sql).get(...args) || null; },
      async all() { return {results:db.prepare(sql).all(...args)}; },
    }; } };
  }
}
let seq = 0;
const request = (exchange, prompt) => ({ exchange, prompt, requestId: `room_request_${++seq}` });
async function joined() {
  const db = new LocalD1(), rooms = new Rooms(db), a = await rooms.create({scenario:'last-entry'}), b = await rooms.join(a.view.roomId, a.invite);
  return { db, rooms, a, b, id: a.view.roomId };
}

test('a one-use invitation grants only the second seat; a wrong key grants neither', async () => {
  const { rooms, a, b, id } = await joined();
  assert.equal(b.view.seat, 'B'); assert.equal(a.view.seat, 'A');
  await assert.rejects(() => rooms.join(id, a.invite), /already been used/);
  await assert.rejects(() => rooms.read(id, makeToken()), /does not belong/);
  await assert.rejects(() => rooms.read('not-a-match', a.token), /not found/);
  const row = await rooms.row(id); assert.notEqual(row.seat_a_hash, a.token); assert.equal(row.invite_hash, null);
});
test('a lost join response can be recovered with the same pre-stored player key', async () => {
  const rooms = new Rooms(new LocalD1()), a = await rooms.create({scenario:'last-entry'}), key = makeToken();
  const first = await rooms.join(a.view.roomId, a.invite, key);
  const again = await rooms.join(a.view.roomId, a.invite, key);
  assert.equal(first.token, again.token); assert.equal(first.view.revision, again.view.revision);
  await assert.rejects(() => rooms.join(a.view.roomId, a.invite, makeToken()), /already been used/);
});
test('room state survives a new service instance while waiting, without advancing', async () => {
  const { rooms, db, a, b, id } = await joined();
  const before = await rooms.read(id, a.token);
  await rooms.commit(id, a.token, request(1, 'Read receipt'));
  const restarted = new Rooms(db), av = await restarted.read(id, a.token), bv = await restarted.read(id, b.token);
  assert.equal(av.clock, before.clock); assert.equal(av.committed, true);
  assert.equal(av.ownPrompt, 'Read receipt'); assert.equal(bv.ownPrompt, null); assert.equal(bv.discoveries.length, 0);
  assert(!JSON.stringify(bv).includes('Read receipt'));
});
test('concurrent duplicate resolving requests commit a world advance once', async () => {
  const { rooms, a, b, id } = await joined();
  await rooms.commit(id, a.token, request(1, 'Read receipt'));
  const commit = request(1, 'Read counterfoil');
  const [one, two] = await Promise.all([rooms.commit(id, b.token, commit), rooms.commit(id, b.token, commit)]);
  assert.equal(one.exchange, 2); assert.equal(two.exchange, 2); assert.equal(one.revision, two.revision);
  const row = await rooms.row(id), state = unpackState(row.state);
  assert.equal(row.revision, 3); assert.equal(state.history.length, 1);
  assert(Math.abs(state.world.elapsedDays - .5 - 5 / 1440) < 1e-12);
});
test('concurrent private-note writes merge without leaking to the other seat', async () => {
  const { rooms, a, b, id } = await joined();
  await Promise.all([rooms.notes(id, a.token, 'MARA_SECRET_987'), rooms.notes(id, b.token, 'JONAH_SECRET_654')]);
  const av = await rooms.read(id, a.token), bv = await rooms.read(id, b.token);
  assert.equal(av.notes, 'MARA_SECRET_987'); assert.equal(bv.notes, 'JONAH_SECRET_654');
  assert(!JSON.stringify(av).includes('JONAH_SECRET_654')); assert(!JSON.stringify(bv).includes('MARA_SECRET_987'));
});
test('practice uses the same persisted kernel loop and can reach a validated ending', async () => {
  const rooms = new Rooms(new LocalD1()), a = await rooms.create({ practice: true,scenario:'last-entry' }), id = a.view.roomId;
  let view = await rooms.commit(id, a.token, request(1, 'Read receipt'));
  assert.equal(view.exchange, 2); assert.equal(view.otherCommitted, true); assert.equal(view.canSubmit, true);
  view = await rooms.commit(id, a.token, request(2, 'Look around'));
  assert.equal(view.discoveries.length, 2); assert.equal(view.discoveries.find(d => d.root === 'docket').mode, 'reported');
  view = await rooms.commit(id, a.token, request(3, 'File: Nell moved L-17 to the east archive'));
  assert.equal(view.result.achieved, true); assert.deepEqual(view.result.winnerNames, ['Mara']);
  assert.equal((await rooms.read(id, a.token)).result.achieved, true);
});
