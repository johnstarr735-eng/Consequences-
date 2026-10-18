import {createIntentInterpreter} from './intent-model.mjs';
import {createScenarioGenerator,createDialogueGenerator} from './scenario-model.mjs';
import {GameError} from './simulation.mjs';

// Server-owned configuration. No client field selects endpoints or supplies plans.
export function createLanguageProviders(env,fetcher=fetch){
  const provider=String(env.AI_PROVIDER|| (env.OPENAI_API_KEY?'openai':'disabled')).trim().toLowerCase();
  const options=provider==='ollama'?{provider,model:env.OLLAMA_MODEL,baseUrl:env.OLLAMA_BASE_URL,fetcher}:{provider,apiKey:env.OPENAI_API_KEY,model:env.OPENAI_INTENT_MODEL,fetcher};
  try{return{interpreter:createIntentInterpreter(options),generator:createScenarioGenerator(options),dialogue:createDialogueGenerator(options)};}
  catch(error){
    // A misconfigured optional AI must not prevent reading or saving a match.
    // Existing parsable actions still work; free-form review explains the issue.
    const failure=error instanceof GameError?error:new GameError('The AI configuration is unavailable.',503);
    return{interpreter:async()=>{throw failure;},generator:null,dialogue:null};
  }
}
