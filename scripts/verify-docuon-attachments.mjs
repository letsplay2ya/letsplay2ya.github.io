import assert from 'node:assert/strict';

export async function verifyAttachments(page, base) {
  const section = page.locator('#attachment-review');
  const requestTypes = [];
  const recordRequest = request => {
    if (['xhr', 'fetch'].includes(request.resourceType())) requestTypes.push(request.url());
  };
  const viewport = page.viewportSize();
  const response = await page.goto(base + '/writing/docuon-registration/');
  assert.equal(response.status(), 200);
  await section.locator('xpath=ancestor::astro-island[1][not(@ssr)]').waitFor({ state: 'attached' });
  page.on('request', recordRequest);
  try {
    const receipt = kind => section.locator('[data-receipt="' + kind + '"]');
    const ids = Array.from({ length: 11 }, (_, i) => String(i + 1).padStart(2, '0'));

    async function assertOutput(kind, missing) {
      const expected = ids.filter(id => id !== missing);
      const panel = receipt(kind);
      await panel.getByText('빠진 첨부 ' + missing + '번', { exact: true }).waitFor();
      assert.deepEqual((await panel.locator('output').innerText()).split(' · '), expected);
      assert.equal(await panel.locator('details li').count(), expected.length);
    }

    assert.equal(await section.locator('tbody tr').count(), 1);
    await section.getByRole('button', { name: '첨부 11번 삭제 비교' }).click();
    await assertOutput('original', '01');
    await assertOutput('stable', '11');
    await receipt('original').locator('summary').click();
    assert.match(await receipt('original').locator('li').last().innerText(), /첨부-11\.txt.*본문 11/s);

    await section.getByRole('checkbox').check();
    assert.equal(await section.locator('.results').count(), 0);
    await section.getByRole('button', { name: '첨부 11번 삭제 비교' }).click();
    await assertOutput('original', '01');
    await assertOutput('stable', '11');
    for (const [kind, body] of [['original', '11'], ['stable', '01']]) {
      const panel = receipt(kind);
      await panel.locator('summary').click();
      const duplicate = panel.locator('li').filter({ hasText: '점검표.txt' });
      assert.equal(await duplicate.count(), 1);
      assert.match(await duplicate.innerText(), new RegExp('본문 ' + body));
    }

    await section.getByRole('button', { name: '1페이지', exact: true }).click();
    assert.equal(await section.locator('tbody tr').count(), 10);
    await section.getByRole('button', { name: '첨부 02번 삭제 비교' }).click();
    await assertOutput('original', '02');
    await assertOutput('stable', '02');
    await page.setViewportSize({ width: 390, height: 844 });
    await section.getByRole('button', { name: '2페이지', exact: true }).click();
    const compare = section.getByRole('button', { name: '첨부 11번 삭제 비교' });
    await compare.focus();
    await compare.press('Enter');
    await assertOutput('original', '01');
    await assertOutput('stable', '11');
    await receipt('stable').locator('summary').click();
    assert.ok(await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1), 'Mobile results fit the viewport');
    assert.deepEqual(requestTypes, [], 'Attachment comparisons stay inside the browser');
  } finally {
    page.off('request', recordRequest);
    if (viewport) await page.setViewportSize(viewport);
  }
}
