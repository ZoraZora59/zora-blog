#!/usr/bin/env node
/**
 * 构建后预渲染脚本（SEO 兼容层）
 *
 * 做什么：
 *   1. 读取 dist/index.html 作为模板
 *   2. 从后端 API 拉取文章、专题列表（支持 PRERENDER_API_BASE 环境变量）
 *   3. 为 /, /about, /topics, /topics/<slug>, /articles/<slug> 生成物理 HTML 快照，
 *      注入 <title>、<meta name="description">、Open Graph、Twitter Card、JSON-LD
 *      以及一段 <noscript> SEO 正文，供不执行 JS 的爬虫（百度、一部分微信）索引
 *   4. 生成 dist/sitemap.xml 与 dist/robots.txt
 *
 * 为什么这样做：
 *   完整 SSR/SSG 对 6 篇文章的博客属于过度工程；静态 meta + JSON-LD 已覆盖 90% SEO 收益，
 *   nginx try_files 会让物理快照优先命中，React 运行时再正常 hydrate，不改变 CSR 架构。
 *
 * 如何运行：
 *   npm run build:frontend      # vite build 完后自动跑（见 package.json）
 *   或独立执行：
 *   PRERENDER_API_BASE=https://www.zorazora.cn node scripts/prerender.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const SITE_URL = (process.env.SITE_URL || 'https://www.zorazora.cn').replace(/\/$/, '');
const API_BASE = (process.env.PRERENDER_API_BASE || SITE_URL).replace(/\/$/, '');
const SITE_NAME = 'Zora Blog';
const SITE_DESCRIPTION = '程序员 / 户外爱好者的技术与生活记录，聚焦 AI 研发实践与野外露营。';
const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.ico`;

const escapeHtml = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj)
    .replaceAll('</', '<\\/')}</script>`;

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'zora-prerender/1.0' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function fetchAll() {
  const articles = [];
  let page = 1;
  while (true) {
    const { data } = await fetchJson(`${API_BASE}/api/articles?status=published&limit=50&page=${page}`);
    articles.push(...(data?.items ?? []));
    if (page >= (data?.pagination?.totalPages ?? 1)) break;
    page += 1;
  }
  const topicsRes = await fetchJson(`${API_BASE}/api/topics?limit=100`).catch(() => ({ data: [] }));
  const topics = Array.isArray(topicsRes?.data) ? topicsRes.data : (topicsRes?.data?.items ?? []);
  return { articles, topics };
}

/**
 * API 不可达时仍产出最小化 sitemap / robots / 基础首页 meta，不让前端构建整段失败。
 * 典型场景：首次部署服务器 backend 还没起，或者构建环境无外网。
 */
async function degradedFallback(template, reason) {
  console.warn(`[prerender] 降级模式：${reason}；仅注入首页 meta + 生成最小 sitemap/robots`);
  const homeHtml = renderPage(template, {
    title: `${SITE_NAME} — 程序员 / 户外爱好者`,
    description: SITE_DESCRIPTION,
    canonical: `${SITE_URL}/`,
    ogType: 'website',
    jsonLdObj: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
  });
  await fs.writeFile(path.join(DIST, 'index.html'), homeHtml, 'utf8');
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap([], []), 'utf8');
  await fs.writeFile(path.join(DIST, 'robots.txt'), buildRobots(), 'utf8');
}

/**
 * 向 index.html 注入 head 元数据；同时把一段只面向爬虫的 SEO 正文放进 <noscript>。
 * 运行时 React 不会触碰 <noscript>，对人类用户无副作用。
 */
