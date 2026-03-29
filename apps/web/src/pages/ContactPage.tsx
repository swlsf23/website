import { SOCIAL_LINKEDIN } from '../constants/social'

export function ContactPage() {
  return (
    <section className="contact-page" aria-labelledby="contact-heading">
      <header className="page-header">
        <h1 id="contact-heading">Contact</h1>
      </header>
      <div className="projects-body--md">
        <p>
          The best way to contact me is on{' '}
          <a
            href={SOCIAL_LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          .
        </p>
      </div>
    </section>
  )
}
