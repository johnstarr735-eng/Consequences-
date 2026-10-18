import { World, Form, Person, Whole, RelationForm, Trace } from '../engine/destiny-v113/destiny_unified_kernel.js';

const prototypes = { World, Form, Person, Whole, RelationForm, Trace };

// Graph encoding preserves Map/Set, prototypes, aliases, cycles and nonfinite diagnostics.
// Decode only internally produced server saves or device-only practice saves.
// This is never a user-supplied import format or an online client state update.
export function encodeWorld(root,{compact=false}={}) {
  if(compact)return encodeCompact(root);
  const ids = new Map(), nodes = [];
  function ref(value) {
    if (typeof value === 'number' && !Number.isFinite(value)) return { number: String(value) };
    if (value === undefined) return { undefined: true };
    if (value === null || typeof value !== 'object') return value;
    if (ids.has(value)) return { ref: ids.get(value) };
    const id = nodes.length;
    ids.set(value, id); nodes.push(null);
    let node;
    if (value instanceof Map) node = { type: 'Map', data: [...value].map(([k, v]) => [ref(k), ref(v)]) };
    else if (value instanceof Set) node = { type: 'Set', data: [...value].map(ref) };
    else if (Array.isArray(value)) node = { type: 'Array', data: value.map(ref) };
    else {
      const type = Object.keys(prototypes).find(k => Object.getPrototypeOf(value) === prototypes[k].prototype) || 'Object';
      node = { type, data: Object.entries(value).filter(([, v]) => typeof v !== 'function').map(([k, v]) => [k, ref(v)]) };
    }
    nodes[id] = node;
    return { ref: id };
  }
  return { format: 1, root: ref(root), nodes };
}

export function decodeWorld(encoded) {
  if(encoded.format===2)return decodeCompact(encoded);
  if (encoded.format !== 1) throw new Error('Unsupported world save format');
  const values = encoded.nodes.map(node => node.type === 'Map' ? new Map()
    : node.type === 'Set' ? new Set() : node.type === 'Array' ? []
      : Object.create(prototypes[node.type]?.prototype || Object.prototype));
  function value(item) {
    if (item && typeof item === 'object') {
      if ('ref' in item) return values[item.ref];
      if ('number' in item) return Number(item.number);
      if ('undefined' in item) return undefined;
    }
    return item;
  }
  encoded.nodes.forEach((node, i) => {
    const target = values[i];
    if (node.type === 'Map') for (const [k, v] of node.data) target.set(value(k), value(v));
    else if (node.type === 'Set') for (const v of node.data) target.add(value(v));
    else if (node.type === 'Array') for (const v of node.data) target.push(value(v));
    else for (const [k, v] of node.data) Object.defineProperty(target, k, { value: value(v), writable: true, enumerable: true, configurable: true });
  });
  return value(encoded.root);
}

// Storage format 2 replaces repeated property names and reference wrappers with
// small indices/tuples. No history is omitted; format 1 remains readable and is
// still the default diagnostic representation.
const typeNames=['Object','Map','Set','Array',...Object.keys(prototypes)];
function encodeCompact(root){
  const ids=new Map(),nodes=[],keys=[],keyIds=new Map();
  function keyId(key){if(!keyIds.has(key)){keyIds.set(key,keys.length);keys.push(key);}return keyIds.get(key);}
  function ref(value){
    if(typeof value==='number'&&!Number.isFinite(value))return[1,String(value)];
    if(value===undefined)return[2];
    if(value===null||typeof value!=='object')return value;
    if(ids.has(value))return[0,ids.get(value)];
    const id=nodes.length;ids.set(value,id);nodes.push(null);let type,data;
    if(value instanceof Map){type='Map';data=[...value].flatMap(([k,v])=>[ref(k),ref(v)]);}
    else if(value instanceof Set){type='Set';data=[...value].map(ref);}
    else if(Array.isArray(value)){type='Array';data=value.map(ref);}
    else{type=Object.keys(prototypes).find(k=>Object.getPrototypeOf(value)===prototypes[k].prototype)||'Object';data=Object.entries(value).filter(([,v])=>typeof v!=='function').flatMap(([k,v])=>[keyId(k),ref(v)]);}
    nodes[id]=[typeNames.indexOf(type),data];return[0,id];
  }
  return{format:2,root:ref(root),keys,nodes};
}
function decodeCompact(encoded){
  if(!Array.isArray(encoded.keys)||!Array.isArray(encoded.nodes))throw new Error('Incomplete world save');
  const values=encoded.nodes.map(([code])=>{const type=typeNames[code];return type==='Map'?new Map():type==='Set'?new Set():type==='Array'?[]:Object.create(prototypes[type]?.prototype||Object.prototype);});
  const value=item=>Array.isArray(item)?item[0]===0?values[item[1]]:item[0]===1?Number(item[1]):undefined:item;
  encoded.nodes.forEach(([code,data],i)=>{
    const target=values[i],type=typeNames[code];
    if(type==='Map')for(let j=0;j<data.length;j+=2)target.set(value(data[j]),value(data[j+1]));
    else if(type==='Set')for(const v of data)target.add(value(v));
    else if(type==='Array')for(const v of data)target.push(value(v));
    else for(let j=0;j<data.length;j+=2)Object.defineProperty(target,encoded.keys[data[j]],{value:value(data[j+1]),writable:true,enumerable:true,configurable:true});
  });
  return value(encoded.root);
}
