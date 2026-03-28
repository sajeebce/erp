import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const t = await getTranslations('common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-lg text-muted-foreground">{t('errors.pageNotFound')}</p>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('errors.pageNotFoundDesc')}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/dashboard">
            <Button>{t('errors.goToDashboard')}</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">{t('errors.login')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
