import { marked } from 'marked'
import { useSiteLocale } from '../hooks/useSiteLocale.ts'
import { requireSitePage } from '../utils/requireSitePage.ts'

export function HomePage() {
  const lang = useSiteLocale()
  const home = requireSitePage(lang, 'home')
  const html = marked.parse(home.body_md, { async: false }) as string

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <header className="page-header">
        <h1 id="hero-heading">{home.title}</h1>
      </header>
      <article className="project-card">
        <div
          className="project-card-body hero-lede hero-lede--md"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </section>
  )
}
