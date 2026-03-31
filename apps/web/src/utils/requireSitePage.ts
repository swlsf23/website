import {
  getSitePage,
  type SiteLocale,
  type SitePage,
} from '../generated/sitePages.ts'

/**
 * Runtime guard for pages that the build guarantees exist (see generate-site-content
 * locale parity). Should never throw in production if CI/build passed.
 */
export function requireSitePage(lang: SiteLocale, slug: string): SitePage {
  const p = getSitePage(lang, slug)
  if (!p) {
    throw new Error(`Missing site page: locale=${lang} slug=${slug}`)
  }
  return p
}
