export type Contract = { id: string; product: {code: string; name: string}; period: {from: string; to: string}; territory: {code: string; name: string}; memo: string };
export type CopyKey = 'product' | 'period' | 'territory';
export const labels: Record<CopyKey,string> = {product:'상품코드·상품명',period:'보험기간',territory:'담보지역'};
export const reference: Contract = {id:'REF-001',product:{code:'DEMO-GL-02',name:'영업배상 · 샘플'},period:{from:'2026-02-01',to:'2027-01-31'},territory:{code:'KR',name:'대한민국'},memo:'샘플 참고 계약'};
export const initialContracts: Contract[] = [
 {id:'A',product:{code:'DEMO-GL-01',name:'시설배상 · 샘플'},period:{from:'2026-01-01',to:'2026-12-31'},territory:{code:'ALL',name:'전 세계 · 샘플'},memo:'계약 A의 검토 메모'},
 {id:'B',product:{code:'DEMO-GL-03',name:'생산물배상 · 샘플'},period:{from:'2026-03-01',to:'2027-02-28'},territory:{code:'KR',name:'대한민국'},memo:'계약 B의 검토 메모'},
];
export function applySelection(current: Contract, source: Contract, keys: CopyKey[], expectedId: string): Contract {
 if(current.id !== expectedId) throw new Error('복사 대상 계약이 변경되었습니다.');
 if(keys.length===0) throw new Error('복사할 항목을 선택하세요.');
 const next=structuredClone(current);
 for(const key of keys) {
  if(!Object.hasOwn(labels,key)) throw new Error('지원하지 않는 항목입니다.');
  if(key==='period' && source.period.from>source.period.to) throw new Error('보험기간을 확인하세요.');
  // Code and display name travel as one unit; source objects must not alias edits.
  Object.assign(next,{[key]:structuredClone(source[key])});
 }
 return next;
}
export const showValue=(contract: Contract,key: CopyKey): string => key==='period' ? contract.period.from+' ~ '+contract.period.to : contract[key].code+' / '+contract[key].name;
