import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCandidates, visibleCandidates, makeQuoteRequest } from './model.mjs';

const drafts = () => [
  { objectId: 'A', candidates: buildCandidates() },
  { objectId: 'B', candidates: [] },
];

test('두 담보의 한도는 같은 담보의 부담금하고만 짝을 이룬다', () => {
  const rows = buildCandidates();
  assert.deepEqual(rows.map(row => row.id), ['G0', 'G1', 'X0', 'X1']);
  assert.ok(rows.every(row => row.coverage === row.deductible));
  for (const coverage of ['general', 'x']) {
    assert.deepEqual(visibleCandidates(rows, coverage).map(row => row.clauseIncluded), [false, true]);
  }
});
test('한도를 바꿔도 같은 목적물의 요청에는 네 후보가 남는다', () => {
  const source = drafts();
  for (const coverage of ['general', 'x']) {
    assert.equal(visibleCandidates(source[0].candidates, coverage).length, 2);
    assert.equal(makeQuoteRequest(['A','B'], source)[0].premiumCandidates.length, 4);
  }
});
test('부담금 목록이 비면 일반 한도만 약관 포함·제외 두 후보를 만든다', () => {
  const rows = buildCandidates('empty');
  assert.deepEqual(rows.map(row => [row.coverage,row.deductible]), [['general','none'],['general','none']]);
  assert.equal(visibleCandidates(rows, 'x').length, 0);
});
test('추가 담보 Y의 부담금만 있으면 일반 한도와 X 한도 모두 짝이 없다', () => {
  assert.deepEqual(buildCandidates('mismatch'), []);
});
test('저장 순서를 바꿔도 네 후보가 같은 목적물에 연결된다', () => {
  const rows = makeQuoteRequest(['B','A'], drafts());
  assert.deepEqual(rows.map(row => [row.objectId,row.premiumCandidates.length]), [['B',0],['A',4]]);
});
test('목적물 번호 누락·중복과 끊긴 연결은 요청 생성을 중단한다', () => {
  for (const ids of [['','B'],['A','A'],['A','C']]) {
    assert.throws(() => makeQuoteRequest(ids, drafts()), /목적물/);
  }
});
test('작성한 저장 요청은 이후 편집과 독립적이다', () => {
  const source = drafts();
  const request = makeQuoteRequest(['A','B'],source);
  source[0].candidates[0].amount += 1;
  assert.equal(request[0].premiumCandidates[0].amount,100);
});
