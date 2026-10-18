import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// Diagnostic only: all fixtures use fresh in-memory worlds; no saved match is edited.
const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const load = name => import(pathToFileURL(path.join(root, name)).href);
const sim = await load('lib/case-simulation.mjs');
const kernel = await load('engine/controlled-moment-engine.js');
const cw = await load('lib/case-world.mjs');
const ci = await load('lib/case-intentions.mjs');
const interactions = await load('lib/case-interactions.mjs');
const {activeFieldContext,conditionSuperposition} = await load('engine/destiny-v113/destiny_field_syntax.js');
const {situatedMoira} = await load('engine/destiny-v113/destiny_moira_dynamics.js');
const {encodeWorld} = await load('lib/world-codec.mjs');
let serial=0;
const state = (seed=1) => {const s=sim.createCaseState(seed);s.joined=true;return s;};
function pair(s,a,b='Wait 2 minutes') {for(const seat of s.exchange%2?['A','B']:['B','A']) sim.commitCase(s,seat,{exchange:s.exchange,requestId:`fidelity_probe_${++serial}`,prompt:seat==='A'?a:b});}
function place(s,id,x,y){cw.person(s,id).pos={x,y};cw.refreshAccess(s);}
function compact(s){const a=kernel.momentAudit(s.world);return {minutes: +( (s.world.elapsedDays-s.startedAt)/cw.MINUTE).toFixed(6),frames:a.frame,moments:a.momentCount,will:a.will,imagination:a.imagination,praxis:a.praxis,relationPhysicalMax:a.relationalTrace.realityConsequence.physical.max,relationMentalMax:a.relationalTrace.realityConsequence.mental.max,relationTraceEpisodes:a.relationalTrace.traceEpisodes,signals:s.signals.length,materialActs:s.materialActs?.length||0};}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'engine/destiny-v113/UPSTREAM_SHA256.json'),'utf8'));
const hashes=Object.entries(manifest.files).map(([name,expected])=>({name,match:createHash('sha256').update(fs.readFileSync(path.join(root,'engine/destiny-v113',name))).digest('hex')===expected}));
const results={baseline:{engine:manifest.engine_version,sourceArchiveSHA256:manifest.archive_sha256,files:hashes.length,allHashesMatch:hashes.every(x=>x.match)}};
results.solvedCases=[];
for(const seed of [1,2,3]) {const s=state(seed);for(const prompt of ['Inspect key register','Inspect brass weight','Inspect Rowan',`Lodge case against ${['Nell','Ada','Silas'][seed%3]}`]) pair(s,prompt);results.solvedCases.push({seed,winners:s.result.winners,...compact(s)});}
const waiting=state();for(let i=0;i<6;i++)pair(waiting,'Wait 30 minutes','Wait 30 minutes');results.waitingMatch=compact(waiting);

// Read planning output. These fixtures do not commit their generated processes.
results.horizons=[];
for(const condition of ['healthy','depleted','severely_depleted']) {
 const s=state(),p=cw.person(s,'A');
 if(condition!=='healthy'){p.body.energy=.01;p.body.water=.01;p.body.integrity=.025;p.apparatus.attention=.01;p.apparatus.retention=.01;p.apparatus.receptor=.01;}
 if(condition==='severely_depleted'){p.body.energy=.001;p.body.water=.001;p.body.integrity=.02;p.material.mobility=.01;}
 const goal={x:2,y:6};s.world.time.dtDays=cw.MINUTE;s.world._playerOrientations=new Map([['A',{goal,stopDistance:.2}]]);kernel.deriveWorldConditions(s.world);
 const snapshot=kernel.snapshotReality(s.world),ps=kernel.generateProcesses(s.world,snapshot),m=ps.find(p=>p.type==='motion'&&p.form==='A'),sp=m.fieldSuperposition;
 const routes=sp.positions.map(x=>({to:x.to,score:0}));
 const fc=activeFieldContext(s.world,snapshot,p,{drivers:m.drivers});
 const off={...fc,pressure:0,braidLoad:0,routedLoad:0,realityDemand:{consciousness:0,mental:0,physical:0},grammarOpenness:.72};
 const full=conditionSuperposition(s.world,snapshot,p,fc,routes,m.drivers,situatedMoira(s.world,snapshot,p,{fieldContext:fc,rawCandidates:routes,drivers:m.drivers}));
 const ablated=conditionSuperposition(s.world,snapshot,p,off,routes,m.drivers,situatedMoira(s.world,snapshot,p,{fieldContext:off,rawCandidates:routes,drivers:m.drivers}));
 results.horizons.push({condition,from:m.from,to:m.to,raw:sp.rawCount,live:sp.liveCount,maxTightening:sp.maxTightening,margin:m.moira.narrowestMargin,domains:fc.sovereignFields.map(f=>f.domain),fieldPressure:fc.pressure,scoreWithFieldsOnSurvivingPool:full.positions.find(x=>x.to.x===m.to.x&&x.to.y===m.to.y)?.score,scoreWithoutFieldsOnSurvivingPool:ablated.positions.find(x=>x.to.x===m.to.x&&x.to.y===m.to.y)?.score,survivingPoolLiveWith:full.liveCount,survivingPoolLiveWithout:ablated.liveCount});
}

