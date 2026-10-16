import {fileURLToPath} from 'node:url';
import {runAgent,baselineProvider,openAIProvider} from './agent.mjs';
const mode=process.argv[2]??'baseline';
if(!['baseline','openai'].includes(mode))throw Error('Choose baseline or openai');
const root=process.argv[3]??fileURLToPath(new URL('./fixtures/missing-script/',import.meta.url));
const provider=mode==='openai'?openAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL}):baselineProvider();
const result=await runAgent(provider,root);
console.log(JSON.stringify({provider:mode,...result},null,2));
if(result.status!=='complete')process.exitCode=1;
