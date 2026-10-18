// The first configuration of the world model. Its objects/roles are scenario history,
// not universal entities. No murder, win predicate, or response policy lives here.
export const NIGHT_WATCH_NAMES={A:'Mara',B:'Jonah',N:'Nell',D:'Ada',S:'Silas',P:'Officer Vale',phoneA:'Mara’s phone',phoneB:'Jonah’s phone',phoneP:'Duty phone',router:'WiFi router',register:'Key register',clock:'Signal log',weight:'Brass weight',body:'Rowan',manifest:'Cargo manifest',noteA:'Mara’s paper',noteB:'Jonah’s paper',penA:'Mara’s pen',penB:'Jonah’s pen',cabinet:'Case desk'};
export const NIGHT_WATCH_POSITIONS={A:{x:2,y:3},B:{x:5,y:3},N:{x:1.7,y:5.2},D:{x:6,y:5.2},S:{x:4,y:1.1},P:{x:7.65,y:6.4}};
export const NIGHT_WATCH_MATERIAL_POSITIONS={register:{x:1.1,y:5.2},clock:{x:6.6,y:5.2},weight:{x:4.6,y:1.1},body:{x:3.5,y:3.8},manifest:{x:5.1,y:4.2},noteA:{x:1.42,y:3},noteB:{x:5.58,y:3},penA:{x:1.48,y:2.6},penB:{x:5.52,y:2.6},cabinet:{x:3.5,y:5.5}};

export function nightWatchDefinition(){
  const people=Object.entries(NIGHT_WATCH_POSITIONS).map(([id,pos])=>({id,name:NIGHT_WATCH_NAMES[id],initial:{pos:{...pos},energy:.9,bodyWater:.9,bodyWarmth:.74,receptor:.85,attention:.8,retention:.8},condition:{baseAge:id==='P'?38:32,age:id==='P'?38:32,sleepDebt:.12,clothing:.7,injury:0,illness:0,sceneMotionScale:600},learnedScripts:['archive-en'],learnedProcedures:[],history:[{source:id==='P'?'duty-assignment':'prior-visit',description:id==='P'?'Assigned to check a delivered body report':'Prior familiarity with the public observatory layout'}]}));
  const materials=Object.entries(NIGHT_WATCH_MATERIAL_POSITIONS).map(([id,pos])=>{
    const rigid=id==='weight'||id==='cabinet';
    return{id,name:NIGHT_WATCH_NAMES[id],initial:{pos:{...pos},stock:id==='body'?2.4:id==='cabinet'?4:id==='weight'?.32:.055,rigidity:rigid?.85:.4,hardness:rigid?.6:.1,visibility:.95,fiber:id==='body'?.05:rigid?0:.4,mineral:rigid?.75:0,nutrient:0,organic:id==='body'?.6:0},stores:{surfaceInkAffinity:['register','clock','manifest','noteA','noteB'].includes(id)?.8:.1,...(id==='penA'||id==='penB'?{ink:.02}:{})}};
  });
  const priorEncounters=[];
  for(const observer of ['A','B','N','D','S'])for(const target of [...people,...materials])if(target.id!==observer&&target.id!=='P')priorEncounters.push({observer,target:target.id,source:'prior_visit',confidence:.65});
  return{id:'port-serein-2026',version:1,period:'Present day',place:'Port Serein · harbour observatory',date:'2026-10-17',space:{width:9,height:8},elapsedDays:.5,people,materials,priorEncounters,
    context:{region:'Fictional coastal municipality',institutions:['Local civic inquiry','Local civic police'],externalConnections:[{place:'Town',status:'Context only; travel beyond the observatory is not yet implemented'}]}};
}
