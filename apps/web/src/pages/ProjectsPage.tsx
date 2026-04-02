import { marked } from 'marked'
import { useSiteLocale } from '../hooks/useSiteLocale.ts'
import { requireSitePage } from '../utils/requireSitePage.ts'

marked.use({ gfm: true })

/** Split markdown into intro text and ## sections (one card per section). */
function splitProjectsBody(body: string): { lede: string; sections: string[] } {
  const raw = body.trim()
  if (!raw) return { lede: '', sections: [] }
  const idx = raw.search(/\n##\s/)
  if (idx === -1) {
    return { lede: raw, sections: [] }
  }
  const lede = raw.slice(0, idx).trim()
  const sectionsRest = raw.slice(idx + 1).trim()
  const sections = sectionsRest
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean)
  return { lede, sections }
}

export function ProjectsPage() {
  const lang = useSiteLocale()
  const page = requireSitePage(lang, 'projects')
  const { lede, sections } = splitProjectsBody(page.body_md)

  const ledeHtml = lede ? (marked.parse(lede, { async: false }) as string) : ''
  const sectionHtml = sections.map(
    (block) => marked.parse(block, { async: false }) as string,
  )

  return (
    <section className="projects-page" aria-labelledby="projects-heading">
      <header className="page-header">
        <h1 id="projects-heading">{page.title}</h1>
      </header>
      <div className="projects-body--md">
        {ledeHtml ? (
          <div
            className="projects-lede"
            dangerouslySetInnerHTML={{ __html: ledeHtml }}
          />
        ) : null}
        {sectionHtml.map((html, i) => (
          <article key={i} className="project-card">
            <div
              className="project-card-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>
        ))}
      </div>
    </section>
  )
}
