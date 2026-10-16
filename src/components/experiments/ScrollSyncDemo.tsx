import { useRef, useState } from 'react';
import { useSyncedSectionScroll } from './original/useSyncedSectionScroll';
import './workflow-examples.css';

function ExampleGrid({ side, sectionKey, wide }: { side: string; sectionKey: string; wide: boolean }) {
  return <section data-scroll-sync-key={sectionKey} className="scroll-example-section">
    <h3>{sectionKey === 'premium' ? '기준보험료' : '약관 할인할증'}</h3>
    <div className="ag-root-wrapper">
      <div className="ag-center-cols-viewport scroll-example-viewport" tabIndex={0} aria-label={`${side} ${sectionKey} 가로 스크롤`}>
        <div className="scroll-example-content" style={{ width: wide ? 1400 : 840 }}>
          {['대상', '조건', '통화', '보험료', '계수', '적용', '비고'].map((label, index) => <span key={label}><b>{label}</b><small>{sectionKey === 'premium' ? '예제 보험료' : '예제 약관'} {index + 1}</small></span>)}
        </div>
      </div>
    </div>
  </section>;
}

export default function ScrollSyncDemo() {
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [pairing, setPairing] = useState<'order' | 'key'>('key');
  const [generation, setGeneration] = useState(0);
  useSyncedSectionScroll(left, right, active, { pairing });
  function moveLeft() {
    const source = left.current?.querySelector<HTMLElement>('[data-scroll-sync-key="premium"] .ag-center-cols-viewport');
    if (source) source.scrollLeft = (source.scrollWidth - source.clientWidth) * 0.5;
  }
  return <section className="workflow-example scroll-example" aria-labelledby="scroll-demo-heading">
    <h2 id="scroll-demo-heading">순서가 다른 두 비교 영역</h2>
    <p>왼쪽은 기준보험료 → 약관, 오른쪽은 약관 → 기준보험료 순서입니다. 원본 스크롤 훅을 그대로 실행하며, 그리드 대신 단순 DOM과 가상 데이터를 사용합니다.</p>
    <div className="workflow-controls">
      <label><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />스크롤 동기화</label>
      <label>연결 기준<select aria-label="스크롤 연결 기준" value={pairing} onChange={event => setPairing(event.target.value as 'key' | 'order')}><option value="key">같은 업무 키</option><option value="order">DOM 순서 (잘못 연결되는 예)</option></select></label>
      <button type="button" onClick={moveLeft}>왼쪽 보험료를 50%로 이동</button>
      <button type="button" onClick={() => setGeneration(value => value + 1)}>오른쪽 그리드 다시 만들기</button>
    </div>
    <p aria-live="polite" className="workflow-scope">연결: {pairing === 'key' ? '업무 키' : 'DOM 순서'} · 동기화 {active ? '켜짐' : '꺼짐'} · 오른쪽 DOM 재생성 {generation}회. 재생성 후 왼쪽을 다시 움직여 보세요.</p>
    <div className="scroll-example-columns">
      <div ref={left} data-demo-side="left"><strong>Current · 좁은 내용</strong><ExampleGrid side="왼쪽" sectionKey="premium" wide={false} /><ExampleGrid side="왼쪽" sectionKey="clause" wide={false} /></div>
      <div ref={right} data-demo-side="right"><strong>Reference · 넓은 내용</strong><div key={generation}><ExampleGrid side="오른쪽" sectionKey="clause" wide /><ExampleGrid side="오른쪽" sectionKey="premium" wide /></div></div>
    </div>
    <p className="workflow-scope">진행률을 맞추는 예제입니다. 같은 이름의 열을 정렬하거나 양쪽 열 너비를 같게 만들지는 않습니다.</p>
  </section>;
}
