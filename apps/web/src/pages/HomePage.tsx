import { marked } from 'marked'
import { getSitePage } from '../generated/sitePages.ts'

export function HomePage() {
  const home = getSitePage('en', 'home')
  const html = home
    ? (marked.parse(home.body_md, { async: false }) as string)
    : ''

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <h1 id="hero-heading">About me</h1>
      {home ? (
        <article className="project-card">
          <div
            className="project-card-body hero-lede hero-lede--md"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      ) : (
        <p className="hero-lede api-hint" role="status">
          No home page in <code>content/site/home.md</code>. Add it and run{' '}
          <code>npm run dev</code> (content is generated at build time).
        </p>
      )}
    </section>
  )
}
