import { marked } from 'marked'
import { getSitePage } from '../generated/sitePages.ts'

export function ProjectsPage() {
  const page = getSitePage('projects')
  const html = page
    ? (marked.parse(page.body_md, { async: false }) as string)
    : ''

  return (
    <section className="projects-page" aria-labelledby="projects-heading">
      {page ? (
        <>
          <header className="page-header">
            <h1 id="projects-heading">{page.title}</h1>
          </header>
          <div
            className="projects-body--md"
            dangerouslySetInnerHTML={{ __html: html }}
          />
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
