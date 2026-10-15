import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { load } from 'cheerio';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const qa = path.join(root, '.qa');
assert.ok(existsSync(path.join(dist, 'index.html')), 'Run npm.cmd run build before verification.');
mkdirSync(qa, { recursive: true });
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(path.join(dir, item.name)) : [path.join(dir, item.name)]);
const htmlFiles = walk(dist).filter(file => file.endsWith('.html'));
const failures = [];
let links = 0;
let anchors = 0;
const documents = new Map(htmlFiles.map(file => [file, load(readFileSync(file, 'utf8'))]));
function localFile(url) {
  const resolved = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
  if (path.relative(dist, resolved).startsWith('..')) return null;
  if (existsSync(resolved) && statSync(resolved).isDirectory()) return path.join(resolved, 'index.html');
  return resolved;
}
for (const [file, $] of documents) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const pageUrl = new URL('/' + relative.replace(/index\.html$/, ''), 'http://local.test');
  if (!file.includes(`${path.sep}embeds${path.sep}`) && !$('meta[http-equiv="refresh"]').length) {
    if ($('h1').length !== 1) failures.push(`${relative}: expected one h1, found ${$('h1').length}`);
    if (!$('title').text().trim()) failures.push(`${relative}: empty title`);
    if (!$('meta[name="description"]').attr('content')) failures.push(`${relative}: empty description`);
  }
  const ids = new Set();
  $('[id]').each((_, element) => {
    const id = $(element).attr('id');
    if (ids.has(id)) failures.push(`${relative}: duplicate id #${id}`);
    ids.add(id);
  });
  $('a[href], img[src], script[src], link[href], iframe[src]').each((_, element) => {
    const attr = element.name === 'a' || element.name === 'link' ? 'href' : 'src';
    const value = $(element).attr(attr);
    if (!value || /^(?:data:|mailto:|tel:|javascript:)/i.test(value)) return;
    const target = new URL(value, pageUrl);
    if (target.origin !== pageUrl.origin) return;
    links++;
    const targetFile = localFile(target);
    if (!targetFile || !existsSync(targetFile)) { failures.push(`${relative}: missing ${value}`); return; }
    if (target.hash && documents.has(targetFile)) {
      anchors++;
      const wanted = decodeURIComponent(target.hash.slice(1));
      const found = documents.get(targetFile)('[id]').toArray().some(el => el.attribs.id === wanted);
      if (!found) failures.push(`${relative}: missing anchor ${value}`);
    }
  });
}
assert.deepEqual(failures, [], 'Built HTML integrity failed:\n' + failures.join('\n'));
const routes = JSON.parse(readFileSync(path.join(root, 'src/data/legacy-routes.json'), 'utf8'));
for (const route of routes) {
  const oldFile = localFile(new URL(route.from, 'http://local.test'));
  assert.ok(oldFile && existsSync(oldFile), `Missing legacy route: ${route.from}`);
  assert.equal(documents.get(oldFile)('#destination').attr('href'), route.to);
}
console.log(`HTML integrity: ${htmlFiles.length} files, ${links} local references, ${anchors} anchors, ${routes.length} legacy routes.`);

