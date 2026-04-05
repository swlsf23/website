import type { SiteLocale } from '../generated/sitePages.ts'
import en from '../locales/en.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'
import pt from '../locales/pt.json'
import { useSiteLocale } from './useSiteLocale.ts'

const ui: Record<SiteLocale, typeof en> = { en, es, fr, pt }

export type UiStrings = typeof en

/** Merged chrome + page strings from `locales/*.json` (keys must match across locales). */
export function useUiStrings(): UiStrings {
  const lang = useSiteLocale()
  return ui[lang]
}
