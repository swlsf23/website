/**
 * Splits resume markdown on level-2 headings (`## Section`) so each block can be
 * rendered as its own card. The preamble (everything before the first `##`) is
 * kept as a single block (typically `# Name`, tagline, etc.).
 */
export type ResumeSection =
  | { kind: 'preamble'; bodyMd: string }
  | { kind: 'section'; id: string; title: string; bodyMd: string }

function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return s || 'section'
}

export function splitResumeMarkdown(bodyMd: string): ResumeSection[] {
  const parts = bodyMd.trim().split(/^## /gm)
  const out: ResumeSection[] = []

  const preamble = parts[0]?.trim()
  if (preamble) {
    out.push({ kind: 'preamble', bodyMd: preamble })
  }

  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i].trim()
    const nl = chunk.indexOf('\n')
    const title = (nl === -1 ? chunk : chunk.slice(0, nl)).trim()
    const body = nl === -1 ? '' : chunk.slice(nl + 1).trim()
    out.push({
      kind: 'section',
      id: `section-${slugify(title)}`,
      title,
      bodyMd: body,
    })
  }

  return out
}
