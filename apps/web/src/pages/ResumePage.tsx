export function ResumePage() {
  return (
    <article className="resume-page">
      <div className="resume-page-topbar">
        <div
          className="resume-actions resume-actions--compact"
          aria-label="Resume downloads"
        >
          <a className="btn btn-primary" href="/resume.pdf" download>
            Resume (PDF)
          </a>
          <a className="btn btn-ghost" href="/resume.md">
            Machine-readable
          </a>
        </div>
      </div>

      <header className="page-header page-header--resume">
        <h1>Resume</h1>
        <p className="page-lede">
          Replace this page with your CV sections—experience, education, and
          skills. PDF and machine-readable downloads are above; keep files in{' '}
          <code>public/</code> in sync.
        </p>
      </header>

      <section className="section" aria-labelledby="experience-heading">
        <h2 id="experience-heading">Experience</h2>
        <p>Placeholder. Add roles, dates, and impact bullets.</p>
      </section>

      <section className="section" aria-labelledby="education-heading">
        <h2 id="education-heading">Education</h2>
        <p>Placeholder.</p>
      </section>

      <section
        className="section section-contact"
        aria-labelledby="contact-heading"
      >
        <h2 id="contact-heading">Contact</h2>
        <p>
          <a href="mailto:you@example.com">you@example.com</a>
          {' · '}
          <a
            href="https://www.linkedin.com/in/sleslie23/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          {' · '}
          <a href="https://github.com/" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
      </section>
    </article>
  )
}
