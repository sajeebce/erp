function getNumberLocale(locale?: string): string {
  return locale === 'bn' ? 'bn-BD' : 'en-IN'
}

function getDateLocale(locale?: string): string {
  return locale === 'bn' ? 'bn-BD' : 'en-GB'
}

export function formatCurrency(amount: number, locale?: string, currency: string = 'BDT'): string {
  return new Intl.NumberFormat(getNumberLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCrore(amount: number, locale?: string): string {
  const crore = amount / 10000000
  if (locale === 'bn') {
    const formatted = new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(crore)
    return `৳${formatted} Cr`
  }
  return `৳${crore.toFixed(1)} Cr`
}

export function formatLakh(amount: number, locale?: string): string {
  const lakh = amount / 100000
  if (locale === 'bn') {
    const formatted = new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(lakh)
    return `৳${formatted} L`
  }
  return `৳${lakh.toFixed(1)} L`
}

export function formatNumber(num: number, locale?: string): string {
  return new Intl.NumberFormat(getNumberLocale(locale)).format(num)
}

export function formatDate(date: string | Date, locale?: string): string {
  return new Date(date).toLocaleDateString(getDateLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatPercent(value: number, locale?: string): string {
  if (locale === 'bn') {
    const formatted = new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)
    return `${formatted}%`
  }
  return `${value.toFixed(1)}%`
}

/** @deprecated Use formatCurrency instead. Kept for backward compatibility. */
export function formatBDT(amount: number, locale?: string): string {
  return formatCurrency(amount, locale, 'BDT')
}
