// App-level UI locales (what the UI can be translated into)
export const appLocales = ['en', 'bn'] as const
export type AppLocale = (typeof appLocales)[number]
export const defaultLocale: AppLocale = 'en'

// All known locales for data-level localization (org can pick any of these)
export const allLocales = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  my: { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', direction: 'ltr' },
  ne: { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', direction: 'ltr' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
} as const satisfies Record<string, { code: string; name: string; nativeName: string; direction: 'ltr' | 'rtl' }>

export type LocaleCode = keyof typeof allLocales

// Language switcher display names (for app-level UI switching)
export const localeNames: Record<AppLocale, string> = {
  en: 'English',
  bn: 'বাংলা',
}

// Backwards compat
export const locales = appLocales
export type Locale = AppLocale
