import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SOCIAL_GITHUB, SOCIAL_LINKEDIN } from '../constants/social'
import { SITE_LOCALES } from '../generated/sitePages.ts'
import { useSiteLocale } from '../hooks/useSiteLocale.ts'
import { useUiStrings } from '../hooks/useUiStrings.ts'
import {
  navigationTargetForLocale,
  routePathWithoutLocale,
} from '../utils/localePath.ts'

function LanguageSwitcher() {
  const lang = useSiteLocale()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="site-lang">
      {SITE_LOCALES.map((loc) => {
        const target = navigationTargetForLocale(
          location.pathname,
          location.search,
          location.hash,
          loc,
        )
        const href = `${target.pathname}${target.search}${target.hash}`
        return (
          <a
            key={loc}
            className="site-lang-link"
            href={href}
            onClick={(e) => {
              e.preventDefault()
              navigate(target)
            }}
            aria-current={loc === lang ? 'page' : undefined}
          >
            {loc === 'en' ? 'EN' : loc.toUpperCase()}
          </a>
        )
      })}
    </div>
  )
}

export function Layout() {
  const lang = useSiteLocale()
  const location = useLocation()
  const t = useUiStrings()
  const year = String(new Date().getFullYear())

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-brand">
          <p className="site-name">{t['site.brand']}</p>
          <nav className="site-nav" aria-label={t['nav.primary']}>
            <div className="site-nav-pages">
              <NavLink to={`/${lang}/`} end>
                {t['nav.about']}
              </NavLink>
              <NavLink to={`/${lang}/resume`}>{t['nav.resume']}</NavLink>
              <NavLink to={`/${lang}/projects`}>{t['nav.projects']}</NavLink>
              <NavLink to={`/${lang}/contact`}>{t['nav.contact']}</NavLink>
            </div>
            <div className="site-nav-social">
              <a
                href={SOCIAL_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t['nav.social.github']}
              </a>
              <a
                href={SOCIAL_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t['nav.social.linkedin']}
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        <Outlet key={routePathWithoutLocale(location.pathname)} />
      </main>

      <footer className="site-footer">
        <p>{t['footer.copyright'].replace('{year}', year)}</p>
      </footer>

      <aside className="site-lang-dock" aria-label={t['lang.switcher']}>
        <LanguageSwitcher />
      </aside>
    </div>
  )
}
