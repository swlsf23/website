import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SOCIAL_GITHUB, SOCIAL_LINKEDIN } from '../constants/social'
import {
  SITE_LOCALES,
  type SiteLocale,
} from '../generated/sitePages.ts'
import { useSiteLocale } from '../hooks/useSiteLocale.ts'
import { useUiStrings } from '../hooks/useUiStrings.ts'
import {
  navigationTargetForLocale,
  routePathWithoutLocale,
} from '../utils/localePath.ts'

/** Menu order: EN, FR, ES, PT (must match active `SITE_LOCALES`). */
const LOCALE_MENU_ORDER: SiteLocale[] = ['en', 'fr', 'es', 'pt']

function LanguageSwitcher() {
  const lang = useSiteLocale()
  const location = useLocation()
  const navigate = useNavigate()
  const t = useUiStrings()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const triggerId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      className={
        open
          ? 'site-lang site-lang-dropdown site-lang-dropdown--open'
          : 'site-lang site-lang-dropdown'
      }
      ref={rootRef}
    >
      <button
        id={triggerId}
        type="button"
        className="site-lang-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={t['lang.switcher']}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="site-lang-dropdown-trigger-label">
          {lang.toUpperCase()}
        </span>
        <span className="site-lang-dropdown-chevron" aria-hidden>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <polyline
              points="2.5 4.25 6 7.75 9.5 4.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <ul
          id={listboxId}
          className="site-lang-dropdown-menu"
          role="listbox"
          aria-labelledby={triggerId}
        >
          {LOCALE_MENU_ORDER.filter((loc) =>
            (SITE_LOCALES as readonly string[]).includes(loc),
          ).map((loc) => {
            const target = navigationTargetForLocale(
              location.pathname,
              location.search,
              location.hash,
              loc,
            )
            const selected = loc === lang
            return (
              <li key={loc} className="site-lang-dropdown-item" role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    selected
                      ? 'site-lang-dropdown-option site-lang-dropdown-option--selected'
                      : 'site-lang-dropdown-option'
                  }
                  onClick={() => {
                    navigate(target)
                    setOpen(false)
                  }}
                >
                  {loc.toUpperCase()}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
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
        <div className="site-footer-row">
          <p className="site-footer-copy">
            {t['footer.copyright'].replace('{year}', year)}
          </p>
          <div className="site-footer-lang" aria-label={t['lang.switcher']}>
            <LanguageSwitcher
              key={`${location.pathname}${location.search}${location.hash}`}
            />
          </div>
        </div>
      </footer>
    </div>
  )
}