const promise=state();place(promise,'A',1.7,3.9);
const beforeWorld=JSON.stringify(encodeWorld(promise.world));
for(const prompt of ['Promise Nell I will show evidence before accusing anyone','Tell Nell: Ada killed Rowan']) interactions.completeTask(promise,'A',ci.parseCaseIntention(promise,'A',prompt).tasks.at(-1));
results.promise={breaches:promise.npcKnowledge.N.breaches,commitmentStatus:promise.commitments.A[0]?.status,canonicalWorldUnchanged:JSON.stringify(encodeWorld(promise.world))===beforeWorld,signals:promise.signals.length,canonicalEvents:promise.world.actualHistory.length};

const attack=state();place(attack,'A',1,1);place(attack,'N',1.75,1);place(attack,'B',7.5,6.5);place(attack,'D',6.5,5.9);place(attack,'S',5.9,6.5);cw.person(attack,'N').capacities.forceTransmission=.03;
pair(attack,'Strangle Nell for 2 minutes','Wait 2 minutes');
const relation=attack.world.relations.get('A|N');
results.attack={...compact(attack),victimReserve:cw.person(attack,'N').sceneBody.reserve,victimInjury:cw.person(attack,'N').injury,incidentCount:attack.incidents.length,incidents:attack.incidents.map(e=>({root:e.root,process:e.process})),canonicalEventTypes:[...new Set(attack.world.actualHistory.map(e=>e.type))],directionalConsequence:relation.directionalConsequence,relationSources:(relation.residue||[]).flatMap(x=>x.sources||[]).map(x=>x.type),privateBIncidentRecords:sim.caseView(attack,'B','audit').discoveries.filter(d=>d.category==='incident').length};

const pending=state();const pendingBefore=JSON.stringify(encodeWorld(pending.world));sim.commitCase(pending,'A',{exchange:1,requestId:'fidelity_pending_01',prompt:'Strangle Nell'});results.pending={canonicalWorldUnchanged:pendingBefore===JSON.stringify(encodeWorld(pending.world)),incidents:pending.incidents?.length||0,otherPlayerSeesPrompt:JSON.stringify(sim.caseView(pending,'B','audit')).includes('Strangle Nell')};

// Isolate Field demand from bodily carrying using the same finite route pool.
// Deliberately near a limit; this is a controlled mechanism fixture, not normal play.
{
 const s=state(),w=s.world,p=cw.person(s,'A');w.time.dtDays=cw.MINUTE;
 p.body.energy=.001;p.body.water=.001;p.body.integrity=.02;p.material.mobility=.13;
 p.apparatus.attention=.01;p.apparatus.retention=.01;p.apparatus.receptor=.01;
 kernel.deriveWorldConditions(w);const snapshot=kernel.snapshotReality(w),es=snapshot.forms.get('A'),travel=es.geometry.maxTravel;
 const routes=[{to:{...es.pos},score:0},...Array.from({length:16},(_,i)=>({to:{x:es.pos.x+Math.cos(i*Math.PI/8)*travel,y:es.pos.y+Math.sin(i*Math.PI/8)*travel},score:0}))];
 const fc=activeFieldContext(w,snapshot,p,{drivers:[]}),off={...fc,pressure:0,braidLoad:0,routedLoad:0,realityDemand:{consciousness:0,mental:0,physical:0},grammarOpenness:.72};
 const horizon=f=>conditionSuperposition(w,snapshot,p,f,routes,[],situatedMoira(w,snapshot,p,{fieldContext:f,rawCandidates:routes,drivers:[]}));
 const full=horizon(fc),ablated=horizon(off);
 results.fieldBoundary={energy:p.body.energy,water:p.body.water,integrity:p.body.integrity,mobility:p.material.mobility,raw:routes.length,withFieldDemand:full.liveCount,withoutFieldDemand:ablated.liveCount,maxTighteningWith:full.maxTightening,maxTighteningWithout:ablated.maxTightening};
}
{
 const s=state(),p=cw.person(s,'A'),previous={...p.known.get('N').lastPos};
 p.sceneBody={conscious:false,reserve:0,voiceBlocked:false};cw.person(s,'N').pos={x:3,y:3};
 pair(s,'Wait 1 minute','Wait 1 minute');
 results.incapacity={status:sim.caseView(s,'A','audit').condition.status,liveSurroundings:sim.caseView(s,'A','audit').surroundings.length,oldPositionRetained:JSON.stringify(p.known.get('N').lastPos)===JSON.stringify(previous),accessClosed:!s.world._accessState.get('A|N').active};
 p.sceneBody.conscious=true;p.sceneBody.reserve=1;cw.refreshAccess(s);
 results.incapacity.accessReopened=cw.visible(s,'A','N');results.incapacity.newPositionAcquired=JSON.stringify(p.known.get('N').lastPos)===JSON.stringify(cw.person(s,'N').pos);
}
console.log(JSON.stringify(results,null,2));
