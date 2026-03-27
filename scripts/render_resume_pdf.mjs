#!/usr/bin/env node
/**
 * content/resume.md + scripts/resume-print.css → apps/web/public/resume.pdf
 * (headless Chromium via Playwright). Run: cd apps/web && npm run resume:pdf
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(join(ROOT, 'apps/web/package.json'));
const { chromium } = require('playwright');
const { marked } = require('marked');

const SRC = join(ROOT, 'content/resume.md');
const CSS = join(ROOT, 'scripts/resume-print.css');
const OUT = join(ROOT, 'apps/web/public/resume.pdf');

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
  const md = stripYamlFrontmatter(raw);
  marked.setOptions({ gfm: true, breaks: false });
  const bodyHtml = insertHrBeforeMajorSections(marked.parse(md));
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
