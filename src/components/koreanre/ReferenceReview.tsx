import { useEffect, useRef, useState } from 'react';
import { AiSummaryBox } from './original/AiSummaryBox';
import { ReferenceCopyButton } from './original/ReferenceCopyButton';
import { applySelection, initialContracts, labels, reference, showValue, type Contract, type CopyKey } from './reviewModel';
import './review.css';

const keys: CopyKey[] = ['product', 'period', 'territory'];
const fieldNames: Record<CopyKey, string> = { product: '상품', period: '보험기간', territory: '담보지역' };

function ContractValue({ contract, field, current = false }: { contract: Contract; field: CopyKey; current?: boolean }) {
  if (field === 'product') {
    return <>
      <strong aria-label={current ? '현재 상품명' : undefined}>{contract.product.name}</strong>
      <small aria-label={current ? '현재 상품코드' : undefined}>{contract.product.code}</small>
      <small>{contract.product.division}</small>
    </>;
  }
  if (field === 'period') {
    return <span className="rr-date" aria-label={current ? '현재 보험기간' : undefined}>
      <time dateTime={contract.period.from}>{contract.period.from}</time>
      <time dateTime={contract.period.to}>~ {contract.period.to}</time>
    </span>;
  }
  return <strong aria-label={current ? '현재 담보지역' : undefined}>{contract.territory.name}</strong>;
}

export default function ReferenceReview() {
  const [contracts, setContracts] = useState<Contract[]>(() => structuredClone(initialContracts));
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState<CopyKey[]>([]);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<{ id: string; keys: CopyKey[] } | null>(null);
  const [last, setLast] = useState<{ index: number; value: Contract; keys: CopyKey[] } | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = contracts[active];
  const previewKeys: CopyKey[] = editing ? selection : ['product'];
  const preview = previewKeys.length ? applySelection(current, reference, previewKeys, current.id) : current;

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (pending && !dialog.current?.open) dialog.current?.showModal();
  }, [pending]);

  function report(message: string) {
    setEvents(previous => [message, ...previous].slice(0, 4));
  }

  function chooseContract(index: number) {
    setActive(index);
    setSelection([]);
    report('계약 ' + contracts[index].id + '의 편집값을 불러왔습니다.');
  }

  function confirm() {
    if (!pending) return;
    try {
      const next = applySelection(current, reference, pending.keys, pending.id);
      setLast({ index: active, value: current, keys: pending.keys });
      setContracts(previous => previous.map((item, index) => index === active ? next : item));
      report('계약 ' + current.id + '에 ' + pending.keys.map(key => fieldNames[key]).join(', ') + ' 항목을 적용했습니다.');
      setSelection([]);
    } catch (error) {
      report((error as Error).message);
    }
    dialog.current?.close();
    setPending(null);
  }

  function undo() {
    if (!last) return;
    const restored = Object.fromEntries(last.keys.map(key => [key, structuredClone(last.value[key])]));
    setContracts(previous => previous.map((item, index) => index === last.index ? { ...item, ...restored } : item));
    report('계약 ' + last.value.id + '의 마지막 복사를 되돌렸습니다.');
    setLast(null);
  }

  return <div className="ref-review" data-reference-review>
    <div className="rr-toolbar">
      <img src="/assets/koreanre-logo.svg" alt="AI Assistant" />
      <span className="rr-toolbar-title">계약 기본정보</span>
      <small>가상 계약</small>
    </div>
    <div className="rr-comparison">
      <div className="rr-topline">
        <h3>{editing ? '선택한 항목 적용 미리보기' : '상품만 가져온 경우'}</h3>
        <div className="rr-contracts" role="group" aria-label="검토할 계약">
          {contracts.map((item, index) => <button type="button" key={item.id}
            disabled={!ready} aria-label={'계약 ' + item.id + ' 열기'} aria-pressed={active === index}
            onClick={() => chooseContract(index)}>계약 {item.id}</button>)}
        </div>
      </div>
      <table className="rr-ledger" aria-label={'계약 ' + current.id + '와 참고 계약의 항목별 복사 결과 미리보기'}>
        <thead><tr><th scope="col">항목</th><th scope="col">현재 계약 {current.id}</th><th scope="col">참고 계약</th><th scope="col">적용 후 예상값</th></tr></thead>
        <tbody>{keys.map(key => {
          const included = previewKeys.includes(key);
          return <tr key={key} data-included={included}>
            <th scope="row">{editing ? <label className="rr-field-choice">
              <input type="checkbox" aria-label={'참고 ' + labels[key] + ' 선택'} checked={included}
                onChange={event => setSelection(previous => event.target.checked ? [...previous, key] : previous.filter(k => k !== key))} />
              {fieldNames[key]}
            </label> : fieldNames[key]}</th>
            <td><ContractValue field={key} contract={current} current /></td>
            <td><ContractValue field={key} contract={reference} /></td>
            <td className="rr-result">
              <span className={'rr-result-label' + (included ? ' rr-included' : '')}>{included ? '참고값 적용' : '현재값 유지'}</span>
              <ContractValue field={key} contract={preview} />
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <div className="rr-controls">
      {editing ? <>
        <ReferenceCopyButton hasSelection={selection.length > 0} onCopy={() => setPending({ id: current.id, keys: [...selection] })} />
        <button type="button" className="rr-link" onClick={() => { setSelection([]); setEditing(false); }}>예시로 돌아가기</button>
      </> : <button type="button" className="rr-primary" disabled={!ready} onClick={() => setEditing(true)}>이 계약과 비교</button>}
    </div>
    <div className="rr-context">
      <AiSummaryBox value="상품을 가져오면 ^^상품코드·상품명·국내외 구분^^을 함께 반영합니다." />
      <label className="rr-memo"><span>계약 {current.id} 검토 메모</span>
        <textarea rows={1} aria-label="선택 복사 실험 검토 메모" disabled={!ready} value={current.memo}
          onChange={event => setContracts(previous => previous.map((item, index) => index === active ? { ...item, memo: event.target.value } : item))} />
      </label>
    </div>
    <div className="rr-history">
      <span role="status" aria-live="polite">{events[0]}</span>
      {last && <button type="button" className="rr-link" disabled={!ready} onClick={undo}>마지막 복사 되돌리기</button>}
      {events.length > 1 && <details><summary>동작 기록</summary><ol>{events.map((message, index) => <li key={index}>{message}</li>)}</ol></details>}
    </div>
    <dialog ref={dialog} aria-labelledby="rr-confirm-title" onCancel={() => setPending(null)} onClose={() => setPending(null)}>
      <h3 id="rr-confirm-title">계약 {pending?.id}에 적용할 변경</h3>
      <p>선택하지 않은 항목과 검토 메모는 유지합니다.</p>
      <dl>{pending?.keys.map(key => <div key={key}><dt>{fieldNames[key]}</dt>
        <dd><del>{showValue(current, key)}</del><span>→ {showValue(reference, key)}</span></dd></div>)}</dl>
      <div className="rr-dialog-actions">
        <button type="button" onClick={() => dialog.current?.close()}>취소</button>
        <button type="button" className="rr-primary" onClick={confirm}>확인하고 적용</button>
      </div>
    </dialog>
  </div>;
}
