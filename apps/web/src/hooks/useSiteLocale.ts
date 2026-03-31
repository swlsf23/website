import { useLocation } from 'react-router-dom'
import { SITE_LOCALES, type SiteLocale } from '../generated/sitePages.ts'

/**
 * Active locale from the first URL segment. We read `pathname` (not `useParams`)
 * so nested route pages stay in sync when only `:lang` changes (e.g. EN → FR on
 * the same slug); `useParams` can lag for outlet children in some router setups.
 */
export function useSiteLocale(): SiteLocale {
  const { pathname } = useLocation()
  const first = pathname.split('/').filter(Boolean)[0]
  if (first && (SITE_LOCALES as readonly string[]).includes(first)) {
    return first as SiteLocale
  }
  return 'en'
}
