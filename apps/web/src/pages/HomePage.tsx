import { marked } from 'marked'
import { getSitePage } from '../generated/sitePages.ts'

export function HomePage() {
  const home = getSitePage('home')
  const html = home
    ? (marked.parse(home.body_md, { async: false }) as string)
    : ''

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <p className="hero-eyebrow">Portfolio</p>
      <h1 id="hero-heading">Steven Leslie</h1>
      {home ? (
        <div
          className="hero-lede hero-lede--md"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="hero-lede api-hint" role="status">
          No home page in <code>content/personal/home.md</code>. Add it and run{' '}
          <code>npm run dev</code> (content is generated at build time).
        </p>
      )}
    </section>
  )
}
