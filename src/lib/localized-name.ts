type LocalizedName = Record<string, string>

export function getLocalizedName(
  localizedName: LocalizedName | null | undefined,
  fallbackName: string,
  locale: string
): string {
  if (!localizedName) return fallbackName
  return localizedName[locale] || localizedName['en'] || fallbackName
}

export function buildLocalizedName(en: string, bn?: string): LocalizedName {
  const result: LocalizedName = { en }
  if (bn?.trim()) result.bn = bn.trim()
  return result
}
