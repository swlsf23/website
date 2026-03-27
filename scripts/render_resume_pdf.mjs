#!/usr/bin/env node
/**
 * content/resume.md + scripts/resume-print.css → apps/web/public/resume.pdf
 * (headless Chromium via Playwright). Run: cd apps/web && npm run resume:pdf
 *
 * Optional phone/email: `<!-- resume-contact -->` (under your name in content/resume.md) is replaced
 * by content/resume.contact.local.md (gitignored) or RESUME_PHONE / RESUME_EMAIL.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(join(ROOT, 'apps/web/package.json'));
const { chromium } = require('playwright');
const { marked } = require('marked');

const SRC = join(ROOT, 'content/resume.md');
const CONTACT = join(ROOT, 'content/resume.contact.local.md');
const CSS = join(ROOT, 'scripts/resume-print.css');
const OUT = join(ROOT, 'apps/web/public/resume.pdf');

const CONTACT_MARKER = /<!--\s*resume-contact\s*-->/i;

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
    return readFileSync(CONTACT, 'utf8').trim();
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
  const after = parts.slice(1).join(''); // drop marker(s); rare duplicate markers
  const contactHtml = fragment
    ? `<div class="resume-contact">${marked.parse(fragment)}</div>`
    : '';
  const inner =
    marked.parse(before) + contactHtml + marked.parse(after);
  return insertHrBeforeMajorSections(inner);
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

/** Insert <hr> before each ## heading (major sections, including the first). */
function insertHrBeforeMajorSections(html) {
  return html.replace(/<h2\b/gi, (match) => `<hr>${match}`);
}

async function main() {
  const raw = readFileSync(SRC, 'utf8');
  const mdRaw = stripYamlFrontmatter(raw);
  marked.setOptions({ gfm: true, breaks: false });
  const bodyHtml = buildBodyHtml(mdRaw);
  const cssText = readFileSync(CSS, 'utf8');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${cssText}</style></head><body>${bodyHtml}</body></html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });
  await page.setContent(html, { waitUntil: 'load' });
  mkdirSync(dirname(OUT), { recursive: true });
  await page.pdf({
    path: OUT,
    preferCSSPageSize: true,
    printBackground: true,
  });
  await browser.close();
  console.log(`resume:pdf: wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
