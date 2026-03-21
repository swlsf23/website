import { useEffect, useState } from 'react'

type PageRow = {
  slug: string
  title: string
  body_md: string
}

const apiBase = import.meta.env.VITE_API_URL ?? ''

export function HomePage() {
  const [pages, setPages] = useState<PageRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${apiBase}/api/pages`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json() as Promise<PageRow[]>
      })
      .then((data) => {
        if (!cancelled) setPages(data)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Request failed')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const home = pages?.find((p) => p.slug === 'home')

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <p className="hero-eyebrow">Portfolio</p>
      <h1 id="hero-heading">Steven Leslie</h1>
      {error !== null && (
        <p className="hero-lede api-hint" role="status">
          API unavailable ({error}). Start the API on port 8000 and run migrations +
          seed, or check the browser network tab.
        </p>
      )}
      {error === null && pages === null && (
        <p className="hero-lede api-hint">Loading content from the API…</p>
      )}
      {error === null && pages !== null && home && (
        <p className="hero-lede">{home.body_md}</p>
      )}
      {error === null && pages !== null && !home && pages.length > 0 && (
        <p className="hero-lede">{pages[0].body_md}</p>
      )}
      {error === null && pages !== null && pages.length === 0 && (
        <p className="hero-lede api-hint">
          No pages in the database yet. Run{' '}
          <code>python scripts/seed_db.py</code> after
          migrations.
        </p>
      )}
    </section>
  )
}
