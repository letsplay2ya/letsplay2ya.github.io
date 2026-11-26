// Public teaching model. The amounts below are invented fixtures in units of KRW 10,000.
const fixture = [
  { coverage: 'general', idPrefix: 'G', amounts: [100, 108] },
  { coverage: 'x', idPrefix: 'X', amounts: [130, 142] },
];
const deductibleSets = { matched: ['general', 'x'], empty: [], mismatch: ['y'] };

export function buildCandidates(scenario = 'matched') {
  if (!Object.hasOwn(deductibleSets, scenario)) throw new Error('알 수 없는 부담금 구성입니다.');
  const deductibles = deductibleSets[scenario];
  const result = [];
  for (const limit of fixture) {
    const isGeneralWithoutDeductible = !deductibles.length && limit.coverage === 'general';
    if (!deductibles.includes(limit.coverage) && !isGeneralWithoutDeductible) continue;
    for (const [index, amount] of limit.amounts.entries()) {
      result.push({
        id: limit.idPrefix + index,
        coverage: limit.coverage,
        deductible: isGeneralWithoutDeductible ? 'none' : limit.coverage,
        clauseIncluded: index === 1,
        amount,
      });
    }
  }
  return result;
}

export function visibleCandidates(candidates, coverage) {
  return candidates.filter(row => row.coverage === coverage);
}

// The example represents only the premium section of an object's risk, not a full contract.
export function makeQuoteRequest(objectIds, drafts) {
  const byObject = new Map();
  for (const draft of drafts) {
    if (!draft.objectId || byObject.has(draft.objectId)) throw new Error('편집본의 목적물 번호를 확인하세요.');
    byObject.set(draft.objectId, draft);
  }
  const seen = new Set();
  return objectIds.map(objectId => {
    if (!objectId || seen.has(objectId)) throw new Error('계약에 목적물 번호가 없거나 중복됩니다.');
    seen.add(objectId);
    const draft = byObject.get(objectId);
    if (!draft) throw new Error('목적물과 연결된 편집본을 찾을 수 없습니다.');
    return { objectId, premiumCandidates: draft.candidates.map(row => ({ ...row })) };
  });
}
