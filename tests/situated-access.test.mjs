import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaseState,commitCase,caseView} from '../lib/case-simulation.mjs';
import {person,visible,observers,refreshAccess} from '../lib/case-world.mjs';
import {ensureBody} from '../lib/case-life.mjs';

test('incapacity removes live surroundings while preserving earlier records and the visible body',()=>{
  const s=createCaseState(1),p=person(s,'A');
  s.notes.A='An earlier private thought';
  const known=[...p.known.keys()];assert(caseView(s,'A','audit').surroundings.length);
  ensureBody(p).conscious=false;p.sceneBody.reserve=0;
  const view=caseView(s,'A','audit');
  assert.equal(view.condition.status,'unconscious');assert.deepEqual(view.surroundings,[]);
  assert.equal(view.notes,'An earlier private thought');
  assert(known.filter(id=>id!=='A').every(id=>view.knownPlaces.some(place=>place.id===id)));
  assert(!visible(s,'A','B'));assert(!observers(s,'B').includes('A'));
  assert(visible(s,'B','A'),'An unresponsive body is still available to another observer.');
});

test('an unconscious observer retains old positions until sensory access reopens',()=>{
  const s=createCaseState(1);s.joined=true;
  const p=person(s,'A'),previous={...p.known.get('N').lastPos};
  ensureBody(p).conscious=false;p.sceneBody.reserve=0;
  person(s,'N').pos={x:3,y:3};
  for(const seat of ['A','B'])commitCase(s,seat,{exchange:1,requestId:`situated_access_${seat}_01`,prompt:'Wait 1 minute'});
  assert.equal(p.sceneBody.conscious,false);
  assert.deepEqual(p.known.get('N').lastPos,previous);
  assert.equal(s.world._accessState.get('A|N').active,false);
  const activations=s.world.moments.flatMap(m=>m.activations||[]).filter(a=>a.observer==='A');
  assert(activations.some(a=>a.kind==='perception_close'));
  assert(!activations.some(a=>a.kind==='perception_open'||a.kind==='perception_change'));
  p.sceneBody.conscious=true;p.sceneBody.reserve=1;refreshAccess(s);
  assert(visible(s,'A','N'));assert.equal(s.world._accessState.get('A|N').active,true);
  assert.deepEqual(p.known.get('N').lastPos,person(s,'N').pos);
});
