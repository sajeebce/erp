'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

export default function NGOABReportsPage() {
  const t = useTranslations('reports')
  const router = useRouter()

  const forms = [
    { title: t('ngoab.fd1'), description: t('ngoab.fd1Desc'), form: 'fd-1' },
    { title: t('ngoab.fd2'), description: t('ngoab.fd2Desc'), form: 'fd-2' },
    { title: t('ngoab.fd3'), description: t('ngoab.fd3Desc'), form: 'fd-3' },
    { title: t('ngoab.fd4'), description: t('ngoab.fd4Desc'), form: 'fd-4' },
    { title: t('ngoab.fd5'), description: t('ngoab.fd5Desc'), form: 'fd-5' },
    { title: t('ngoab.fd6'), description: t('ngoab.fd6Desc'), form: 'fd-6' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('ngoab.title')}
        description={t('ngoab.description')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card
            key={form.form}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/reports/ngoab/${form.form}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{form.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{form.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
