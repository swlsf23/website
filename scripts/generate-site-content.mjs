#!/usr/bin/env node
/**
 * Reads content/site/*.md (English) and content/locale/<lang>/*.md (translations)
 * and writes apps/web/src/generated/sitePages.ts for static bundling.
 * Run via npm predev/prebuild in apps/web.
 *
 * For resume.md, `<!-- resume-contact -->` is replaced by that locale's contact body:
 * - en: content/site/contact.md (or resume.contact.local.md legacy)
 * - fr: content/locale/fr/contact.md
 * `contact.md` is skipped for sitePages (no bundled contact page from Markdown).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE = join(ROOT, 'content', 'site');
const CONTACT_MD = join(SITE, 'contact.md');
const CONTACT_LEGACY = join(SITE, 'resume.contact.local.md');
const LOCALE_ROOT = join(ROOT, 'content', 'locale');
const OUT_FILE = join(ROOT, 'apps', 'web', 'src', 'generated', 'sitePages.ts');

const CONTACT_MARKER = /<!--\s*resume-contact\s*-->/i;

/**
 * YAML frontmatter between a leading `---` line and the next line that is exactly `---`.
 * Do not use `String#split('---')`: Markdown tables use `| --- |` which would corrupt the body.
 */
function splitYamlFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return null;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      const fm = lines.slice(1, i).join('\n');
      const body = lines.slice(i + 1).join('\n');
      return { fm, body };
    }
  }
  return null;
}

const SKIP = new Set([
  'writing-samples.md',
  'resume.contact.example.md',
  'resume.contact.local.md',
  'contact.md',
]);

function parseMarkdownFile(text, stem) {
  const split = splitYamlFrontmatter(text);
  if (split) {
    const fm = split.fm.trim();
    const body = split.body.trim();
    const meta = {};
    for (const line of fm.split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)$/);
      if (m) {
        let v = m[2].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        meta[m[1]] = v;
      }
    }
    const slug = String(meta.slug || stem);
    const title = String(meta.title || slug);
    return { slug, title, body_md: body };
  }
  const firstLine =
    text
      .trim()
      .split('\n', 1)[0]
      ?.replace(/^#\s*/, '')
      .trim() || stem;
  return { slug: stem, title: firstLine, body_md: text.trim() };
}

/** Contact body merged into resume for `<!-- resume-contact -->` (Markdown body only). */
function contactBodyForLocale(locale) {
  if (locale === 'en') {
    if (existsSync(CONTACT_MD)) {
      const raw = readFileSync(CONTACT_MD, 'utf8');
      return parseMarkdownFile(raw, 'contact').body_md.trim();
    }
    if (existsSync(CONTACT_LEGACY)) {
      return readFileSync(CONTACT_LEGACY, 'utf8').trim();
    }
    return '';
  }
  const path = join(LOCALE_ROOT, locale, 'contact.md');
  if (existsSync(path)) {
    const raw = readFileSync(path, 'utf8');
    return parseMarkdownFile(raw, 'contact').body_md.trim();
  }
  return '';
}

function mergeResumeContact(rawMd, contactBody) {
  if (!CONTACT_MARKER.test(rawMd)) {
    return rawMd;
  }
  if (!contactBody) {
    return rawMd.replace(CONTACT_MARKER, '');
  }
  return rawMd.replace(CONTACT_MARKER, contactBody);
}

function collectPagesForLocale(locale) {
  const siteDir = locale === 'en' ? SITE : join(LOCALE_ROOT, locale);
  if (!existsSync(siteDir)) {
    return [];
  }
  const files = readdirSync(siteDir)
    .filter((f) => f.endsWith('.md') && !SKIP.has(f))
    .sort();
  if (files.length === 0) {
    console.warn(`generate-site-content: no .md files in ${siteDir}`);
  }

  const contactBody = contactBodyForLocale(locale);
  const pages = [];
  for (const f of files) {
    const filePath = join(siteDir, f);
    let raw = readFileSync(filePath, 'utf8');
    const stem = f.replace(/\.md$/i, '');
    if (stem === 'resume') {
      raw = mergeResumeContact(raw, contactBody);
    }
    pages.push(parseMarkdownFile(raw, stem));
  }
  return pages;
}

function discoverLocales() {
  const locales = ['en'];
  if (!existsSync(LOCALE_ROOT)) {
    return locales;
  }
  const extra = readdirSync(LOCALE_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      const home = join(LOCALE_ROOT, name, 'home.md');
      return existsSync(home);
    })
    .sort();
  return [...locales, ...extra];
}

/**
 * Every non-English locale must expose the same page slugs as English (build fails otherwise).
 */
function assertLocaleContentParity(byLocale, locales) {
  const enPages = byLocale.en;
  if (!enPages || enPages.length === 0) {
    console.error('generate-site-content: English has no pages; add Markdown under content/site/');
    process.exit(1);
  }
  const enSlugs = enPages.map((p) => p.slug).sort().join(',');

  for (const loc of locales) {
    if (loc === 'en') continue;
    const pages = byLocale[loc];
    const slugs = (pages || []).map((p) => p.slug).sort().join(',');
    if (slugs !== enSlugs) {
      console.error(
        `generate-site-content: locale "${loc}" must mirror English page slugs.\n` +
          `  English: ${enSlugs}\n` +
          `  ${loc}: ${slugs || '(none)'}`,
      );
      process.exit(1);
    }
  }
}

function main() {
  const locales = discoverLocales();
  const byLocale = {};
  for (const loc of locales) {
    byLocale[loc] = collectPagesForLocale(loc);
    console.log(
      `generate-site-content: locale "${loc}" -> ${byLocale[loc].length} page(s)`,
    );
  }

  assertLocaleContentParity(byLocale, locales);

  const unionType = locales.map((l) => `'${l}'`).join(' | ');
  const json = JSON.stringify(byLocale, null, 0);
  const ts = `export type SitePage = {
  slug: string
  title: string
  body_md: string
}

export type SiteLocale = ${unionType}

export const SITE_LOCALES: readonly SiteLocale[] = [${locales.map((l) => `'${l}'`).join(', ')}] as const

export const sitePagesByLocale: Record<SiteLocale, SitePage[]> = ${json}

/** English pages only; same as \`sitePagesByLocale.en\`. */
export const sitePages: SitePage[] = sitePagesByLocale.en

export function getSitePage(lang: SiteLocale, slug: string): SitePage | undefined {
  return sitePagesByLocale[lang]?.find((p) => p.slug === slug)
}
`;

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, ts, 'utf8');
  console.log(`generate-site-content: wrote -> ${OUT_FILE}`);
}

main();
