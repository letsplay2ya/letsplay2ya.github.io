import assert from 'node:assert/strict';
import path from 'node:path';

const desktop = { width: 1440, height: 1000 };
const mobile = { width: 390, height: 844 };
const projectPath = '/projects/docuon/';
const articlePaths = ['/writing/docuon-registration/', '/writing/docuon-transfer-review/'];

export async function verifyDocuon(page, base, qa) {
  const demo = page.locator('#transfer-demo');
  const panel = demo.locator('.console');
  const modal = demo.getByRole('dialog');
  const summary = demo.getByLabel('신청과 문서 상태');
  const button = (name) => demo.getByRole('button', { name, exact: true });
  const reason = modal.getByRole('textbox', { name: '처리 사유' });
  const check = modal.getByRole('button', { name: '입력 내용 확인' });

  async function visit(route) {
    const response = await page.goto(base + route);
    assert.equal(response?.status(), 200, route);
  }

  async function readyDemo() {
    await panel.waitFor();
    await demo.locator('xpath=ancestor::astro-island[1][not(@ssr)]').waitFor({ state: 'attached' });
  }

  async function expectState(request, document) {
    const values = await summary.locator('dd').allTextContents();
    assert.deepEqual(values.map((value) => value.trim()), [request, document]);
  }

  async function submitAndOpenAdmin() {
    await button('이관 신청').click();
    await expectState('접수', '이관 처리 중');
    await button('신청 상세 보기').click();
    await demo.getByRole('heading', { name: '이관 승인 상세' }).waitFor();
    assert.equal(await button('관리자 화면').getAttribute('aria-pressed'), 'true');
  }

  async function confirmDecision(action, message) {
    await button(action).click();
    await reason.fill(message);
    await check.click();
    assert.equal(await modal.locator('blockquote').innerText(), message);
    await modal.getByRole('button', { name: action + ' 확정' }).click();
    await modal.waitFor({ state: 'hidden' });
    assert.equal(await button('승인').isDisabled(), true);
    assert.equal(await button('반려').isDisabled(), true);
    assert.equal(await demo.locator('.fields dd').last().innerText(), message);
    await button('사용자 포털').click();
    assert.equal(await demo.locator('.fields dd').last().innerText(), message);
  }

  async function requireLink(route) {
    const link = page.locator('main a[href="' + route + '"]').first();
    await link.waitFor({ state: 'attached' });
  }

  await page.setViewportSize(desktop);
  try {
    for (const route of ['/', '/projects/']) {
      await visit(route);
      await requireLink(projectPath);
    }
    await visit('/writing/');
    for (const article of articlePaths) await requireLink(article);

    for (const article of articlePaths) {
      await visit(article);
      const related = page.locator('a.related-project');
      assert.equal(await related.getAttribute('href'), projectPath);
      assert.match(await related.innerText(), /DocuON/i);
    }

    await visit(projectPath);
    for (const article of articlePaths) await requireLink(article);
    await readyDemo();
    await expectState('신청 전', '이용 가능');
    await button('관리자 화면').click();
    await demo.getByText('접수된 신청이 없습니다.', { exact: true }).waitFor();
    await button('포털에서 신청하기').click();
    await demo.getByLabel('수관 보관소').selectOption({ label: '제3 보관소' });
    const requestNote = '점검 기록을 제3 보관소로 이관합니다.';
    await demo.getByLabel('신청 사유').fill(requestNote);
    await submitAndOpenAdmin();
    await demo.getByText('제3 보관소', { exact: true }).waitFor();
    await demo.getByText(requestNote, { exact: true }).waitFor();
    await demo.getByText('1건 · 첨부 파일 2개', { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await panel.screenshot({ path: path.join(qa, 'docuon-transfer-preview.png') });

    await button('승인').click();
    assert.equal(await check.isDisabled(), true);
    const boundary = '가'.repeat(85);
    await reason.fill(boundary);
    assert.equal(await modal.locator('#reason-bytes').innerText(), '255 / 255바이트');
    assert.equal(await check.isEnabled(), true);
    await reason.fill(boundary + 'a');
    assert.match(await modal.locator('#reason-bytes').innerText(), /256 \/ 255바이트/);
    assert.equal(await check.isDisabled(), true);
    await reason.fill('취소할 결정입니다.');
    await check.click();
    await modal.getByRole('button', { name: '취소' }).click();
    await modal.waitFor({ state: 'hidden' });
    await expectState('접수', '이관 처리 중');
    assert.equal(await demo.locator('.fields dt').filter({ hasText: '처리 사유' }).count(), 0);

    await confirmDecision('승인', '보관소와 대상 문서를 확인했습니다.');
    await expectState('승인', '이관 처리 중');
    await button('처음부터 다시 보기').click();
    await expectState('신청 전', '이용 가능');
    assert.equal(await demo.getByLabel('수관 보관소').inputValue(), '제2 보관소');

    await page.setViewportSize(mobile);
    for (const route of [...articlePaths, projectPath]) {
      await visit(route);
      await page.evaluate(() => document.fonts.ready);
      assert.ok(await page.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 1), route + ' mobile overflow');
    }
    await readyDemo();
    await submitAndOpenAdmin();
    await button('반려').click();
    await modal.waitFor();
    const bounds = await modal.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= mobile.width + 1 &&
      bounds.y + bounds.height <= mobile.height + 1, 'Decision dialog fits the mobile viewport');
    await reason.fill('수관 보관소를 다시 확인해 주세요.');
    await check.click();
    await modal.screenshot({ path: path.join(qa, 'docuon-transfer-mobile-dialog.png') });
    await modal.getByRole('button', { name: '취소' }).click();
    await modal.waitFor({ state: 'hidden' });
    await expectState('접수', '이관 처리 중');
    await confirmDecision('반려', '분류를 확인한 뒤 다시 신청해 주세요.');
    await expectState('반려', '이용 가능');
  } finally {
    await page.setViewportSize(desktop);
  }
  console.log('DocuON project links, transfer decisions, UTF-8 limits, cancellation and mobile views passed.');
}
