import { useState } from 'react';
import { isDerivedClauseDiscountTarget } from '../../lib/clause-eligibility';
import './workflow-examples.css';

export default function ClauseEligibilityDemo() {
  const [applied, setApplied] = useState(true);
  const [level, setLevel] = useState('03');
  const [target, setTarget] = useState('');
  const eligible = isDerivedClauseDiscountTarget({ appYn: applied ? 'Y' : 'N', appLevlDvCd: level, clusDcExchgExsoYn: target });
  return <section className="workflow-example" aria-labelledby="clause-demo-heading">
    <h2 id="clause-demo-heading">같은 적용 체크, 다른 할인할증 결과</h2>
    <p>원본 판정 함수에 예제 값을 넣습니다. 보험료 계산이나 실제 계약 저장은 하지 않습니다.</p>
    <div className="workflow-controls">
      <label><input type="checkbox" checked={applied} onChange={event => setApplied(event.target.checked)} />약관 적용</label>
      <label>적용 레벨<select aria-label="약관 적용 레벨" value={level} onChange={event => setLevel(event.target.value)}><option value="03">03</option><option value="04">04</option></select></label>
      <label>할인할증 대상 플래그<select aria-label="할인할증 대상 플래그" value={target} onChange={event => setTarget(event.target.value)}><option value="">누락 / 빈 값</option><option value="Y">Y</option><option value="N">N</option><option value="UNKNOWN">예상하지 못한 값</option></select></label>
    </div>
    <output aria-live="polite" className="workflow-result">{eligible ? '대상에 포함' : '대상에서 제외'}</output>
    <p className="workflow-scope">누락은 나머지 조건으로 판정하지만, 명시적인 N과 알 수 없는 값은 제외합니다. 레벨 04이거나 적용 해제 상태여도 제외됩니다.</p>
  </section>;
}
