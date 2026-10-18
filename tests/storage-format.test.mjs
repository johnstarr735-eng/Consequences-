import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,packForStorage,unpackFromStorage} from '../lib/game.mjs';
import {encodeWorld,decodeWorld} from '../lib/world-codec.mjs';
import {World,Person} from '../engine/destiny-v113/destiny_unified_kernel.js';

test('compact storage preserves graph aliases, cycles, prototypes and nonfinite diagnostics',()=>{
  const world=new World(5,5),person=new Person('A');world.add(person);const root={world,again:person,missing:undefined,diagnostics:[Infinity,-Infinity,NaN]};root.self=root;
  const decoded=decodeWorld(encodeWorld(root,{compact:true}));assert(decoded.world instanceof World);assert(decoded.again instanceof Person);assert.equal(decoded.again,decoded.world.forms.get('A'));assert.equal(decoded.self,decoded);assert.equal(decoded.missing,undefined);assert.equal(decoded.diagnostics[0],Infinity);assert(Number.isNaN(decoded.diagnostics[2]));assert.deepEqual(encodeWorld(decoded),encodeWorld(root));
});
test('old gzip graph saves remain readable and new lossless storage reduces expanded size',async()=>{
  const s=createState({seed:3,setup:{character:{preset:'investigator',name:'Elena'}}}),old=JSON.stringify(encodeWorld(s)),compact=JSON.stringify(encodeWorld(s,{compact:true}));
  assert(compact.length<old.length);const zipped=new Uint8Array(await new Response(new Blob([old]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let binary='';for(let i=0;i<zipped.length;i+=8192)binary+=String.fromCharCode(...zipped.subarray(i,i+8192));const restored=await unpackFromStorage('cq2:gzip:'+btoa(binary));assert.deepEqual(encodeWorld(restored),encodeWorld(s));
  const current=await unpackFromStorage(await packForStorage(restored));assert.deepEqual(encodeWorld(current),encodeWorld(s));
});
