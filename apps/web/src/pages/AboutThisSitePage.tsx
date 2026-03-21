export function AboutThisSitePage() {
  return (
    <>
      <header className="page-header">
        <h1>About this site</h1>
        <p className="page-lede">
          A personal portfolio built as a multi-page React app. The plan is a
          TypeScript front end, a Python API, and PostgreSQL for content—this
          page will stay the place for meta notes on how it&apos;s built and
          what&apos;s left to do.
        </p>
      </header>

      <section className="section" aria-labelledby="stack-heading">
        <h2 id="stack-heading">Stack (planned)</h2>
        <ul className="page-list">
          <li>Vite + React + TypeScript for the UI</li>
          <li>FastAPI + Postgres for content and APIs</li>
          <li>Markdown in git for authoring, loaded into the database</li>
        </ul>
      </section>

      <section className="section" aria-labelledby="status-heading">
        <h2 id="status-heading">Status</h2>
        <p>
          Front end only so far—static copy and routing. Backend and database
          integration are next.
        </p>
      </section>
    </>
  )
}
