import assert from 'node:assert/strict';
import path from 'node:path';

const title = '11월 장비 점검 기록';
const desktop = { width: 1440, height: 1000 };
const mobile = { width: 390, height: 844 };

export async function verifyProjection(page, base, qa) {
  const section = page.locator('#transfer-rows');
  const panel = section.locator('.projection-panel');
  const sourceMode = section.getByRole('button', { name: '원본 조회 구조', exact: true });
  const groupedMode = section.getByRole('button', { name: '문서별 재집계', exact: true });
  const pdf = section.getByRole('checkbox', { name: '점검 기록.pdf', exact: true });
  const appendix = section.getByRole('checkbox', { name: '점검표 별지.pdf', exact: true });
  const photo = section.getByRole('checkbox', { name: '현장 사진.jpg', exact: true });

  async function assertTable(rows, fileCount, unit) {
    const cells = await section.locator('tbody tr').evaluateAll(elements =>
      elements.map(tr => Array.from(tr.cells, td => td.textContent.trim()))
    );
    assert.deepEqual(cells, rows);
    assert.equal(await section.getByRole('columnheader', { name: unit, exact: true }).count(), 1);
    const counts = (await section.locator('.counts').innerText()).replace(/\s+/g, ' ').trim();
    assert.ok(counts.includes('신청 1건 · 문서 1건 · 첨부 ' + fileCount + '개'), counts);
    assert.ok(counts.endsWith('결과 ' + rows.length + '행'), counts);
  }

  try {
    await page.setViewportSize(desktop);
    const response = await page.goto(base + '/projects/docuon/#transfer-rows');
    assert.equal(response?.status(), 200);
    await section.locator('xpath=ancestor::astro-island[1][not(@ssr)]').waitFor({ state: 'attached' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await sourceMode.getAttribute('aria-pressed'), 'true');
    await assertTable([[title, '1', '1,048,576'], [title, '1', '262,144']], 2, '용량(MB)');
    await panel.screenshot({ path: path.join(qa, 'docuon-projection.png'), animations: 'disabled' });

    await groupedMode.click();
    await assertTable([[title, '2', '1.25']], 2, '용량(MiB)');
    await photo.check();
    await assertTable([[title, '3', '1.75']], 3, '용량(MiB)');
    await sourceMode.click();
    await assertTable([[title, '1', '1,048,576'], [title, '1', '262,144'], [title, '1', '524,288']], 3, '용량(MB)');
    await pdf.uncheck();
    await photo.uncheck();
    assert.equal(await appendix.isDisabled(), true);
    await assertTable([[title, '1', '262,144']], 1, '용량(MB)');

    await page.setViewportSize(mobile);
    await pdf.focus();
    await pdf.press('Space');
    await groupedMode.focus();
    await groupedMode.press('Enter');
    await assertTable([[title, '2', '1.25']], 2, '용량(MiB)');
    assert.ok(await panel.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'Mobile panel overflow');
    assert.ok(await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1), 'Mobile page overflow');
  } finally {
    await page.setViewportSize(desktop);
  }
  console.log('DocuON projection passed for attachment rows, document aggregation, byte units, keyboard and mobile.');
}
