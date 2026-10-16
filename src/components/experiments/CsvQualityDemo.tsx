import {useEffect,useState} from 'react';
const sample=[
 ['A-001','2026-01-01','1000','예시기업'],['A-002','2026-02-30','200','날짜 오류'],['A-003','2026-01-03','1,200','금액 표기 오류'],['A-001','2026-01-04','300','중복 식별자'],['A-004','2026-01-04','','금액 누락'],['A-005','2026-01-05','-10','음수 금액'],['A-006','2026-01-06','0','영원기업'],['A-007','2026-01-07','25.50','예시, 서비스'],['A-008','2026-1-8','50','날짜 형식 오류'],
];
function validate(rows:string[][]){
 const seen=new Set<string>();return rows.map(([rawId,rawDay,rawAmount,company])=>{
  const id=rawId.trim(),day=rawDay.trim(),amount=rawAmount.trim(),errors:string[]=[];
  if(!/^A-[0-9]{3}$/.test(id))errors.push('ID_FORMAT');else if(seen.has(id))errors.push('DUPLICATE_ID');
  if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day))errors.push('DATE_FORMAT');
  else {const parsed=new Date(day+'T00:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==day||day.startsWith('0000'))errors.push('DATE_VALUE');}
  if(!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(amount))errors.push('AMOUNT_FORMAT');
  else if(Number(amount)>999999999999.99)errors.push('AMOUNT_RANGE');
  if(!company.trim())errors.push('COMPANY_REQUIRED');if(errors.length===0)seen.add(id);
  return errors;
 });
}
export default function CsvQualityDemo(){
 const [rows,setRows]=useState(()=>structuredClone(sample));const [result,setResult]=useState<string[][]|null>(null);const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 const change=(row:number,column:number,value:string)=>{setRows(previous=>previous.map((item,index)=>index===row?item.map((cell,i)=>i===column?value:cell):item));setResult(null);};
 return <section className="evidence-demo" aria-labelledby="csv-demo-title"><h2 id="csv-demo-title">오류 값을 고쳐서 검증해 보기</h2><p>날짜와 금액을 수정한 뒤 검증하세요. 이 화면은 브라우저 검사이며 DB에 저장하지 않습니다. 원본 보관·트랜잭션 실습은 내려받는 Python 코드에서 실행합니다.</p><div className="experiment-table"><table><thead><tr><th>ID</th><th>날짜</th><th>금액</th><th>검사 결과</th></tr></thead><tbody>{rows.map((row,i)=><tr key={i}><td>{row[0]}</td><td><input disabled={!ready} aria-label={'행 '+(i+1)+' 날짜'} value={row[1]} onChange={e=>change(i,1,e.target.value)}/></td><td><input disabled={!ready} aria-label={'행 '+(i+1)+' 금액'} value={row[2]} onChange={e=>change(i,2,e.target.value)}/></td><td>{result?result[i].join(', ')||'정상':'검증 전'}</td></tr>)}</tbody></table></div><div className="experiment-actions"><button disabled={!ready} onClick={()=>setResult(validate(rows))}>현재 값 검증</button><button disabled={!ready} onClick={()=>{setRows(structuredClone(sample));setResult(null);}}>샘플 복원</button></div><div className="experiment-result" role="status">{result?<><strong>정상 {result.filter(errors=>errors.length===0).length}건 · 거절 {result.filter(errors=>errors.length>0).length}건</strong><span>동일 ID는 먼저 정상 처리된 행을 유지합니다.</span></>:<span>아직 검증하지 않았습니다.</span>}</div><a href="/writing/legacy-oracle-ch3/">실행 코드와 결과 해설 →</a></section>;
}
