import {readFile,writeFile} from 'node:fs/promises';
import {runAgent,baselineProvider} from './agent.mjs';
const cases=JSON.parse(await readFile(new URL('./cases.json',import.meta.url),'utf8'));
const signature=f=>[f.path,f.line,f.kind].join(':');
let tp=0,fp=0,fn=0;
const results=[];
for(const item of cases){
 const run=await runAgent(baselineProvider(),new URL('./fixtures/'+item.id+'/',import.meta.url));
 const expected=new Set(item.expected.map(signature));const actual=new Set((run.findings??[]).map(signature));
 const truePositive=[...actual].filter(key=>expected.has(key)).length;
 const falsePositive=[...actual].filter(key=>!expected.has(key)).length;
 const falseNegative=[...expected].filter(key=>!actual.has(key)).length;
 tp+=truePositive;fp+=falsePositive;fn+=falseNegative;
 results.push({id:item.id,status:run.status,expected:item.expected,findings:run.findings,exactMatch:run.status==='complete'&&!falsePositive&&!falseNegative,toolCalls:run.trace.length,elapsedMs:run.elapsedMs,trace:run.trace});
}
const precision=tp/(tp+fp||1),recall=tp/(tp+fn||1);
const report={generatedAt:new Date().toISOString(),provider:'deterministic-baseline',liveModel:false,scope:'6 fixed synthetic fixtures; not a model benchmark',metrics:{truePositive:tp,falsePositive:fp,falseNegative:fn,precision,recall,exactCases:results.filter(r=>r.exactMatch).length,totalCases:results.length},results};
if(process.argv[2]==='--write'&&process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.metrics));
