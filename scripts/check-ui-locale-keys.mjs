#!/usr/bin/env node
/**
 * Ensures every `apps/web/src/locales/*.json` (except a future allowlist) has the
 * same keys as `en.json`. Fails the build on mismatch or missing files.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIR = join(ROOT, 'apps', 'web', 'src', 'locales');

function keys(obj) {
  return Object.keys(obj).sort();
}

function main() {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'package.json');
  if (files.length === 0) {
    console.error('check-ui-locale-keys: no JSON files in', DIR);
    process.exit(1);
  }
  const baseName = 'en.json';
  if (!files.includes(baseName)) {
    console.error(`check-ui-locale-keys: missing ${baseName} (canonical locale)`);
    process.exit(1);
  }
  const basePath = join(DIR, baseName);
  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  const baseKeys = keys(base);

  let failed = false;
  for (const f of files) {
    if (f === baseName) continue;
    const path = join(DIR, f);
    const other = JSON.parse(readFileSync(path, 'utf8'));
    const otherKeys = keys(other);
    const a = baseKeys.join('\n');
    const b = otherKeys.join('\n');
    if (a !== b) {
      failed = true;
      console.error(`check-ui-locale-keys: key mismatch between ${baseName} and ${f}`);
      const onlyBase = baseKeys.filter((k) => !otherKeys.includes(k));
      const onlyOther = otherKeys.filter((k) => !baseKeys.includes(k));
      if (onlyBase.length) console.error(`  only in ${baseName}:`, onlyBase.join(', ') || '(none)');
      if (onlyOther.length) console.error(`  only in ${f}:`, onlyOther.join(', ') || '(none)');
    }
  }

  if (failed) process.exit(1);
  console.log(`check-ui-locale-keys: OK (${files.length} file(s), keys match ${baseName})`);
}

main();
