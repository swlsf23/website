import { useMemo, useSyncExternalStore } from 'react'
import { marked } from 'marked'
import { useSiteLocale } from '../hooks/useSiteLocale.ts'
import { requireSitePage } from '../utils/requireSitePage.ts'
import {
  splitEducationBody,
  splitExperienceBody,
  splitResumeMarkdown,
} from '../utils/splitResumeMarkdown.ts'

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener('hashchange', onStoreChange)
  return () => window.removeEventListener('hashchange', onStoreChange)
}

function hashSnapshot() {
  return window.location.hash
}

function hashServerSnapshot() {
  return ''
}

export function ResumePage() {
  const lang = useSiteLocale()
  const resume = requireSitePage(lang, 'resume')
  const sections = splitResumeMarkdown(resume.body_md)

  const sectionEntries = useMemo(
    () => sections.filter((s) => s.kind === 'section'),
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

  const hash = useSyncExternalStore(
    subscribeHash,
    hashSnapshot,
    hashServerSnapshot,
  )

  const activeSectionId = useMemo(() => {
    const idFromHash = hash.slice(1)
    const ids = new Set(sectionEntries.map((s) => s.id))
    if (idFromHash && ids.has(idFromHash)) {
      return idFromHash
    }
    return firstSectionId
  }, [hash, sectionEntries, firstSectionId])

  const activeSection = sectionEntries.find((s) => s.id === activeSectionId)

  const experienceSplit = useMemo(() => {
    if (!activeSection || activeSection.id !== 'section-experience') {
      return null
    }
    return splitExperienceBody(activeSection.bodyMd)
  }, [activeSection])

  const educationSplit = useMemo(() => {
    if (!activeSection || activeSection.id !== 'section-education') {
      return null
    }
    return splitEducationBody(activeSection.bodyMd)
  }, [activeSection])

  return (
    <article className="resume-page">
      <div className="resume-page-layout">
          <div className="resume-page-main">
            <div className="resume-page-single">
              {activeSection
                ? (() => {
                    const titleId = `${activeSection.id}-title`

                    if (
                      experienceSplit &&
                      experienceSplit.positions.length > 0
                    ) {
                      const { preamble, positions } = experienceSplit
                      return (
                        <div
                          key={activeSection.id}
                          id={activeSection.id}
                          className="resume-experience-stack resume-anchor"
                          aria-labelledby={titleId}
                        >
                          <h2
                            id={titleId}
                            className="resume-card-heading resume-experience-heading"
                          >
                            {activeSection.title}
                          </h2>
                          {preamble ? (
                            <div
                              className="resume-experience-preamble resume-body--md"
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(preamble, {
                                  async: false,
                                }) as string,
                              }}
                            />
                          ) : null}
                          <div className="resume-experience-cards">
                            {positions.map((pos) => {
                              const html = marked.parse(pos.bodyMd, {
                                async: false,
                              }) as string
                              return (
                                <article
                                  key={pos.id}
                                  id={pos.id}
                                  className="resume-card resume-card--section project-card"
                                >
                                  <div className="project-card-body">
                                    <div
                                      className="resume-card-body resume-body--md"
                                      dangerouslySetInnerHTML={{ __html: html }}
                                    />
                                  </div>
                                </article>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }

                    if (educationSplit && educationSplit.universities.length > 0) {
                      const { preamble, universities } = educationSplit
                      return (
                        <div
                          key={activeSection.id}
                          id={activeSection.id}
                          className="resume-education-stack resume-anchor"
                          aria-labelledby={titleId}
                        >
                          <h2
                            id={titleId}
                            className="resume-card-heading resume-education-heading"
                          >
                            {activeSection.title}
                          </h2>
                          {preamble ? (
                            <div
                              className="resume-education-preamble resume-body--md"
                              dangerouslySetInnerHTML={{
                                __html: marked.parse(preamble, {
                                  async: false,
                                }) as string,
                              }}
                            />
                          ) : null}
                          <div className="resume-education-cards">
                            {universities.map((u) => {
                              const uniHtml = marked.parse(u.bodyMd, {
                                async: false,
                              }) as string
                              return (
                                <article
                                  key={u.id}
                                  id={u.id}
                                  className="resume-card resume-card--section project-card"
                                >
                                  <div className="project-card-body">
                                    <div
                                      className="resume-card-body resume-body--md"
                                      dangerouslySetInnerHTML={{
                                        __html: uniHtml,
                                      }}
                                    />
                                  </div>
                                </article>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }

                    const html = marked.parse(activeSection.bodyMd, {
                      async: false,
                    }) as string

                    if (activeSection.id === 'section-education') {
                      return (
                        <div
                          key={activeSection.id}
                          id={activeSection.id}
                          className="resume-summary-plain resume-anchor"
                          aria-labelledby={titleId}
                        >
                          <h2
                            id={titleId}
                            className="resume-card-heading resume-summary-heading"
                          >
                            {activeSection.title}
                          </h2>
                          <article className="resume-card resume-card--section project-card">
                            <div className="project-card-body">
                              <div
                                className="resume-card-body resume-body--md"
                                dangerouslySetInnerHTML={{ __html: html }}
                              />
                            </div>
                          </article>
                        </div>
                      )
                    }

                    if (activeSection.id === 'section-professional-summary') {
                      return (
                        <div
                          key={activeSection.id}
                          id={activeSection.id}
                          className="resume-summary-plain resume-anchor"
                          aria-labelledby={titleId}
                        >
                          <h2
                            id={titleId}
                            className="resume-card-heading resume-summary-heading"
                          >
                            {activeSection.title}
                          </h2>
                          <article className="resume-card resume-card--section project-card">
                            <div className="project-card-body">
                              <div
                                className="resume-card-body resume-body--md"
                                dangerouslySetInnerHTML={{ __html: html }}
                              />
                            </div>
                          </article>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={activeSection.id}
                        id={activeSection.id}
                        className="resume-summary-plain resume-anchor"
                        aria-labelledby={titleId}
                      >
                        <h2
                          id={titleId}
                          className="resume-card-heading resume-summary-heading"
                        >
                          {activeSection.title}
                        </h2>
                        <article className="resume-card resume-card--section project-card">
                          <div className="project-card-body">
                            <div
                              className="resume-card-body resume-body--md"
                              dangerouslySetInnerHTML={{ __html: html }}
                            />
                          </div>
                        </article>
                      </div>
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
                        window.location.hash = `#${item.id}`
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
            </div>
          </div>
        </div>
    </article>
  )
}