function renderPage(template, { title, description, canonical, ogType = 'website', ogImage, jsonLdObj, noscriptBody }) {
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage || DEFAULT_OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage || DEFAULT_OG_IMAGE)}" />`,
    jsonLdObj ? jsonLd(jsonLdObj) : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  // 模板只有 <title>Zora Blog</title>；替换掉它 + 在它前面插入 meta 块
  let html = template.replace(
    /<title>[^<]*<\/title>/,
    `${head}`,
  );

  if (noscriptBody) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n    <noscript>${noscriptBody}</noscript>`,
    );
  }
  return html;
}

function truncate(text, max = 160) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + '…';
}

function stripMarkdown(md) {
  return String(md ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-*+>]\s*/gm, '')
    .replace(/\*\*|__|\*|_/g, '');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writePage(relativeRoute, html) {
  const clean = relativeRoute.replace(/^\/+|\/+$/g, '');
  const dir = clean === '' ? DIST : path.join(DIST, clean);
  await ensureDir(dir);
  const out = path.join(dir, 'index.html');
  await fs.writeFile(out, html, 'utf8');
  return path.relative(DIST, out);
}

function articleJsonLd(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: truncate(article.excerpt || stripMarkdown(article.content), 200),
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: article.author
      ? { '@type': 'Person', name: article.author.displayName || article.author.username }
      : undefined,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
    keywords: (article.tags || []).map((t) => t.name).join(','),
    articleSection: article.category?.name,
  };
}

function articleNoscript(article) {
  const body = truncate(stripMarkdown(article.content), 1200);
  return `<article><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(body)}</p><p><a href="${SITE_URL}/articles/${escapeHtml(article.slug)}">阅读完整文章</a></p></article>`;
}

function buildSitemap(articles, topics) {
  const now = new Date().toISOString();
  const entries = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: now },
    { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.6', lastmod: now },
    { loc: `${SITE_URL}/topics`, changefreq: 'weekly', priority: '0.7', lastmod: now },
    ...topics.map((t) => ({
      loc: `${SITE_URL}/topics/${t.slug}`,
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: t.updatedAt || now,
    })),
    ...articles.map((a) => ({
      loc: `${SITE_URL}/articles/${a.slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: a.updatedAt || a.publishedAt || now,
    })),
  ];
  const body = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildRobots() {
  return [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /login',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

async function main() {
  const templatePath = path.join(DIST, 'index.html');
  const template = await fs.readFile(templatePath, 'utf8').catch(() => null);
  if (!template) {
    console.error('[prerender] dist/index.html 不存在，请先执行 vite build');
    process.exit(1);
  }

  console.log(`[prerender] 拉取数据：${API_BASE}`);
  let articles = [];
  let topics = [];
  try {
    ({ articles, topics } = await fetchAll());
  } catch (err) {
    await degradedFallback(template, err?.message || String(err));
    return;
  }
  console.log(`[prerender] 已取得 ${articles.length} 篇文章、${topics.length} 个专题`);

  // 首页
  const homeHtml = renderPage(template, {
    title: `${SITE_NAME} — 程序员 / 户外爱好者`,
    description: SITE_DESCRIPTION,
    canonical: `${SITE_URL}/`,
    ogType: 'website',
    jsonLdObj: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    noscriptBody: `<h1>${escapeHtml(SITE_NAME)}</h1><p>${escapeHtml(SITE_DESCRIPTION)}</p><ul>${articles
      .slice(0, 20)
      .map(
        (a) =>
          `<li><a href="${SITE_URL}/articles/${escapeHtml(a.slug)}">${escapeHtml(a.title)}</a></li>`,
      )
      .join('')}</ul>`,
  });
  await fs.writeFile(templatePath, homeHtml, 'utf8');

  // 静态页面
  const aboutHtml = renderPage(template, {
    title: `关于 | ${SITE_NAME}`,
    description: `${SITE_NAME} 的作者介绍与联系方式。`,
    canonical: `${SITE_URL}/about`,
  });
  await writePage('/about', aboutHtml);

  const topicsIndexHtml = renderPage(template, {
    title: `专题 | ${SITE_NAME}`,
    description: '按系列主题归档的文章集合。',
    canonical: `${SITE_URL}/topics`,
    noscriptBody: `<h1>所有专题</h1><ul>${topics
      .map(
        (t) =>
          `<li><a href="${SITE_URL}/topics/${escapeHtml(t.slug)}">${escapeHtml(t.title)}</a>${t.description ? `：${escapeHtml(t.description)}` : ''}</li>`,
      )
      .join('')}</ul>`,
  });
  await writePage('/topics', topicsIndexHtml);

  // 专题详情
  for (const t of topics) {
    const html = renderPage(template, {
      title: `${t.title} | ${SITE_NAME}`,
      description: truncate(t.description || `${t.title} 专题下的所有文章。`, 160),
      canonical: `${SITE_URL}/topics/${t.slug}`,
      ogType: 'website',
      ogImage: t.coverImage || undefined,
    });
    await writePage(`/topics/${t.slug}`, html);
  }

  // 文章详情
  for (const a of articles) {
    const description = truncate(a.excerpt || stripMarkdown(a.content), 160);
    const html = renderPage(template, {
      title: `${a.title} | ${SITE_NAME}`,
      description,
      canonical: `${SITE_URL}/articles/${a.slug}`,
      ogType: 'article',
      ogImage: a.coverImage || undefined,
      jsonLdObj: articleJsonLd(a),
      noscriptBody: articleNoscript(a),
    });
    await writePage(`/articles/${a.slug}`, html);
  }

  // sitemap / robots
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(articles, topics), 'utf8');
  await fs.writeFile(path.join(DIST, 'robots.txt'), buildRobots(), 'utf8');

  const summary = {
    home: 1,
    about: 1,
    topics: 1 + topics.length,
    articles: articles.length,
    sitemap: true,
    robots: true,
  };
  console.log('[prerender] 完成：', summary);
}

main().catch((err) => {
  console.error('[prerender] 失败：', err);
  process.exit(1);
});
