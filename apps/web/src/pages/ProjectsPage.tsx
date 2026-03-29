import { marked } from 'marked'
import { getSitePage } from '../generated/sitePages.ts'

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
  const page = getSitePage('projects')
  const { lede, sections } = page ? splitProjectsBody(page.body_md) : { lede: '', sections: [] }

  const ledeHtml = lede ? (marked.parse(lede, { async: false }) as string) : ''
  const sectionHtml = sections.map(
    (block) => marked.parse(block, { async: false }) as string,
  )

  return (
    <section className="projects-page" aria-labelledby="projects-heading">
      {page ? (
        <>
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
        </>
      ) : (
        <p className="api-hint" role="status">
          No projects page in <code>content/site/projects.md</code>. Add it and run{' '}
          <code>npm run dev</code> (content is generated at build time).
        </p>
      )}
    </section>
  )
}
