import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const dist = path.resolve('dist');
const origin = new URL(process.env.SITE_URL || 'https://letsplay2ya.github.io').origin;
const browserPath = process.env.BROWSER_PATH || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync);
assert.ok(browserPath, 'Set BROWSER_PATH to an installed Chromium browser.');
assert.ok(existsSync(path.join(dist, 'about/index.html')), 'Build the portfolio first.');

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
const browser = await chromium.launch({ executablePath: browserPath, headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 2, serviceWorkers: 'block' });
  // Resolve public URLs within the local build so the PDF keeps its published links.
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(dist, '.' + pathname);
    if (!file.startsWith(dist + path.sep)) return route.abort();
    try {
      const body = await readFile(file);
      await route.fulfill({ body, contentType: types[path.extname(file)] || 'application/octet-stream' });
    } catch {
      await route.fulfill({ status: 404, body: 'Missing local build output' });
    }
  });

  async function visit(route, width, height) {
    await page.setViewportSize({ width, height });
    const response = await page.goto(origin + route);
    assert.ok(response?.ok(), 'Missing page ' + route);
    await page.evaluate(() => document.fonts.ready);
  }

  async function preview(route, width, selector) {
    await visit(route, width, 900);
    const png = await page.locator(selector).screenshot();
    const encoded = await page.evaluate(async base64 => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + base64;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 860;
      canvas.height = 440;
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingQuality = 'high';
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const w = Math.round(image.width * scale);
      const h = Math.round(image.height * scale);
      context.drawImage(image, Math.floor((canvas.width - w) / 2), Math.floor((canvas.height - h) / 2), w, h);
      return canvas.toDataURL('image/webp', 1);
    }, png.toString('base64'));
    assert.ok(encoded.startsWith('data:image/webp;base64,'));
    return Buffer.from(encoded.slice(encoded.indexOf(',') + 1), 'base64');
  }

  const contract = await preview('/projects/koreanre-ai-assistant/', 560, '.rr-comparison');
  const issuance = await preview('/projects/docuon/', 740, '#docuon-issue');
  await visit('/about/', 1150, 900);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const profile = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true, tagged: true });
  assert.equal((profile.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 1, 'The profile must fit on one A4 page.');

  await mkdir('public/assets', { recursive: true });
  await mkdir('public/files', { recursive: true });
  await writeFile('public/assets/contract-comparison.webp', contract);
  await writeFile('public/assets/document-issuance.webp', issuance);
  await writeFile('public/files/seongmin-jeon-profile.pdf', profile);
  console.log('Updated two project previews and the one-page career PDF.');
} finally {
  await browser.close();
}
