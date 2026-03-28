#!/usr/bin/env node
/**
 * Reads content/personal/*.md and writes apps/web/src/generated/sitePages.ts
 * for static bundling (no runtime API). Run via npm predev/prebuild in apps/web.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PERSONAL = join(ROOT, 'content', 'personal');
const OUT_FILE = join(ROOT, 'apps', 'web', 'src', 'generated', 'sitePages.ts');

function parseMarkdownFile(text, stem) {
  if (text.startsWith('---')) {
    const parts = text.split('---', 3);
    if (parts.length >= 3) {
      const fm = parts[1].trim();
      const body = parts[2].trim();
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
  }
  const firstLine =
    text
      .trim()
      .split('\n', 1)[0]
      ?.replace(/^#\s*/, '')
      .trim() || stem;
  return { slug: stem, title: firstLine, body_md: text.trim() };
}

function main() {
  const skip = new Set([
    'resume.md',
    'writing-samples.md',
    'resume.contact.example.md',
    'resume.contact.local.md',
  ])
  const files = readdirSync(PERSONAL)
    .filter((f) => f.endsWith('.md') && !skip.has(f))
    .sort();
  if (files.length === 0) {
    console.warn(`generate-site-content: no .md files in ${PERSONAL}`);
  }

  const pages = [];
  for (const f of files) {
    const path = join(PERSONAL, f);
    const raw = readFileSync(path, 'utf8');
    const stem = f.replace(/\.md$/i, '');
    pages.push(parseMarkdownFile(raw, stem));
  }

  const json = JSON.stringify(pages, null, 0);
  const ts = `export type SitePage = {
  slug: string
  title: string
  body_md: string
}

export const sitePages: SitePage[] = ${json}

export function getSitePage(slug: string): SitePage | undefined {
  return sitePages.find((p) => p.slug === slug)
}
`;

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, ts, 'utf8');
  console.log(`generate-site-content: wrote ${pages.length} page(s) -> ${OUT_FILE}`);
}

main();
