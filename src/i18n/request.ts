import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined
  const locale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale

  const modules = [
    'common', 'navigation', 'auth', 'dashboard', 'finance', 'budget',
    'donors', 'projects', 'beneficiaries', 'procurement', 'assets',
    'hr', 'microfinance', 'reports', 'settings', 'admin',
  ]

  const messageEntries = await Promise.all(
    modules.map(async (mod) => {
      try {
        const messages = (await import(`../messages/${locale}/${mod}.json`)).default
        return [mod, messages] as const
      } catch {
        // Fallback to English if locale file missing
        try {
          const messages = (await import(`../messages/en/${mod}.json`)).default
          return [mod, messages] as const
        } catch {
          return [mod, {}] as const
        }
      }
    })
  )

  const messages: Record<string, Record<string, unknown>> = {}
  for (const [mod, content] of messageEntries) {
    messages[mod] = content as Record<string, unknown>
  }

  return {
    locale,
    messages,
  }
})
