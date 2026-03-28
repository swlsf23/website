import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import { getSitePage } from '../generated/sitePages.ts'
import { splitResumeMarkdown } from '../utils/splitResumeMarkdown.ts'

const PREAMBLE_ID = 'resume-preamble'

export function ResumePage() {
  const resume = getSitePage('resume')
  const sections = resume ? splitResumeMarkdown(resume.body_md) : []

  const sectionEntries = useMemo(
    () => sections.filter((s) => s.kind === 'section'),
    [sections],
  )

  const preambleSection = useMemo(
    () => sections.find((s) => s.kind === 'preamble'),
    [sections],
  )

  const tocItems = useMemo(
    () =>
      sectionEntries.map((sec) => ({
        id: sec.id,
        label: sec.title,
      })),
    [sectionEntries],
  )

  const firstSectionId = sectionEntries[0]?.id ?? ''

  const [activeSectionId, setActiveSectionId] = useState(firstSectionId)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const ids = new Set(sectionEntries.map((s) => s.id))
    if (hash && ids.has(hash)) {
      setActiveSectionId(hash)
    } else {
      setActiveSectionId(firstSectionId)
    }
  }, [sectionEntries, firstSectionId])

  const activeSection = sectionEntries.find((s) => s.id === activeSectionId)

  return (
    <article className="resume-page">
      {resume ? (
        <div className="resume-page-layout">
          <div className="resume-page-main">
            {preambleSection ? (
              <div
                id={PREAMBLE_ID}
                className="resume-preamble resume-body--md resume-anchor"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(preambleSection.bodyMd, {
                    async: false,
                  }) as string,
                }}
              />
            ) : null}

            <div className="resume-page-single">
              {activeSection
                ? (() => {
                    const html = marked.parse(activeSection.bodyMd, {
                      async: false,
                    }) as string
                    const titleId = `${activeSection.id}-title`
                    return (
                      <article
                        key={activeSection.id}
                        id={activeSection.id}
                        className="resume-card resume-card--section resume-anchor"
                        aria-labelledby={titleId}
                      >
                        <header className="resume-card-header">
                          <h2 id={titleId} className="resume-card-heading">
                            {activeSection.title}
                          </h2>
                        </header>
                        <div
                          className="resume-card-body resume-body--md"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      </article>
                    )
                  })()
                : null}
            </div>
          </div>

          <div className="resume-page-sidebar">
            <nav className="resume-toc" aria-label="Resume sections">
              <ul className="resume-toc-list">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      className={
                        activeSectionId === item.id
                          ? 'resume-toc-link resume-toc-link--active'
                          : 'resume-toc-link'
                      }
                      href={`#${item.id}`}
                      aria-current={
                        activeSectionId === item.id ? 'true' : undefined
                      }
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveSectionId(item.id)
                        window.history.replaceState(null, '', `#${item.id}`)
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="resume-downloads" aria-label="Resume downloads">
              <a
                className="btn btn-primary"
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                PDF
              </a>
              <a
                className="btn btn-ghost"
                href="/resume.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Machine-readable
              </a>
            </div>
          </div>
        </div>
      ) : (
        <p className="api-hint" role="status">
          No resume in <code>content/site/resume.md</code>. Add it and run{' '}
          <code>npm run dev</code> (content is generated at build time).
        </p>
      )}
    </article>
  )
}
