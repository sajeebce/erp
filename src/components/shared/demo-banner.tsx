'use client'

import { useTranslations } from 'next-intl'
import { Info } from 'lucide-react'

export function DemoBanner() {
  const t = useTranslations('common.demoBanner')

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-800/40 dark:text-amber-200">
          {t('badge')}
        </span>
        <p className="mt-1 leading-6">{t('message')}</p>
      </div>
    </div>
  )
}
