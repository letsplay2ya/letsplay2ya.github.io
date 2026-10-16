import {useEffect,useState} from 'react';
import report from '../../../public/examples/doc-agent/results.json';
export default function DocAgentReplay(){
 const [index,setIndex]=useState(0);const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 const result=report.results[index];
 return <section className="evidence-demo" aria-labelledby="agent-replay-title"><h2 id="agent-replay-title">문서 검사 도구의 평가 기록</h2><p>모델 없이 실행한 기준 검사입니다. 아래는 저장된 도구 호출 기록이며 실시간 LLM 응답이 아닙니다.</p>
 <label className="experiment-select">살펴볼 사례<select disabled={!ready} value={index} onChange={event=>setIndex(Number(event.target.value))}>{report.results.map((item,i)=><option key={item.id} value={i}>{item.id}{item.exactMatch?' · 기대 결과 일치':' · 오탐 발생'}</option>)}</select></label>
 <div className="experiment-result" role="status"><strong>{result.exactMatch?'기대 결과와 일치':'오탐 발생'}</strong><span>예상 {result.expected.length}건 / 실제 {result.findings?.length??0}건 / 도구 호출 {result.toolCalls}회</span></div>
 {(result.findings??[]).map((finding,i)=><blockquote key={i}><strong>{finding.kind}</strong><p>{finding.path}:{finding.line} — {finding.explanation}</p><code>{finding.evidence}</code></blockquote>)}
 <details><summary>도구 호출 기록 보기</summary><ol className="tool-trace">{result.trace.map((step,i)=><li key={i}><strong>{step.tool}</strong><pre>{JSON.stringify(step.result,null,2)}</pre></li>)}</ol></details>
 <p className="experiment-caption">고정 샘플 6개에서 참양성 2 · 거짓양성 1 · 거짓음성 0. 모델 성능 벤치마크가 아닙니다.</p><a href="/writing/notes-doc-agent/">구현과 실패 사례 읽기 →</a></section>;
}
