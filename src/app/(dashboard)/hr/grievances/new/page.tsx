'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const CATEGORIES = ['HARASSMENT', 'DISCRIMINATION', 'SAFETY', 'POLICY_VIOLATION', 'PSEA', 'OTHER'] as const
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

export default function NewGrievancePage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('MEDIUM')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  function validate(): boolean {
    if (!category || !subject.trim() || !description.trim()) {
      setError(t('grievances.form.requiredFields'))
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      isAnonymous,
      category,
      severity,
      subject: subject.trim(),
      description: description.trim(),
    }

    try {
      const res = await fetch('/api/v1/hr/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/grievances/${json.data.id}`)
      } else {
        setError(json.error || t('grievances.form.failedToCreate'))
      }
    } catch {
      setError(t('grievances.form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('grievances.form.createTitle')} description={t('grievances.form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/grievances')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('grievances.form.grievanceDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-md bg-muted/50 border p-4">
            <div className="flex items-center gap-2">
              <input id="grievance-anonymous" type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="grievance-anonymous" className="font-medium">{t('grievances.fields.isAnonymous')}</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">{t('grievances.form.anonymousNote')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grievance-category">{t('grievances.fields.category')} *</Label>
              <SearchableSelect
                id="grievance-category"
                options={CATEGORIES.map((c) => ({ value: c, label: t(`grievances.categories.${c}`) }))}
                value={category}
                onValueChange={setCategory}
                placeholder={tc('combobox.select')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grievance-severity">{t('grievances.fields.severity')} *</Label>
              <SearchableSelect
                id="grievance-severity"
                options={SEVERITIES.map((s) => ({ value: s, label: t(`grievances.severities.${s}`) }))}
                value={severity}
                onValueChange={setSeverity}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grievance-subject">{t('grievances.fields.subject')} *</Label>
            <Input id="grievance-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('grievances.form.subjectPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grievance-description">{tc('labels.description')} *</Label>
            <Textarea id="grievance-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder={t('grievances.form.descriptionPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label>Supporting Evidence</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
              File upload will be available after submission
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/grievances')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('grievances.form.saving')}
              </>
            ) : (
              t('grievances.form.saveGrievance')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
