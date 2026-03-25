'use client'

import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

const forms = [
  { title: 'FD-1: Project Registration', description: 'Project proposal and registration with NGOAB', form: 'fd-1' },
  { title: 'FD-2: Fund Release', description: 'Application for release of foreign donation funds', form: 'fd-2' },
  { title: 'FD-3: Quarterly Progress', description: 'Quarterly progress report on project activities', form: 'fd-3' },
  { title: 'FD-4: Personnel Details', description: 'Details of local and foreign personnel employed', form: 'fd-4' },
  { title: 'FD-5: Asset Register', description: 'Statement of assets acquired with foreign funds', form: 'fd-5' },
  { title: 'FD-6: Annual Audit', description: 'Annual audit report and financial statements', form: 'fd-6' },
]

export default function NGOABReportsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="NGOAB Compliance Reports"
        description="NGO Affairs Bureau regulatory forms and compliance submissions"
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
