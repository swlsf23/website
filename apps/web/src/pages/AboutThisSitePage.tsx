export function AboutThisSitePage() {
  return (
    <>
      <header className="page-header">
        <h1>About this site</h1>
        <p className="page-lede">
          A personal portfolio built as a multi-page React app. Site copy lives
          in Markdown under <code>content/site/</code> and is turned into
          bundled data at build time—no database or API at runtime.
        </p>
      </header>

      <section className="section" aria-labelledby="stack-heading">
        <h2 id="stack-heading">Stack</h2>
        <ul className="page-list">
          <li>Vite + React + TypeScript for the UI</li>
          <li>
            Markdown authoring; <code>scripts/generate-site-content.mjs</code>{' '}
            emits TypeScript consumed by the app at build time
          </li>
          <li>Optional PDF pipeline (Playwright) for résumé and writing samples</li>
        </ul>
      </section>

      <section className="section" aria-labelledby="status-heading">
        <h2 id="status-heading">Status</h2>
        <p>
          Static bundle: routing, layout, and build-time content. Deploy the{' '}
          <code>dist/</code> output to static hosting (e.g. S3 + CloudFront).
        </p>
      </section>
    </>
  )
}
