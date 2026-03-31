import { SOCIAL_LINKEDIN } from '../constants/social'
import { useUiStrings } from '../hooks/useUiStrings.ts'

export function ContactPage() {
  const t = useUiStrings()

  return (
    <section className="contact-page" aria-labelledby="contact-heading">
      <header className="page-header">
        <h1 id="contact-heading">{t['contact.title']}</h1>
      </header>
      <article className="project-card">
        <div className="project-card-body">
          <p>
            {t['contact.beforeLink']}
            <a
              href={SOCIAL_LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t['contact.linkedinLabel']}
            </a>
            {t['contact.afterLink']}
          </p>
        </div>
      </article>
    </section>
  )
}
