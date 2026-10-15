import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import GithubSlugger from 'github-slugger';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || path.join(root, '..', 'GitHubBlog'));
const postsDirectory = path.join(root, 'src/content/posts');
const assetsDirectory = path.join(root, 'public/legacy-assets');
const routesFile = path.join(root, 'src/data/legacy-routes.json');
const markerPattern = /^<!-- hexo-import:v1 sha256=([a-f0-9]{64}) -->\r?\n/m;
const virtualOrigin = 'https://hexo-import.invalid';
const notes = [];
const embeddedPages = new Map();
const sha256 = value => createHash('sha256').update(value).digest('hex');
const slash = value => value.split(path.sep).join('/');
const compact = value => value.replace(/\s+/g, ' ').trim();
const escapeAttribute = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => !entry.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

function writeText(filename, value) {
  mkdirSync(path.dirname(filename), { recursive: true });
  writeFileSync(filename, value, 'utf8');
}

function sourceFileFor(url) {
  const pathname = decodeURIComponent(url.pathname);
  const filename = path.resolve(source, '.' + pathname);
  const relative = path.relative(source, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Source path escapes the blog: ' + pathname);
  return { filename, relative: slash(relative) };
}

function localUrl(raw, legacyUrl) {
  if (!raw || raw.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(raw) || raw.startsWith('//')) return null;
  return new URL(raw, virtualOrigin + legacyUrl);
}

function slugFor(relative) {
  return 'legacy-' + relative.replace(/\/index\.html$/, '').split('/').slice(3).join('-')
    .normalize('NFKD').toLowerCase().replaceAll('&', '-and-').replace(/[^a-z\d\uac00-\ud7a3]+/g, '-').replace(/^-|-$/g, '');
}

if (!existsSync(source) || !statSync(source).isDirectory()) throw new Error('Hexo HTML directory not found: ' + source);
if (root === source || root.startsWith(source + path.sep)) throw new Error('The destination must be separate from the original blog.');

const files = walk(source);
const articles = files.filter(filename => /^\d{4}\/\d{2}\/\d{2}\/.+\/index\.html$/.test(slash(path.relative(source, filename))))
  .map(filename => {
    const relative = slash(path.relative(source, filename));
    const $ = load(readFileSync(filename, 'utf8'));
    const article = $('article.post-wrap').filter((_, element) => $(element).find('.post-content').length > 0).first();
    if (!article.length) return null;
    const legacyUrl = encodeURI('/' + relative.replace(/index\.html$/, ''));
    const slug = slugFor(relative);
    const title = compact(article.find('.post-title').first().text()) || path.posix.basename(path.posix.dirname(relative));
    if (!compact(article.find('.post-title').first().text())) notes.push(`${relative}: empty title recovered from original path (${title}).`);
    return { relative, $, article, legacyUrl, slug, title, date: relative.slice(0, 10).replaceAll('/', '-') };
  }).filter(Boolean);

if (!articles.length) throw new Error('No dated Hexo article pages were found. No output was changed.');
const slugs = new Set();
for (const article of articles) {
  if (slugs.has(article.slug)) article.slug += '-' + sha256(article.relative).slice(0, 8);
  slugs.add(article.slug);
}
const routeMap = new Map(articles.map(article => [decodeURI(article.legacyUrl), `/writing/${article.slug}/`]));
const routes = articles.map(article => ({ from: article.legacyUrl, to: `/writing/${article.slug}/` }));
const assetFiles = new Map(files.filter(filename => /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(filename))
  .map(filename => [slash(path.relative(source, filename)), filename]));
let codeBlockCount = 0;
let localImageCount = 0;
let embedCount = 0;

function rewriteLink(raw, legacyUrl) {
  const url = localUrl(raw, legacyUrl);
  if (!url) return raw;
  const route = decodeURI(url.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/'));
  if (routeMap.has(route)) return routeMap.get(route) + url.search + url.hash;
  const asset = sourceFileFor(url);
  if (assetFiles.has(asset.relative)) return '/legacy-assets/' + encodeURI(asset.relative) + url.search + url.hash;
  if (url.pathname === '/') return '/';
  if (/^\/(?:archives|categories|category|tags|tag)(?:\/|$)/.test(url.pathname)) return '/writing/';
  notes.push(`${legacyUrl}: unresolved internal link preserved: ${raw}`);
  return raw;
}

function convert(article) {
  const { $, title, legacyUrl } = article;
  // Import the article body exactly once, excluding theme navigation and TOC.
  const body = article.article.find('.post-content').first().clone();
  const titleAnchors = [];
  body.find('script, style, .headerlink').remove();
  body.find('h1').each((_, element) => {
    const heading = $(element);
    if (compact(heading.text()) === title) {
      const id = heading.attr('id');
      if (id) titleAnchors.push(`<span id="${escapeAttribute(id)}"></span>`);
      heading.remove();
    }
  });

  body.find('figure.highlight').each((_, element) => {
    const figure = $(element);
    const pre = figure.find('td.code pre').first();
    if (!pre.length) return;
    const lineElements = pre.children('.line');
    const plain = pre.clone();
    plain.find('br').replaceWith('\n');
    const code = lineElements.length ? lineElements.map((_, line) => $(line).text()).get().join('\n') : plain.text();
    const language = (figure.attr('class') || '').split(/\s+/).find(value => value !== 'highlight') || 'text';
    const codeElement = $('<code></code>').text(code).addClass('language-' + language);
    figure.replaceWith($('<pre></pre>').append(codeElement));
  });

  const originalIds = body.find('[id]').map((_, element) => $(element).attr('id')).get();
  const anchorKey = value => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  body.find('a[href]').each((_, element) => {
    const link = $(element);
    let href = rewriteLink(link.attr('href'), legacyUrl);
    if (href.startsWith('#') && href.length > 1) {
      const requestedId = decodeURIComponent(href.slice(1));
      if (!originalIds.includes(requestedId)) {
        const candidates = originalIds.filter(id => anchorKey(id) === anchorKey(requestedId));
        if (candidates.length === 1) {
          href = '#' + encodeURIComponent(candidates[0]);
          notes.push(`${article.relative}: repaired original heading link ${requestedId} -> ${candidates[0]}.`);
        }
      }
    }
    link.attr('href', href);
  });
  body.find('img[src]').each((_, element) => {
    const image = $(element);
    const raw = image.attr('src');
    const url = localUrl(raw, legacyUrl);
    if (!url) return;
    const asset = sourceFileFor(url);
    if (!assetFiles.has(asset.relative)) {
      notes.push(`${legacyUrl}: local image file is missing: ${raw}`);
      return;
    }
    image.attr('src', '/legacy-assets/' + encodeURI(asset.relative));
    localImageCount += 1;
  });
  body.find('iframe').each((index, element) => {
    const frame = $(element);
    const frameTitle = frame.attr('title') || (title === 'plotly_01' ? 'Plotly 그래프' : title);
    const originalSrc = frame.attr('src');
    if (!originalSrc || !/^https:\/\//.test(originalSrc)) {
      frame.replaceWith($('<pre></pre>').append($('<code></code>').addClass('language-html').text($.html(frame))));
      notes.push(`${article.relative}: non-working example iframe (${originalSrc}) preserved as HTML code.`);
      return;
    }
    const embedPath = `embeds/${article.slug}-${index + 1}.html`;
    const embedHtml = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeAttribute(frameTitle) + '</title><style>html,body{margin:0;background:#fff}iframe{display:block;width:100%;height:525px;border:0}p{font:14px system-ui,sans-serif;padding:0 12px}a{color:#175f46}</style></head><body><iframe src="' + escapeAttribute(originalSrc) + '" title="' + escapeAttribute(frameTitle) + '" loading="lazy" height="525" width="100%"></iframe><p><a href="' + escapeAttribute(originalSrc) + '" target="_blank" rel="noopener noreferrer">Plotly 원본 그래프 열기</a></p></body></html>\n';
    embeddedPages.set(embedPath, embedHtml);
    frame.attr('src', '/legacy-assets/' + embedPath).attr('title', frameTitle).attr('loading', 'lazy').attr('height', '585');
    embedCount += 1;
  });

  const description = compact(body.find('p').map((_, element) => $(element).text()).get().find(text => compact(text)) || '')
    .slice(0, 160) || `${title} — 기존 Hexo 블로그에서 가져온 기록입니다.`;
  const tags = [...new Set(article.article.find('.post-tags .tag a').map((_, element) => compact($(element).text()).replace(/^#\s*/, '')).get())];
  const category = article.article.find('.post-category a').map((_, element) => compact($(element).text())).get().join(' / ') || '기록';
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*', strongDelimiter: '**' });
  const headingSlugger = new GithubSlugger();
  // The article layout owns h1; preserve relative hierarchy in imported bodies.
  const headingOffset = body.find('h1').length ? 1 : 0;
  turndown.keep(['iframe', 'table']);
  turndown.addRule('retained-anchors', {
    filter: node => node.nodeName === 'SPAN' && Boolean(node.getAttribute('id')),
    replacement(_content, node) { return `\n\n<span id="${escapeAttribute(node.getAttribute('id'))}"></span>\n\n`; },
  });
  turndown.addRule('code-blocks', {
    filter: 'pre',
    replacement(_content, node) {
      const code = node.querySelector('code') || node;
      const language = (code.getAttribute('class') || '').match(/language-([^\s]+)/)?.[1] || 'text';
      const text = code.textContent.replace(/\n$/, '');
      const runs = text.match(/`+/g) || [];
      const fence = '`'.repeat(Math.max(3, ...runs.map(value => value.length + 1)));
      codeBlockCount += 1;
      return `\n\n${fence}${language}\n${text}\n${fence}\n\n`;
    },
  });
  turndown.addRule('heading-anchors', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement(content, node) {
      const id = node.getAttribute('id');
      // Keep Hexo anchors for old in-article links, while still emitting Markdown headings.
      const generatedId = headingSlugger.slug(node.textContent);
      const anchor = id && id !== generatedId ? `<span id="${escapeAttribute(id)}"></span>\n\n` : '';
      const level = Math.min(6, Number(node.nodeName.slice(1)) + headingOffset);
      return `\n\n${anchor}${'#'.repeat(level)} ${content}\n\n`;
    },
  });
  let markdown = [...titleAnchors, turndown.turndown(body.html()).trim()].join('\n\n');
  // The original Oracle post contains a literal, malformed image marker, not an img element.
  const malformedImagePattern = /!\\?\(\.\.\/images\/install\\?_01\.png\\?\)/g;
  if (assetFiles.has('images/install_01.png') && malformedImagePattern.test(markdown)) {
    markdown = markdown.replace(malformedImagePattern, '![오라클 설치 파일 다운로드 화면](/legacy-assets/images/install_01.png)');
    notes.push(`${article.relative}: repaired malformed original image marker for images/install_01.png.`);
    localImageCount += 1;
  }
  const data = { title, description, date: article.date, tags, category, origin: 'hexo', legacyUrl };
  const frontmatter = '---\n' + Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n') + '\n---\n';
  const unmarked = frontmatter + '\n' + markdown + '\n';
  return frontmatter + `<!-- hexo-import:v1 sha256=${sha256(unmarked)} -->\n` + '\n' + markdown + '\n';
}

const outputs = articles.map(article => ({ article, filename: path.join(postsDirectory, article.slug + '.md'), content: convert(article) }));
const unchangedOrGenerated = output => {
  if (!existsSync(output.filename)) return true;
  const existing = readFileSync(output.filename, 'utf8');
  const marker = existing.match(markerPattern);
  if (!marker) throw new Error('Refusing to overwrite a manually created post: ' + output.filename);
  if (sha256(existing.replace(markerPattern, '')) !== marker[1]) {
    notes.push(`${path.basename(output.filename)}: edited since import; preserved without overwriting.`);
    return false;
  }
  return true;
};
// Validate all destinations before writing, so a filename collision cannot partially replace posts.
const writableOutputs = outputs.filter(unchangedOrGenerated);
for (const [relative, filename] of assetFiles) {
  const destination = path.join(assetsDirectory, relative);
  if (existsSync(destination) && sha256(readFileSync(destination)) !== sha256(readFileSync(filename))) {
    throw new Error('Asset differs from the source; refusing to overwrite it: ' + destination);
  }
}
for (const [relative, html] of embeddedPages) {
  const destination = path.join(assetsDirectory, relative);
  if (existsSync(destination) && readFileSync(destination, 'utf8') !== html) throw new Error('Refusing to overwrite a changed embed: ' + destination);
}
for (const output of writableOutputs) writeText(output.filename, output.content);
for (const [relative, filename] of assetFiles) {
  const destination = path.join(assetsDirectory, relative);
  mkdirSync(path.dirname(destination), { recursive: true });
  if (!existsSync(destination)) copyFileSync(filename, destination);
}
for (const [relative, html] of embeddedPages) writeText(path.join(assetsDirectory, relative), html);
writeText(routesFile, JSON.stringify(routes, null, 2) + '\n');
console.log(JSON.stringify({ articles: articles.length, written: writableOutputs.length, copiedAssetFiles: assetFiles.size, localImageReferences: localImageCount, codeBlocks: codeBlockCount, embeddedFrames: embedCount, routes: routes.length, notes }, null, 2));
