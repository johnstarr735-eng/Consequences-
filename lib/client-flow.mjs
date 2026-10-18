// A reply belongs to the navigation that started it, even if the user returns
// to the same seat later. Leaving invalidates every outstanding UI update.
export class RequestScope {
  revision=0;
  begin(){return ++this.revision;}
  capture(){return this.revision;}
  current(ticket){return ticket===this.revision;}
}

export function samePerspective(a,b){return !!a&&!!b&&a.roomId===b.roomId&&a.seat===b.seat;}
export function currentReview(ticket,scope,started,current,prompt,livePrompt){
  return scope.current(ticket)&&samePerspective(started,current)&&started.exchange===current.exchange&&current.canSubmit&&prompt===livePrompt;
}

/** A deadline cancels waiting, never asserts whether a mutation reached storage. */
export async function deadlineRequest(fetcher,url,options,timeout=45000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{return await fetcher(url,{...options,signal:controller.signal});}
  catch(error){
    if(controller.signal.aborted)throw new Error('The response took too long to confirm. Your draft is kept. Refresh or retry this same intention to check its saved result.');
    throw error;
  }finally{clearTimeout(timer);}
}
