'use client'

import { useLocale } from 'next-intl'
import { useMemo } from 'react'
import { formatCurrency, formatDate, formatNumber, formatPercent, formatCrore, formatLakh } from '@/lib/formatters'

export function useFormatters() {
  const locale = useLocale()

  return useMemo(() => ({
    formatCurrency: (amount: number, currency?: string) => formatCurrency(amount, locale, currency),
    formatDate: (date: string | Date) => formatDate(date, locale),
    formatNumber: (num: number) => formatNumber(num, locale),
    formatPercent: (value: number) => formatPercent(value, locale),
    formatCrore: (amount: number) => formatCrore(amount, locale),
    formatLakh: (amount: number) => formatLakh(amount, locale),
  }), [locale])
}
