import { buildCandidates, visibleCandidates, makeQuoteRequest } from './model.mjs';

const desk = document.getElementById('quote-workbench');
if (desk) {
  const find = selector => desk.querySelector(selector);
  const scenario = find('[data-quote-scenario]');
  const reverse = find('[data-quote-order]');
  const save = find('[data-quote-save]');
  const label = coverage => coverage === 'general' ? '일반 담보' : '추가 X';
  const cell = (tag, text) => {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  };
  const descriptions = {
    matched: '같은 담보의 한도와 부담금을 짝지은 뒤 약관 포함·제외를 비교합니다.',
    empty: '부담금 목록이 비어 있으면 일반 한도에서만 부담금 없는 두 후보가 생깁니다.',
    mismatch: 'Y 부담금과 짝이 맞는 한도가 없어 이번 조건의 보험료를 계산할 수 없습니다.',
  };
  function signal(title, message) {
    find('[data-quote-status]').textContent = title;
    find('[data-quote-message]').textContent = message;
  }
  function refresh() {
    const candidates = buildCandidates(scenario.value);
    const coverage = find('[name="quote-coverage"]:checked').value;
    const visible = visibleCandidates(candidates, coverage);
    const displayRows = visible.map(candidate => {
      const row = document.createElement('tr');
      const name = cell('th', label(candidate.coverage));
      name.scope = 'row';
      row.append(name, cell('td', candidate.clauseIncluded ? '포함' : '제외'), cell('td', candidate.amount + '만 원'));
      return row;
    });
    if (!displayRows.length) {
      const row = document.createElement('tr');
      const empty = cell('td', '이 한도와 짝이 맞는 견적이 없습니다.');
      empty.colSpan = 3;
      empty.className = 'quote-empty';
      row.append(empty);
      displayRows.push(row);
    }
    find('[data-quote-rows]').replaceChildren(...displayRows);
    find('[data-quote-visible]').textContent = visible.length + '건';
    find('[data-quote-count]').textContent = candidates.length + '건';
    find('[data-quote-reason]').textContent = descriptions[scenario.value];
    const groups = ['general', 'x'].map(coverageId => {
      const clauses = visibleCandidates(candidates, coverageId).map(candidate => candidate.clauseIncluded ? '포함' : '제외');
      const row = document.createElement('li');
      row.append(cell('span', coverageId === 'general' ? '일반 담보' : '추가 담보 X'), cell('b', clauses.join(' · ') || '후보 없음'));
      return row;
    });
    find('[data-quote-groups]').replaceChildren(...groups);
    save.disabled = !candidates.length;
    if (!candidates.length) {
      signal('산정 후보 없음', '부담금 구성을 바꾸면 일치하는 담보 조건으로 다시 비교할 수 있습니다.');
    } else {
      const order = reverse.checked ? 'B → A' : 'A → B';
      signal('요청 대기', '계약의 목적물 순서 ' + order + '. 버튼을 누르면 각 번호에 연결한 후보 수를 확인할 수 있습니다.');
    }
  }
  desk.addEventListener('change', refresh);
  save.addEventListener('click', () => {
    const fullSet = buildCandidates(scenario.value);
    if (!fullSet.length) return;
    const drafts = [{ objectId: 'A', candidates: fullSet }, { objectId: 'B', candidates: [] }];
    const order = reverse.checked ? ['B', 'A'] : ['A', 'B'];
    const request = makeQuoteRequest(order, drafts);
    const groups = request.map(item => '목적물 ' + item.objectId + '에 ' + item.premiumCandidates.length + '건');
    signal('가상 요청 생성', groups.join(' · ') + '. 각 탭의 전체 후보를 목적물 번호로 연결했습니다.');
  });
  refresh();
}
