import type { SiteLocale } from '../generated/sitePages.ts'

/**
 * Replaces the first path segment (locale) with `newLang`, preserving the rest of the path.
 * Used for the language switcher so `/en/resume` → `/fr/resume`.
 */
export function pathWithLocale(pathname: string, newLang: SiteLocale): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return `/${newLang}/`
  }
  segments[0] = newLang
  const path = `/${segments.join('/')}`
  return pathname.endsWith('/') ? `${path}/` : path
}

/** Full location slice for `navigate()` / `<a href>` when switching locale (keeps query + hash). */
export function navigationTargetForLocale(
  pathname: string,
  search: string,
  hash: string,
  newLang: SiteLocale,
): { pathname: string; search: string; hash: string } {
  return {
    pathname: pathWithLocale(pathname, newLang),
    search,
    hash,
  }
}

/**
 * Path without the locale segment (`/en/resume` → `/resume`, `/fr/` → `/`).
 * Used for `<Outlet key>` so switching language does not remount the route.
 */
export function routePathWithoutLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length <= 1) return '/'
  return `/${parts.slice(1).join('/')}`
}
