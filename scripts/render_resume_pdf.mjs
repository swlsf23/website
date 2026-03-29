#!/usr/bin/env node
/**
 * Markdown + scripts/resume-print.css → PDF (headless Chromium via Playwright).
 *
 * Defaults: content/site/resume.md → apps/web/public/resume.pdf
 *   cd apps/web && npm run resume:pdf
 *
 * Optional phone/email: `<!-- resume-contact -->` in content/site/resume.md or
 * content/site/writing-samples.md is replaced by content/site/contact.md,
 * or if missing, content/site/resume.contact.local.md, or RESUME_PHONE / RESUME_EMAIL.
 *
 * Build writing samples PDF (same styling):
 *   npm run resume:pdf:writing
 * Both in one run (one browser):
 *   npm run resume:pdf:all
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(join(ROOT, 'apps/web/package.json'));
const { chromium } = require('playwright');
const { marked } = require('marked');

const DEFAULT_JOBS = [
  {
    src: join(ROOT, 'content/site/resume.md'),
    out: join(ROOT, 'apps/web/public/resume.pdf'),
  },
  {
    src: join(ROOT, 'content/site/writing-samples.md'),
    out: join(ROOT, 'apps/web/public/writing-samples.pdf'),
  },
];

const CONTACT = join(ROOT, 'content/site/contact.md');
const CONTACT_LEGACY = join(ROOT, 'content/site/resume.contact.local.md');
const CSS = join(ROOT, 'scripts/resume-print.css');

const CONTACT_MARKER = /<!--\s*resume-contact\s*-->/i;

const INTER_SUBSET_CSS = [
  'latin-400.css',
  'latin-400-italic.css',
  'latin-600.css',
  'latin-600-italic.css',
  'latin-700.css',
  'latin-700-italic.css',
  'latin-ext-400.css',
  'latin-ext-400-italic.css',
  'latin-ext-600.css',
  'latin-ext-600-italic.css',
  'latin-ext-700.css',
  'latin-ext-700-italic.css',
];

function interFontFaceCssForPdf() {
  const interRoot = dirname(require.resolve('@fontsource/inter/package.json'));
  const filesBaseUrl = pathToFileURL(join(interRoot, 'files')).href + '/';
  return INTER_SUBSET_CSS.map((name) => {
    const abs = join(interRoot, name);
    const raw = readFileSync(abs, 'utf8');
    return raw.replace(/\.\/files\//g, filesBaseUrl);
  }).join('\n');
}

function resolveUserPath(p) {
  if (!p) return p;
  return isAbsolute(p) ? p : resolve(process.cwd(), p);
}

function parseJobs(argv) {
  const args = argv.slice(2);
  if (args.includes('--all')) {
    return DEFAULT_JOBS;
  }
  let input = join(ROOT, 'content/site/resume.md');
  let output = join(ROOT, 'apps/web/public/resume.pdf');
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--input' || a === '-i') {
      input = resolveUserPath(args[++i]);
    } else if (a === '--output' || a === '-o') {
      output = resolveUserPath(args[++i]);
    }
  }
  return [{ src: input, out: output }];
}

function stripYamlFrontmatter(text) {
  if (!text.startsWith('---')) {
    return text.trim();
  }
  const parts = text.split('---', 3);
  if (parts.length >= 3) {
    return parts[2].trim();
  }
  return text.trim();
}

function contactMarkdown() {
  const phone = process.env.RESUME_PHONE?.trim();
  const email = process.env.RESUME_EMAIL?.trim();
  if (phone || email) {
    const parts = [];
    if (phone) parts.push(phone);
    if (email) parts.push(email);
    return parts.join(' · ');
  }
  if (existsSync(CONTACT)) {
    return stripYamlFrontmatter(readFileSync(CONTACT, 'utf8'));
  }
  if (existsSync(CONTACT_LEGACY)) {
    return readFileSync(CONTACT_LEGACY, 'utf8').trim();
  }
  return '';
}

/**
 * Build body HTML: optional contact is wrapped in `.resume-contact` so print CSS
 * can add margin below the block (see resume-print.css).
 */
function buildBodyHtml(mdRaw) {
  if (!CONTACT_MARKER.test(mdRaw)) {
    return insertHrBeforeMajorSections(marked.parse(mdRaw));
  }
  const fragment = contactMarkdown();
  const parts = mdRaw.split(CONTACT_MARKER);
  const before = parts[0] ?? '';
  const after = parts.slice(1).join('');
  const contactHtml = fragment
    ? `<div class="resume-contact">${marked.parse(fragment)}</div>`
    : '';
  const inner =
    marked.parse(before) + contactHtml + marked.parse(after);
  return insertHrBeforeMajorSections(inner);
}



/** Insert <hr> before each ## heading (major sections, including the first). */
function insertHrBeforeMajorSections(html) {
  return html.replace(/<h2\b/gi, (match) => `<hr>${match}`);
}

async function renderPdf(browser, { src, out }) {
  const raw = readFileSync(src, 'utf8');
  const mdRaw = stripYamlFrontmatter(raw);
  marked.setOptions({ gfm: true, breaks: false });
  const bodyHtml = buildBodyHtml(mdRaw);
  const cssText = `${interFontFaceCssForPdf()}\n${readFileSync(CSS, 'utf8')}`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${cssText}</style></head><body>${bodyHtml}</body></html>`;

  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });
  await page.setContent(html, { waitUntil: 'load' });
  // Headless Chromium can rasterize PDF before @font-face files finish loading; Inter then falls back to a system font.
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  mkdirSync(dirname(out), { recursive: true });
  await page.pdf({
    path: out,
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.close();
  console.log(`resume:pdf: wrote ${out}`);
}

async function main() {
  const jobs = parseJobs(process.argv);
  const browser = await chromium.launch();
  try {
    for (const job of jobs) {
      await renderPdf(browser, job);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
