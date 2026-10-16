import {useEffect,useRef,useState} from 'react';
import {AiSummaryBox} from './original/AiSummaryBox';
import {ReferenceCopyButton} from './original/ReferenceCopyButton';
import {applySelection,initialContracts,labels,reference,showValue,type CopyKey,type Contract} from './reviewModel';
import './review.css';
const keys: CopyKey[]=['product','period','territory'];
export default function ReferenceReview(){
 const [contracts,setContracts]=useState<Contract[]>(()=>structuredClone(initialContracts));
 const [active,setActive]=useState(0);
 const [selection,setSelection]=useState<CopyKey[]>([]);
 const [mode,setMode]=useState<'assistant'|'reference'>('assistant');
 const [pending,setPending]=useState<{id:string;keys:CopyKey[]}|null>(null);
 const [ready,setReady]=useState(false);
 const [events,setEvents]=useState<string[]>(['계약 A를 검토 중입니다.']);
 const [last,setLast]=useState<{index:number;value:Contract;keys:CopyKey[]}|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const current=contracts[active];
 useEffect(()=>setReady(true),[]);
 useEffect(()=>{if(pending&&!dialog.current?.open)dialog.current?.showModal();},[pending]);
 const report=(text:string)=>setEvents(previous=>[text,...previous].slice(0,4));
 const switchContract=(index:number)=>{setActive(index);setSelection([]);report('계약 '+contracts[index].id+'의 편집값을 복원했습니다.');};
 const confirm=()=>{
  if(!pending)return;
  try{
   const next=applySelection(current,reference,pending.keys,pending.id);
   setLast({index:active,value:structuredClone(current),keys:pending.keys});
   setContracts(previous=>previous.map((item,index)=>index===active?next:item));
   report('계약 '+current.id+': '+pending.keys.map(key=>labels[key]).join(', ')+' 적용');
   setSelection([]);
  }catch(error){report((error as Error).message);}
  dialog.current?.close();setPending(null);
 };
 return <div className="ref-review" data-reference-review>
  <div className="rr-toolbar"><img src="/assets/koreanre-logo.svg" alt="AI Assistant" /><span>계약 기본정보 · 선택 복사</span><small>가상 데이터 / 로컬 편집</small></div>
  <div className="rr-shell"><nav className="rr-sidebar" aria-label="현재 작업"><strong>특종보험 UW</strong><span>작업 중인 계약</span>{contracts.map((item,index)=><button key={item.id} disabled={!ready} aria-pressed={active===index} onClick={()=>switchContract(index)}>계약 {item.id} 열기</button>)}<p>두 계약을 오가며<br />변경값을 확인하세요.</p></nav>
   <div className="rr-main"><div className="rr-heading"><strong>UW-DEMO-{current.id}</strong><span>계약 기본정보</span></div>
    <AiSummaryBox value="^^상품코드와 표시명^^을 함께 비교하고, 필요한 항목만 현재 계약에 반영합니다." />
    <div className="rr-panels"><section className="rr-contract"><h3>Current Contract <small>계약 {current.id}</small></h3><h4>종목정보</h4>
     <div className="rr-row"><span>상품코드</span><output aria-label="현재 상품코드">{current.product.code}</output></div>
     <div className="rr-row"><span>상품명</span><output aria-label="현재 상품명">{current.product.name}</output></div><h4>UW계약정보</h4>
     <div className="rr-row"><span>보험기간</span><output aria-label="현재 보험기간">{showValue(current,'period')}</output></div>
     <div className="rr-row"><span>담보지역</span><output aria-label="현재 담보지역">{showValue(current,'territory')}</output></div>
     <label className="rr-memo">검토 메모<textarea aria-label="선택 복사 실험 검토 메모" disabled={!ready} value={current.memo} onChange={event=>setContracts(previous=>previous.map((item,index)=>index===active?{...item,memo:event.target.value}:item))}/></label>
     <p className="rr-local-note">편집값은 이 페이지를 여는 동안만 유지됩니다. 서버에 저장하지 않습니다.</p>
    </section><aside className={'rr-reference '+(mode==='assistant'?'rr-ai':'')}>
     {mode==='assistant'?<><h3>AI Assistant</h3><h4>유사UW추천</h4><div className="rr-recommend"><small>설명용 비교 대상</small><strong>UW-DEMO-REF-001</strong><p>상품·기간·지역이 다른 샘플 계약입니다.</p><button disabled={!ready} onClick={()=>setMode('reference')}>이 계약과 비교</button></div></>:<><h3>Reference Contract</h3><p className="rr-ref-label">복사할 항목을 선택하세요.</p>{keys.map(key=><label className="rr-choice" key={key}><input type="checkbox" aria-label={'참고 '+labels[key]+' 선택'} checked={selection.includes(key)} onChange={event=>setSelection(previous=>event.target.checked?[...previous,key]:previous.filter(k=>k!==key))}/><span><b>{labels[key]}</b><span>{showValue(reference,key)}</span></span></label>)}<ReferenceCopyButton hasSelection={selection.length>0} onCopy={()=>setPending({id:current.id,keys:[...selection]})}/><button className="rr-return" onClick={()=>{setMode('assistant');setSelection([]);}}>추천 화면으로</button></>}
    </aside></div>
   </div></div>
  <div className="rr-events"><div role="status" aria-live="polite">{events[0]}</div><button disabled={!last||!ready} onClick={()=>{if(!last)return;setContracts(previous=>previous.map((item,index)=>index===last.index?{...item,...Object.fromEntries(last.keys.map(key=>[key,structuredClone(last.value[key])]))}:item));report('계약 '+last.value.id+'의 마지막 복사를 되돌렸습니다.');setLast(null);}}>마지막 복사 되돌리기</button><details><summary>동작 기록</summary><ol>{events.map((event,index)=><li key={index}>{event}</li>)}</ol></details></div>
  <dialog ref={dialog} aria-labelledby="rr-confirm-title" onCancel={()=>setPending(null)} onClose={()=>setPending(null)}><h3 id="rr-confirm-title">계약 {pending?.id}에 적용할 변경</h3><p>선택하지 않은 항목과 검토 메모는 유지합니다.</p><dl>{pending?.keys.map(key=><div key={key}><dt>{labels[key]}</dt><dd><del>{showValue(current,key)}</del><span>→ {showValue(reference,key)}</span></dd></div>)}</dl><div className="rr-dialog-actions"><button onClick={()=>{dialog.current?.close();setPending(null);}}>취소</button><button onClick={confirm}>확인하고 적용</button></div></dialog>
 </div>;
}
