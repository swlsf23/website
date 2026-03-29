import { NavLink, Outlet } from 'react-router-dom'
import { SOCIAL_GITHUB, SOCIAL_LINKEDIN } from '../constants/social'

export function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-brand">
          <p className="site-name">Steven Leslie</p>
          <nav className="site-nav" aria-label="Primary">
            <div className="site-nav-pages">
              <NavLink to="/" end>
                About me
              </NavLink>
              <NavLink to="/resume">Resume</NavLink>
              <NavLink to="/projects">Projects</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </div>
            <div className="site-nav-social">
              <a
                href={SOCIAL_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                href={SOCIAL_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Steven Leslie</p>
      </footer>
    </div>
  )
}
