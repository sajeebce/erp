'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">500</h1>
        <p className="text-lg text-muted-foreground">{t('errors.somethingWentWrong')}</p>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('errors.unexpectedError')}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={reset}>{t('errors.tryAgain')}</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            {t('errors.goToDashboard')}
          </Button>
        </div>
      </div>
    </div>
  )
}
