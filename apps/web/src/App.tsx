import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ResumePage } from './pages/ResumePage.tsx'
import { ProjectsPage } from './pages/ProjectsPage.tsx'
import { ContactPage } from './pages/ContactPage.tsx'
import { SITE_LOCALES, type SiteLocale } from './generated/sitePages.ts'
import './App.css'

function isSiteLocale(s: string): s is SiteLocale {
  return (SITE_LOCALES as readonly string[]).includes(s)
}

/**
 * Guards `/:lang` so only known locales (from generated `SITE_LOCALES`) render the
 * shell. A bad first segment (e.g. `/nope/...`) redirects to English home.
 */
function LocaleShell() {
  const { lang } = useParams<{ lang: string }>()
  if (!lang || !isSiteLocale(lang)) {
    return <Navigate to="/en/" replace />
  }
  return <Layout />
}

/**
 * Under a valid locale, unknown child paths (e.g. `/en/not-a-page`) redirect to
 * that locale’s index (home / “about”) instead of a 404, which matches a small
 * static site.
 */
function RedirectToLocaleHome() {
  const { lang } = useParams<{ lang: string }>()
  if (!lang || !isSiteLocale(lang)) {
    return <Navigate to="/en/" replace />
  }
  return <Navigate to={`/${lang}/`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en/" replace />} />
      {/*
        Legacy paths without a locale segment must be listed before `/:lang`, otherwise
        `/resume` would be parsed as `lang=resume`.
      */}
      <Route path="/resume" element={<Navigate to="/en/resume" replace />} />
      <Route path="/projects" element={<Navigate to="/en/projects" replace />} />
      <Route path="/contact" element={<Navigate to="/en/contact" replace />} />
      <Route path="/:lang" element={<LocaleShell />}>
        <Route index element={<HomePage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<RedirectToLocaleHome />} />
      </Route>
    </Routes>
  )
}
