import assert from 'node:assert/strict';
import path from 'node:path';

export async function verifySearchArticles(page, base, qa) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/writing/notes-vue-search-cleanup/');
  await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr')));
  const protectedResult = page.getByLabel('보호한 검색 결과', { exact: true });
  const naive = page.getByLabel('보호 없는 검색 결과', { exact: true });
  const status = page.locator('.vue-search-example [role="status"]');
  const search = async (term, id) => {
    await page.getByRole('button', { name: `계약 ${term} 검색`, exact: true }).click();
    await page.getByRole('button', { name: `요청 ${id} ${term} 응답 도착`, exact: true }).waitFor();
  };
  await search('A', 1); await search('B', 2);
  await page.getByRole('button', { name: '요청 2 B 응답 도착', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[aria-label="보호한 검색 결과"]')?.textContent === 'B 결과');
  await page.getByRole('button', { name: '요청 1 A 응답 도착', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[aria-label="보호 없는 검색 결과"]')?.textContent === 'A 결과');
  assert.equal(await protectedResult.innerText(), 'B 결과');
  assert.equal(await naive.innerText(), 'A 결과');
  await page.locator('.vue-search-example').screenshot({ path: path.join(qa, 'vue-search-race-desktop.png') });

  await search('A', 3); await search('B', 4);
  await page.getByRole('button', { name: '요청 3 오류 도착', exact: true }).click();
  assert.equal(await status.innerText(), '조회 중');
  await page.getByRole('button', { name: '요청 4 오류 도착', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.vue-search-example [role="status"]')?.textContent === 'B 조회 실패');
  await page.getByRole('button', { name: '빈 검색으로 초기화', exact: true }).click();
  await search('A', 5);
  await page.getByRole('button', { name: '빈 검색으로 초기화', exact: true }).click();
  await page.getByRole('button', { name: '요청 5 A 응답 도착', exact: true }).click();
  assert.equal(await protectedResult.innerText(), '없음');
  assert.equal(await status.innerText(), '대기');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of ['notes-vue-search-cleanup', 'notes-spring-transaction-boundary', 'notes-idempotent-import', 'notes-document-evidence', 'notes-async-calculation']) {
    const response = await page.goto(base + `/writing/${id}/`);
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 1), `${id}: mobile overflow`);
    if (id === 'notes-vue-search-cleanup') await page.locator('.vue-search-example').screenshot({ path: path.join(qa, 'vue-search-race-mobile.png') });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('New article browser checks passed: Vue reversed responses, stale errors/loading, current failure, empty search and five mobile articles.');
}
