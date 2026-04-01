'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

interface PayslipTemplate {
  id: string
  name: string
  headerText: string | null
  footerText: string | null
  showYTD: boolean
  showEmployerContributions: boolean
  showAttendanceSummary: boolean
  showNetPayInWords: boolean
  paperSize: string
  isDefault: boolean
  isActive: boolean
}

export default function PayslipTemplatesPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [templates, setTemplates] = useState<PayslipTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PayslipTemplate | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formHeaderText, setFormHeaderText] = useState('')
  const [formFooterText, setFormFooterText] = useState('')
  const [formShowYTD, setFormShowYTD] = useState(true)
  const [formShowEmployerContributions, setFormShowEmployerContributions] = useState(false)
  const [formShowAttendanceSummary, setFormShowAttendanceSummary] = useState(true)
  const [formShowNetPayInWords, setFormShowNetPayInWords] = useState(true)
  const [formPaperSize, setFormPaperSize] = useState('A4')
  const [formIsDefault, setFormIsDefault] = useState(false)

  const fetchTemplates = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/hr/payslip-templates?limit=100')
      .then(r => r.json())
      .then(json => { if (json.success) setTemplates(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  function resetForm() {
    setFormName('')
    setFormHeaderText('')
    setFormFooterText('')
    setFormShowYTD(true)
    setFormShowEmployerContributions(false)
    setFormShowAttendanceSummary(true)
    setFormShowNetPayInWords(true)
    setFormPaperSize('A4')
    setFormIsDefault(false)
    setEditingTemplate(null)
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(template: PayslipTemplate) {
    setEditingTemplate(template)
    setFormName(template.name)
    setFormHeaderText(template.headerText || '')
    setFormFooterText(template.footerText || '')
    setFormShowYTD(template.showYTD)
    setFormShowEmployerContributions(template.showEmployerContributions)
    setFormShowAttendanceSummary(template.showAttendanceSummary)
    setFormShowNetPayInWords(template.showNetPayInWords)
    setFormPaperSize(template.paperSize)
    setFormIsDefault(template.isDefault)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formName.trim()) return
    setSaving(true)

    const payload = {
      name: formName.trim(),
      headerText: formHeaderText.trim() || null,
      footerText: formFooterText.trim() || null,
      showYTD: formShowYTD,
      showEmployerContributions: formShowEmployerContributions,
      showAttendanceSummary: formShowAttendanceSummary,
      showNetPayInWords: formShowNetPayInWords,
      paperSize: formPaperSize,
      isDefault: formIsDefault,
    }

    try {
      const url = editingTemplate
        ? `/api/v1/hr/payslip-templates/${editingTemplate.id}`
        : '/api/v1/hr/payslip-templates'
      const res = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setDialogOpen(false)
        resetForm()
        fetchTemplates()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function featureBadges(template: PayslipTemplate) {
    const badges: string[] = []
    if (template.showYTD) badges.push(t('payslip.ytd'))
    if (template.showAttendanceSummary) badges.push(t('payslip.attendanceSummary'))
    if (template.showEmployerContributions) badges.push(t('payslip.employerContributions'))
    if (template.showNetPayInWords) badges.push(t('payslip.netPayInWords'))
    return badges
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('payslip.templates')} description={t('salaryStructures.description')}>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />{tc('buttons.create')}
        </Button>
      </PageHeader>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tc('labels.loading')}
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('payslip.noPayslips')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {template.isDefault && <Badge>{t('salaryStructures.isDefault')}</Badge>}
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(template)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.paperSize}</Badge>
                  </div>

                  {template.headerText && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.headerText}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {featureBadges(template).map(badge => (
                      <Badge key={badge} variant="secondary" className="text-xs">{badge}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm() } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? t('payslip.templateName') : tc('buttons.create')}
            </DialogTitle>
            <DialogDescription>{t('payslip.templates')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">{t('payslip.templateName')}</Label>
              <Input
                id="templateName"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={t('payslip.templateName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerText">Header Text</Label>
              <Textarea
                id="headerText"
                value={formHeaderText}
                onChange={e => setFormHeaderText(e.target.value)}
                rows={2}
                placeholder="Organization header text for payslip"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Textarea
                id="footerText"
                value={formFooterText}
                onChange={e => setFormFooterText(e.target.value)}
                rows={2}
                placeholder="Footer notes or disclaimers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paperSize">Paper Size</Label>
              <Select value={formPaperSize} onValueChange={setFormPaperSize}>
                <SelectTrigger id="paperSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="LETTER">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox id="showYTD" checked={formShowYTD} onCheckedChange={c => setFormShowYTD(!!c)} />
                <Label htmlFor="showYTD">{t('payslip.ytd')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="showEmployer" checked={formShowEmployerContributions} onCheckedChange={c => setFormShowEmployerContributions(!!c)} />
                <Label htmlFor="showEmployer">{t('payslip.employerContributions')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="showAttendance" checked={formShowAttendanceSummary} onCheckedChange={c => setFormShowAttendanceSummary(!!c)} />
                <Label htmlFor="showAttendance">{t('payslip.attendanceSummary')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="showNetPayWords" checked={formShowNetPayInWords} onCheckedChange={c => setFormShowNetPayInWords(!!c)} />
                <Label htmlFor="showNetPayWords">{t('payslip.netPayInWords')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="templateDefault" checked={formIsDefault} onCheckedChange={c => setFormIsDefault(!!c)} />
                <Label htmlFor="templateDefault">{t('salaryStructures.isDefault')}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? tc('labels.loading') : tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
