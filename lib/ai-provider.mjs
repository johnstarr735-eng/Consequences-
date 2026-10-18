import {GameError} from './simulation.mjs';

/** @typedef {{provider?:string,apiKey?:string,model?:string,baseUrl?:string,fetcher?:typeof fetch,timeoutMs?:number}} AIOptions */

// Provider transport only. Schema/plan compilation, access and actualisation
// remain in the existing game. Selecting Ollama never falls back to OpenAI.
/** @param {AIOptions} options */
export function createStructuredRequester({provider,apiKey,model,baseUrl,fetcher=fetch,timeoutMs=25000}={}){
  const selected=provider??(apiKey?'openai':'disabled');
  if(selected==='disabled')return null;
  if(!['ollama','openai'].includes(selected))throw new GameError('Choose AI_PROVIDER=ollama, openai or disabled.',503);
  if(selected==='openai'&&!apiKey)return null;
  if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new GameError('The AI request timeout must be between 1 and 30000 milliseconds.',503);
  let url;
  if(selected==='ollama'){
    try{url=new URL('/api/chat',baseUrl||'http://127.0.0.1:11434');}catch{throw new GameError('The local Ollama address is invalid.',503);}
    if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password)throw new GameError('This Ollama adapter requires a loopback HTTP address on the backend machine.',503);
    if(typeof model!=='string'||!model.trim()||model.length>160||/[\s\u0000-\u001f]/.test(model))throw new GameError('Set OLLAMA_MODEL to an installed local model name.',503);
    if(/(?:^|[-:/])cloud(?:$|[-:/])/i.test(model))throw new GameError('Choose a downloaded local model, rather than an Ollama cloud model.',503);
  }
  const chosenModel=model||(selected==='openai'?'gpt-5.4-mini':null);
  return async({instructions,input,schema,name,maxOutputTokens=1800})=>{
    const local=selected==='ollama';
    const body=local?{
      model:chosenModel,stream:false,think:false,format:schema,
      options:{temperature:0,num_predict:maxOutputTokens},
      messages:[{role:'system',content:`${instructions}\n\nResponse schema:\n${JSON.stringify(schema)}`},{role:'user',content:JSON.stringify(input)}],
    }:{model:chosenModel,store:false,instructions,input:JSON.stringify(input),max_output_tokens:maxOutputTokens,text:{format:{type:'json_schema',name,strict:true,schema}}};
    let response;
    try{
      response=await fetcher(local?url:'https://api.openai.com/v1/responses',{
        method:'POST',redirect:'error',
        headers:local?{'Content-Type':'application/json'}:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
        signal:AbortSignal.timeout(timeoutMs),body:JSON.stringify(body),
      });
    }catch{throw new GameError(local?'Local Ollama could not be reached in time. Check that the backend can reach the installed model. No AI plan was committed.':'The language interpreter could not be reached. No AI plan was committed.',503);}
    if(!response.ok)throw new GameError(response.status===429?'The language interpreter is busy or its usage limit has been reached. Nothing was committed.':local?'Local Ollama returned an error. Check the installed model and server. No AI plan was committed.':'The language interpreter is unavailable. No AI plan was committed.',503);
    let data;
    try{data=await response.json();}catch{throw new GameError('The interpreter returned an unreadable response. No AI plan was committed.',503);}
    const content=Array.isArray(data?.output)?data.output.flatMap(o=>Array.isArray(o?.content)?o.content:[]):[];
    if(content.some(c=>c?.type==='refusal'))throw new GameError('The interpreter could not translate this wording. No outcome has been committed.');
    const output=local?data?.message?.content:content.filter(c=>c?.type==='output_text').map(c=>c.text).join('');
    let value;
    try{if(typeof output!=='string')throw new Error();value=JSON.parse(output);}catch{throw new GameError('The interpreter returned an incomplete response. No AI plan was committed.',503);}
    if(!value||typeof value!=='object'||Array.isArray(value))throw new GameError('The interpreter returned an invalid response object. No AI plan was committed.',503);
    return value;
  };
}
