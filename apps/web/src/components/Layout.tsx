import { NavLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <NavLink className="site-logo" to="/" end>
          Steven Leslie
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/resume">Resume</NavLink>
          <NavLink to="/about-this-site">About this site</NavLink>
        </nav>
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
