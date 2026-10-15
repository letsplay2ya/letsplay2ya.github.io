import { useEffect, useRef, useState } from 'react';
import './response-guard.css';

export default function ResponseGuard() {
  const [value, setValue] = useState(100);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [status, setStatus] = useState('요청을 시작한 뒤 응답을 기다리는 동안 입력을 바꿔 보세요.');
  const current = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  useEffect(() => {
    setReady(true);
    return () => { if (timer.current) clearTimeout(timer.current); sequence.current++; };
  }, []);
  const edit = (next: number) => {
    current.current = next;
    setValue(next);
    setResult(null);
    if (!running) setStatus('입력이 바뀌었습니다. 현재 값으로 요청할 수 있습니다.');
  };
  const request = () => {
    if (running) return;
    const captured = current.current;
    const version = ++sequence.current;
    setRunning(true);
    setResult(null);
    setStatus(`입력 ${captured}로 요청했습니다. 2초 안에 값을 변경해 보세요.`);
    timer.current = setTimeout(() => {
      if (version !== sequence.current) return;
      setRunning(false);
      timer.current = null;
      if (captured !== current.current) {
        setStatus(`이전 입력 ${captured}의 응답을 제외했습니다. 현재 입력은 ${current.current}입니다.`);
      } else {
        setResult(captured * 2);
        setStatus(`요청 입력 ${captured}과 현재 입력이 같아 결과를 반영했습니다.`);
      }
    }, 2000);
  };
  const reset = () => {
    sequence.current++;
    if (timer.current) clearTimeout(timer.current);
    current.current = 100;
    setValue(100); setResult(null); setRunning(false);
    setStatus('초기화했습니다. 진행 중이던 응답은 반영하지 않습니다.');
  };
  return <div className="guard-demo" data-guard-demo>
    <div className="guard-top"><span>EXPERIMENT 01</span><span>비동기 응답</span></div>
    <h2>늦게 도착한 결과,<br />지금도 유효할까요?</h2>
    <p>현재 입력과 요청 당시의 입력을 비교하는 실험입니다.</p>
    <label htmlFor="guard-value">입력 값 <output>{value}</output></label>
    <input id="guard-value" type="range" min="10" max="200" step="10" value={value} disabled={!ready} onChange={event => edit(Number(event.target.value))} />
    <div className="guard-presets"><button type="button" disabled={!ready} onClick={() => edit(50)}>50으로 변경</button><button type="button" disabled={!ready} onClick={() => edit(150)}>150으로 변경</button></div>
    <div className="guard-result"><span>반영된 결과 · 입력 × 2</span><strong>{result ?? '—'}</strong></div>
    <div className="guard-controls"><button className="guard-run" type="button" disabled={!ready || running} onClick={request}>{!ready ? '준비 중…' : running ? '응답 대기 중…' : '계산 요청'}</button><button type="button" disabled={!ready} onClick={reset}>초기화</button></div>
    <p className="guard-status" role="status" aria-live="polite">{status}</p>
    <small>2초 지연을 브라우저에서 재현합니다. 외부 API 요청 없이 동작합니다.</small>
  </div>;
}