const executable = process.env.BROWSER_PATH || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(file => existsSync(file));
assert.ok(executable, 'No installed Edge/Chrome found. Set BROWSER_PATH to an installed Chromium browser.');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.JPG': 'image/jpeg', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
  try {
    const file = localFile(new URL(req.url, 'http://local.test'));
    if (!file || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  } catch { res.writeHead(400); res.end('Bad request'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];
const checked = [];
try {
  browser = await chromium.launch({ executablePath: executable, headless: true, args: ['--disable-gpu', '--no-first-run'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/', '/projects/', '/writing/', '/about/', '/lab/', '/projects/koreanre-ai-assistant/', '/writing/legacy-oracle-install/', '/writing/legacy-thymeleaf-javascript/', '/writing/legacy-vue-component/', '/writing/notes-full-snapshot-api/', '/writing/notes-response-ordering/', '/writing/notes-stable-identity-save/']) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200, route);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1, route);
    assert.ok(await page.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 1), `${route}: desktop overflow`);
    checked.push(route);
  }
  await page.goto(base + '/');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(qa, 'home-desktop.png'), fullPage: true });

  await page.goto(base + '/writing/');
  const allCount = await page.locator('[data-filter-item]:visible').count();
  const expectedPosts = readdirSync(path.join(dist, 'writing'), { withFileTypes: true }).filter(entry => entry.isDirectory()).length;
  assert.equal(allCount, expectedPosts, 'Every published article is visible before filtering');
  await page.getByRole('searchbox').fill('없는글검증-123456');
  assert.equal(await page.locator('[data-filter-item]:visible').count(), 0);
  assert.equal(await page.locator('[data-filter-empty]').isVisible(), true);
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Vue', exact: true }).click();
  assert.ok(await page.locator('[data-filter-item]:visible').count() > 0, 'Vue tag filter');
  await page.getByRole('button', { name: '전체', exact: true }).click();
  assert.equal(await page.locator('[data-filter-item]:visible').count(), allCount);

  await page.goto(base + '/projects/koreanre-ai-assistant/');
  await page.waitForFunction(() => document.querySelector('astro-island') && !document.querySelector('astro-island').hasAttribute('ssr'));
  const memo = page.getByRole('textbox', { name: '현재 계약 검토 메모' });
  await memo.fill('검증용 A 메모');
  await page.getByRole('button', { name: '계약 상세정보', exact: true }).click();
  await page.getByRole('button', { name: '생산물 배상', exact: true }).click();
  await page.getByRole('button', { name: '계약 B', exact: true }).click();
  assert.notEqual(await memo.inputValue(), '검증용 A 메모', 'Switching contracts changes the visible memo');
  assert.equal(await page.getByRole('button', { name: '계약 기본정보', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: '계약 A', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '계약 상세정보', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: '생산물 배상', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: '계약 기본정보', exact: true }).click();
  assert.equal(await memo.inputValue(), '검증용 A 메모');
  await page.getByRole('button', { name: 'Reference', exact: true }).click();
  await page.getByRole('button', { name: '검토 메모 복사', exact: true }).click();
  assert.match(await memo.inputValue(), /^참고 계약:/);
  assert.equal(await page.getByRole('button', { name: '참고 계약 비교 →', exact: true }).count(), 0, 'Assistant hidden while comparing Reference');
  await page.getByRole('button', { name: 'Terms&Conditions', exact: true }).click();
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await page.getByRole('button', { name: '추가', exact: true }).click();
  assert.equal(await page.locator('.ws-terms li').count(), 2, 'Clause deduplication');
  assert.match(await page.locator('.ws-status').innerText(), /중복/);
  await page.getByRole('button', { name: '요율산정', exact: true }).click();
  assert.equal(await page.getByRole('table').count(), 1);
  await page.locator('.workspace-demo').screenshot({ path: path.join(qa, 'workspace-desktop.png') });

  await page.goto(base + '/lab/');
  await page.getByRole('button', { name: '계산 요청', exact: true }).click();
  await page.getByRole('button', { name: '50으로 변경', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.guard-status')?.textContent.includes('제외했습니다'));
  assert.equal(await page.locator('.guard-result strong').innerText(), '—');
  await page.getByRole('button', { name: '계산 요청', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.guard-result strong')?.textContent === '100');
  await page.getByRole('button', { name: '계산 요청', exact: true }).click();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  assert.match(await page.locator('.guard-status').innerText(), /초기화/);
  await page.screenshot({ path: path.join(qa, 'lab-desktop.png'), fullPage: true });

  await page.goto(base + routes[1].from + '#test-fragment');
  await page.waitForURL(url => url.pathname === routes[1].to && url.hash === '#test-fragment');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/writing/', '/projects/koreanre-ai-assistant/', '/lab/', '/writing/legacy-oracle-install/', '/writing/legacy-thymeleaf-javascript/', '/writing/notes-full-snapshot-api/', '/writing/notes-response-ordering/', '/writing/notes-stable-identity-save/']) {
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 1), `${route}: mobile overflow`);
    if (route === '/') await page.screenshot({ path: path.join(qa, 'home-mobile.png'), fullPage: true });
    if (route.includes('koreanre-ai-assistant')) await page.locator('.workspace-demo').screenshot({ path: path.join(qa, 'workspace-mobile.png') });
  }
  assert.deepEqual(errors, [], 'Browser runtime errors');
  writeFileSync(path.join(qa, 'verification.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), htmlFiles: htmlFiles.length, localReferences: links, anchors, legacyRoutes: routes.length, checkedRoutes: checked, desktop: '1440x1000', mobile: '390x844', interactions: ['post-search-and-tags', 'contract-snapshot', 'reference-copy', 'clause-deduplication', 'stale-response-guard', 'matching-response', 'request-reset', 'legacy-redirect-with-fragment'], runtimeErrors: errors }, null, 2) + '\n');
  console.log('Browser checks passed: search/tags, Vue contract snapshots/copy/clauses, React response guard, legacy redirect, desktop/mobile layout.');
  console.log('Screenshots and verification record: .qa/');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
