export function ProjectsPage() {
  return (
    <section className="projects-page" aria-labelledby="projects-heading">
      <header className="page-header">
        <h1 id="projects-heading">Projects</h1>
        <p className="page-lede">
          A few things I've built or maintain: live sites and source when
          they're public.
        </p>
      </header>
      <ul className="project-list">
        <li>
          <article className="project-card">
            <h2 className="project-card-title">Personal website</h2>
            <p className="project-card-desc">
              Portfolio and résumé site: React, TypeScript, Vite, and
              Markdown-driven content.
            </p>
            <div className="project-card-actions">
              <a href="/">View site</a>
              <a
                href="https://github.com/swlsf23/website"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </article>
        </li>
        <li>
          <article className="project-card project-card--soon">
            <h2 className="project-card-title">More to come</h2>
            <p className="project-card-desc">
              Additional projects will show up here as I ship them.
            </p>
          </article>
        </li>
      </ul>
    </section>
  )
}
