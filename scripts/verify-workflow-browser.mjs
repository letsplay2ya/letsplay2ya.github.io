import assert from 'node:assert/strict';
import path from 'node:path';

export async function verifyWorkflowArticles(page, base, qa) {
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + '/writing/notes-clause-eligibility/');
    await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr')));
    const result = page.locator('.workflow-result');
    await page.getByRole('checkbox', { name: '약관 적용', exact: true }).uncheck();
    assert.equal(await result.innerText(), '대상에서 제외');
    await page.getByRole('checkbox', { name: '약관 적용', exact: true }).check();
    assert.equal(await result.innerText(), '대상에 포함');
    await page.getByRole('combobox', { name: '할인할증 대상 플래그' }).selectOption('N');
    assert.equal(await result.innerText(), '대상에서 제외');
    await page.getByRole('combobox', { name: '할인할증 대상 플래그' }).selectOption('Y');
    await page.getByRole('combobox', { name: '약관 적용 레벨' }).selectOption('04');
    assert.equal(await result.innerText(), '대상에서 제외');
    await page.getByRole('combobox', { name: '약관 적용 레벨' }).selectOption('03');
    assert.equal(await result.innerText(), '대상에 포함');
    await page.getByRole('combobox', { name: '할인할증 대상 플래그' }).selectOption('UNKNOWN');
    assert.equal(await result.innerText(), '대상에서 제외');

    await page.goto(base + '/writing/notes-keyed-scroll-sync/');
    await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr')));
    const selector = (side, key) => `.scroll-example [data-demo-side="${side}"] [data-scroll-sync-key="${key}"] .ag-center-cols-viewport`;
    const lp = selector('left', 'premium');
    const rp = selector('right', 'premium');
    const rc = selector('right', 'clause');
    const ratio = selector => page.locator(selector).evaluate(element => element.scrollLeft / (element.scrollWidth - element.clientWidth));
    const expectRatio = async (selector, expected) => {
      await page.waitForFunction(({ selector, expected }) => {
        const element = document.querySelector(selector);
        return element && Math.abs(element.scrollLeft / (element.scrollWidth - element.clientWidth) - expected) < 0.01;
      }, { selector, expected });
    };
    const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
    const move = async (selector, position) => {
      await frames();
      await page.locator(selector).evaluate((element, position) => {
        element.scrollLeft = (element.scrollWidth - element.clientWidth) * position;
      }, position);
    };
    const enabled = page.getByRole('checkbox', { name: '스크롤 동기화', exact: true });
    await enabled.uncheck(); // Force a hydrated control update before starting.
    await enabled.check();
    await frames();
    await page.getByRole('button', { name: '왼쪽 보험료를 50%로 이동' }).click();
    await expectRatio(rp, 0.5);
    assert.equal(await ratio(rc), 0, 'Same key is paired despite opposite DOM order');
    await move(rp, 0.75);
    await expectRatio(lp, 0.75);

    const oldRight = await page.locator(rp).elementHandle();
    await page.getByRole('button', { name: '오른쪽 그리드 다시 만들기' }).click();
    assert.equal(await oldRight.evaluate(element => element.isConnected), false);
    assert.equal(await ratio(rp), 0, 'Replacement does not automatically restore the previous position');
    await move(lp, 0.2);
    await expectRatio(rp, 0.2);
    await move(rp, 0.65);
    await expectRatio(lp, 0.65);

    await page.locator(rp).evaluate(element => element.closest('[data-scroll-sync-key]').setAttribute('data-state', 'inactive'));
    await move(lp, 0.3);
    await frames();
    assert.ok(Math.abs(await ratio(rp) - 0.65) < 0.01, 'Inactive target is not written');
    await page.locator(rp).evaluate(element => element.closest('[data-scroll-sync-key]').removeAttribute('data-state'));
    await move(lp, 0.4);
    await expectRatio(rp, 0.4);
    await page.locator('.scroll-example').screenshot({ path: path.join(qa, 'keyed-scroll-desktop.png') });

    await enabled.uncheck();
    await page.locator('.scroll-example-viewport').evaluateAll(elements => elements.forEach(element => { element.scrollLeft = 0; }));
    await frames();
    await page.getByRole('combobox', { name: '스크롤 연결 기준' }).selectOption('order');
    await enabled.check();
    await frames();
    await page.getByRole('button', { name: '왼쪽 보험료를 50%로 이동' }).click();
    await expectRatio(rc, 0.5);
    assert.equal(await ratio(rp), 0, 'Order mode intentionally pairs the wrong business section');
    await enabled.uncheck();
    await move(lp, 0.8);
    await frames();
    assert.ok(Math.abs(await ratio(rc) - 0.5) < 0.01, 'Effect cleanup removes synchronization');

    await page.setViewportSize({ width: 390, height: 844 });
    for (const id of ['notes-clause-eligibility', 'notes-keyed-scroll-sync']) {
      await page.goto(base + `/writing/${id}/`);
      await page.evaluate(() => document.fonts.ready);
      assert.ok(await page.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 1), `${id}: mobile overflow`);
      await page.locator('.workflow-example').screenshot({ path: path.join(qa, id + '-mobile.png') });
    }
    assert.deepEqual(errors, []);
    console.log('Workflow browser checks passed: clause controls, key/order pairing, unequal widths, reverse scroll, DOM replacement, inactive filtering, cleanup, mobile.');
  } finally {
    page.off('pageerror', onError);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
}
