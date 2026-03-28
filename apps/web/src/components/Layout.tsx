import { NavLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-brand">
          <p className="site-name">Steven Leslie</p>
          <nav className="site-nav" aria-label="Primary">
            <NavLink to="/" end>
              About
            </NavLink>
            <NavLink to="/resume">Resume</NavLink>
            <NavLink to="/projects">Projects</NavLink>
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
