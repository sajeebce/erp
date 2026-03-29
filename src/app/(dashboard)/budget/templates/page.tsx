'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  FileText, Copy, ArrowRight, Loader2, Percent, Globe,
  Building2, ChevronRight, ShieldCheck, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface BudgetTemplateCategory {
  name: string
  subCategories?: string[]
}

interface BudgetTemplate {
  id: string
  name: string
  donor: string
  description: string
  isGlobal: boolean
  categories: BudgetTemplateCategory[]
  indirectCostRate: number | null
  indirectCostBase: string | null
  notes: string | null
}

interface BudgetOption {
  id: string
  name: string
  budgetCode: string
  totalAmount: number
  status: string
  project?: { id: string; name: string }
}

export default function BudgetTemplatesPage() {
  const t = useTranslations('budget')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency } = useFormatters()

  const [templates, setTemplates] = useState<BudgetTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  const [budgets, setBudgets] = useState<BudgetOption[]>([])
  const [loadingBudgets, setLoadingBudgets] = useState(true)
  const [selectedBudgetId, setSelectedBudgetId] = useState('')
  const [escalationPercent, setEscalationPercent] = useState('')
  const [cloning, setCloning] = useState(false)
  const [cloneError, setCloneError] = useState('')

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/v1/budget/templates')
        const json = await res.json()
        if (json.success) {
          setTemplates(json.data)
        }
      } catch {
        // Templates are static fallback, ignore errors
      } finally {
        setLoadingTemplates(false)
      }
    }
    fetchTemplates()
  }, [])

  // Fetch budgets for clone section
  useEffect(() => {
    async function fetchBudgets() {
      try {
        const res = await fetch('/api/v1/budget?limit=100')
        const json = await res.json()
        if (json.success) {
          setBudgets(json.data)
        }
      } catch {
        // ignore
      } finally {
        setLoadingBudgets(false)
      }
    }
    fetchBudgets()
  }, [])

  const handleUseTemplate = useCallback((templateId: string) => {
    const tplKey = templateId.replace('tpl-', '')
    router.push(`/budget/new?template=${tplKey}`)
  }, [router])

  const handleClone = useCallback(async () => {
    if (!selectedBudgetId) return

    setCloning(true)
    setCloneError('')

    try {
      const res = await fetch(`/api/v1/budget/${selectedBudgetId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalationPercent: escalationPercent ? Number(escalationPercent) : 0,
        }),
      })

      const json = await res.json()

      if (json.success) {
        router.push(`/budget/${json.data.id}`)
      } else {
        setCloneError(json.error?.message || t('templates.cloneFailed'))
      }
    } catch {
      setCloneError(t('templates.cloneFailed'))
    } finally {
      setCloning(false)
    }
  }, [selectedBudgetId, escalationPercent, router, t])

  const budgetOptions = budgets.map((b) => ({
    value: b.id,
    label: `${b.budgetCode} — ${b.name}${b.project ? ` (${b.project.name})` : ''}`,
  }))

  const getDonorColor = (donor: string) => {
    switch (donor) {
      case 'USAID': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'European Union': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'DFID/FCDO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getIcrLabel = (base: string | null) => {
    switch (base) {
      case 'MTDC': return t('indirectCost.MTDC')
      case 'TOTAL_DIRECT': return t('indirectCost.TOTAL_DIRECT')
      case 'PERSONNEL': return t('indirectCost.PERSONNEL')
      default: return '—'
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('templates.title')}
        description={t('templates.description')}
      />

      {/* Section 1: Donor Templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t('templates.donorFormats')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t('templates.donorFormatsDesc')}</p>

        {loadingTemplates ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {templates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge className={getDonorColor(template.donor)} variant="secondary">
                        {template.donor}
                      </Badge>
                    </div>
                    <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 pb-3">
                  {/* Categories list */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {t('templates.categories')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.categories.map((cat) => (
                        <Badge
                          key={cat.name}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* ICR info */}
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Percent className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{t('indirectCost.title')}:</span>
                      {template.indirectCostRate != null ? (
                        <span>
                          {template.indirectCostRate}% ({getIcrLabel(template.indirectCostBase)})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{t('templates.configurable')}</span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {template.notes && (
                    <div className="flex gap-1.5 text-[11px] text-muted-foreground">
                      <Info className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{template.notes}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t('templates.useTemplate')}
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Section 2: Clone Budget */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Copy className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t('templates.cloneBudget')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t('templates.cloneBudgetDesc')}</p>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Budget selector */}
              <div className="space-y-2">
                <Label>{t('templates.sourceBudget')}</Label>
                {loadingBudgets ? (
                  <div className="flex h-10 items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <SearchableSelect
                    options={budgetOptions}
                    value={selectedBudgetId}
                    onValueChange={setSelectedBudgetId}
                    placeholder={t('templates.selectBudget')}
                    searchPlaceholder={t('searchBudgets')}
                    emptyMessage={tc('combobox.noResults')}
                  />
                )}
              </div>

              {/* Escalation */}
              <div className="space-y-2">
                <Label>{t('templates.escalation')}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="-100"
                    max="1000"
                    step="0.5"
                    placeholder={t('templates.escalationPlaceholder')}
                    value={escalationPercent}
                    onChange={(e) => setEscalationPercent(e.target.value)}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('templates.escalationHint')}
                </p>
              </div>
            </div>

            {/* Selected budget preview */}
            {selectedBudgetId && (() => {
              const selected = budgets.find((b) => b.id === selectedBudgetId)
              if (!selected) return null
              const esc = escalationPercent ? Number(escalationPercent) : 0
              const newAmount = selected.totalAmount * (1 + esc / 100)

              return (
                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">{t('templates.originalAmount')}</span>
                      <p className="font-medium">{formatCurrency(selected.totalAmount)}</p>
                    </div>
                    {esc !== 0 && (
                      <>
                        <div className="flex items-center justify-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('templates.escalatedAmount')}</span>
                          <p className="font-medium">{formatCurrency(newAmount)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}

            {cloneError && (
              <p className="text-sm text-destructive">{cloneError}</p>
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleClone}
              disabled={!selectedBudgetId || cloning}
            >
              {cloning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('templates.cloning')}
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {t('templates.cloneBudget')}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
