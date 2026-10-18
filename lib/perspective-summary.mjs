const CATEGORIES=[['access','Access'],['means','Means'],['timeline','Timeline']];

// These are labels and counts of already-acquired records, never a validation
// oracle. No suspect, claim or hidden source is inferred from the server world.
export function evidenceCoverage(discoveries){
  const originals=new Map();
  for(const d of discoveries){
    if(!CATEGORIES.some(([key])=>key===d.category))continue;
    const previous=originals.get(d.root);
    if(!previous||d.mode==='direct')originals.set(d.root,d);
  }
  return{sources:originals.size,firsthand:[...originals.values()].filter(d=>d.mode==='direct').length,
    categories:CATEGORIES.map(([key,label])=>({key,label,count:[...originals.values()].filter(d=>d.category===key).length}))};
}

export function latestExchange(view){
  const last=intentionHistory(view).findLast(h=>!/^(?:end|pass) turn$/i.test(h.ownPrompt.trim()));
  if(!last)return null;
  const entries=view.entries.filter(e=>e.exchange===last.exchange);
  return{exchange:last.exchange,minutes:last.minutes,intention:last.ownPrompt,
    readings:entries.filter(e=>e.kind==='discovery').length,
    speech:entries.filter(e=>e.kind==='speech').length,
    observations:entries.filter(e=>['observation','consequence'].includes(e.kind)).length};
}

export function intentionHistory(view){return view.completedExchanges.filter(h=>h.ownContribution!==false&&h.ownPrompt?.trim());}

// Automatic/other-seat activity must not hide the consequences of the player's
// latest submitted action. Received events since that action stay on screen.
export function sceneEntries(view,showEarlier=false){
  const last=latestExchange(view);
  return view.entries.filter(e=>showEarlier||!last||(e.exchange>=last.exchange&&!['opening','private'].includes(e.kind)));
}

export function turnState(view){
  if(view.result)return{label:'The case is closed',detail:view.result.reason,phase:'closed'};
  if(!view.joined)return{label:'The other seat is open',detail:'Invite your second player. The world has not advanced.',phase:'lobby'};
  if(view.committed)return{label:'Your intention is locked',detail:`Waiting for ${view.otherName} to commit. You can keep working in your notebook.`,phase:'waiting'};
  if(!view.canSubmit)return{label:`${view.otherName} contributes first`,detail:'Their intention stays private. No simulated time passes while you wait.',phase:'waiting'};
  return{label:'What do you try next?',detail:view.otherCommitted?`${view.otherName} has committed. Your intention will complete this exchange.`:'Write your intention. You will see the consequences once both players commit.',phase:'ready'};
}
