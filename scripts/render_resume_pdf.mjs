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
 * French resume (same pipeline; `<!-- resume-contact -->` uses content/locale/fr/contact.md):
 *   (included in `resume:pdf:all`)
 * All default PDFs in one run (one browser): EN resume, each locale resume-*.pdf, writing samples
 *   npm run resume:pdf:all
 */
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(join(ROOT, 'apps/web/package.json'));
const { chromium } = require('playwright');
const { marked } = require('marked');

/** @typedef {{ src: string, out: string, lang?: string }} PdfJob */

function buildDefaultPdfJobs() {
  /** @type {PdfJob[]} */
  const jobs = [
    {
      src: join(ROOT, 'content/site/resume.md'),
      out: join(ROOT, 'apps/web/public/resume.pdf'),
      lang: 'en',
    },
  ];
  const localeRoot = join(ROOT, 'content/locale');
  if (existsSync(localeRoot)) {
    for (const ent of readdirSync(localeRoot, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const loc = ent.name;
      const resumeMd = join(localeRoot, loc, 'resume.md');
      if (existsSync(resumeMd)) {
        jobs.push({
          src: resumeMd,
          out: join(ROOT, 'apps/web/public', `resume-${loc}.pdf`),
          lang: loc,
        });
      }
    }
  }
  jobs.push({
    src: join(ROOT, 'content/site/writing-samples.md'),
    out: join(ROOT, 'apps/web/public/writing-samples.pdf'),
    lang: 'en',
  });
  return jobs;
}

/** @type {PdfJob[]} */
const DEFAULT_JOBS = buildDefaultPdfJobs();

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
  return [{ src: input, out: output, lang: 'en' }];
}

function stripYamlFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return text.trim();
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      return lines.slice(i + 1).join('\n').trim();
    }
  }
  return text.trim();
}

/** Same as web TOC: strip `{#section-id}` from `##` lines so marked/PDF output stays clean. */
function stripExplicitSectionIds(md) {
  return md.replace(
    /^(\s*##\s+.+?)\s*\{#[-a-zA-Z][-a-zA-Z0-9]*\}\s*$/gm,
    '$1',
  );
}

function contactMarkdownFromEnvOrEnFiles() {
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

/** Contact body for `<!-- resume-contact -->`: locale PDF uses `content/locale/<lang>/contact.md` when present. */
function contactMarkdownForLocale(lang) {
  if (lang === 'en') {
    return contactMarkdownFromEnvOrEnFiles();
  }
  const localized = join(ROOT, 'content/locale', lang, 'contact.md');
  if (existsSync(localized)) {
    return stripYamlFrontmatter(readFileSync(localized, 'utf8'));
  }
  return contactMarkdownFromEnvOrEnFiles();
}

/**
 * Build body HTML: optional contact is wrapped in `.resume-contact` so print CSS
 * can add margin below the block (see resume-print.css).
 */
function buildBodyHtml(mdRaw, lang = 'en') {
  const cleaned = stripExplicitSectionIds(mdRaw);
  if (!CONTACT_MARKER.test(cleaned)) {
    return insertHrBeforeMajorSections(marked.parse(cleaned));
  }
  const fragment = contactMarkdownForLocale(lang);
  const parts = cleaned.split(CONTACT_MARKER);
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

async function renderPdf(browser, { src, out, lang = 'en' }) {
  const raw = readFileSync(src, 'utf8');
  const mdRaw = stripYamlFrontmatter(raw);
  marked.setOptions({ gfm: true, breaks: false });
  const bodyHtml = buildBodyHtml(mdRaw, lang);
  const cssText = `${interFontFaceCssForPdf()}\n${readFileSync(CSS, 'utf8')}`;
  const htmlLang = lang === 'en' ? 'en' : lang;
  const html = `<!DOCTYPE html><html lang="${htmlLang}"><head><meta charset="utf-8"><style>${cssText}</style></head><body>${bodyHtml}</body></html>`;

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
