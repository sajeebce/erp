'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

// ─── Types ───

interface ExpenseCategory {
  id: string
  code: string
  name: string
  glAccountId: string | null
  glAccountName: string | null
  budgetCategory: string | null
  maxAmount: number | null
  receiptRequired: boolean
  tdsRate: number | null
  vdsRate: number | null
  isActive: boolean
  description: string | null
}

interface GLAccount {
  id: string
  code: string
  name: string
}

// ─── Main Page ───

export default function ExpenseCategoriesPage() {
  const t = useTranslations('finance.expenses.categories')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // GL accounts for dropdown
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([])

  // Form state
  const [fCode, setFCode] = useState('')
  const [fName, setFName] = useState('')
  const [fGlAccountId, setFGlAccountId] = useState('')
  const [fBudgetCategory, setFBudgetCategory] = useState('')
  const [fMaxAmount, setFMaxAmount] = useState('')
  const [fReceiptRequired, setFReceiptRequired] = useState(true)
  const [fTdsRate, setFTdsRate] = useState('')
  const [fVdsRate, setFVdsRate] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fIsActive, setFIsActive] = useState(true)

  // ─── Fetch ───

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/finance/expense-categories')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(data.data ?? data ?? [])
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchGlAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/finance/accounts?type=EXPENSE&limit=500')
      if (res.ok) {
        const d = await res.json()
        setGlAccounts((d.data ?? d ?? []).map((a: Record<string, string>) => ({
          id: a.id, code: a.code ?? a.accountCode, name: a.name ?? a.accountName,
        })))
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => { fetchCategories(); fetchGlAccounts() }, [fetchCategories, fetchGlAccounts])

  // ─── Form helpers ───

  const resetForm = () => {
    setFCode(''); setFName(''); setFGlAccountId(''); setFBudgetCategory('');
    setFMaxAmount(''); setFReceiptRequired(true); setFTdsRate(''); setFVdsRate('');
    setFDescription(''); setFIsActive(true); setEditId(null)
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (cat: ExpenseCategory) => {
    setEditId(cat.id)
    setFCode(cat.code)
    setFName(cat.name)
    setFGlAccountId(cat.glAccountId ?? '')
    setFBudgetCategory(cat.budgetCategory ?? '')
    setFMaxAmount(cat.maxAmount != null ? String(cat.maxAmount) : '')
    setFReceiptRequired(cat.receiptRequired)
    setFTdsRate(cat.tdsRate != null ? String(cat.tdsRate) : '')
    setFVdsRate(cat.vdsRate != null ? String(cat.vdsRate) : '')
    setFDescription(cat.description ?? '')
    setFIsActive(cat.isActive)
    setDialogOpen(true)
  }

  // ─── Save ───

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const body = {
        code: fCode,
        name: fName,
        glAccountId: fGlAccountId || null,
        budgetCategory: fBudgetCategory || null,
        maxAmount: fMaxAmount ? parseFloat(fMaxAmount) : null,
        receiptRequired: fReceiptRequired,
        tdsRate: fTdsRate ? parseFloat(fTdsRate) : null,
        vdsRate: fVdsRate ? parseFloat(fVdsRate) : null,
        description: fDescription || null,
        isActive: fIsActive,
      }

      const url = editId
        ? `/api/v1/finance/expense-categories/${editId}`
        : '/api/v1/finance/expense-categories'

      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch {
      setError(editId ? t('failedToUpdate') : t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle Active ───

  const toggleActive = async (cat: ExpenseCategory) => {
    try {
      const res = await fetch(`/api/v1/finance/expense-categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      })
      if (!res.ok) throw new Error()
      fetchCategories()
    } catch {
      setError(t('failedToUpdate'))
    }
  }

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addCategory')}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">{t('noCategories')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('code')}</TableHead>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('glAccount')}</TableHead>
                    <TableHead>{t('budgetCategory')}</TableHead>
                    <TableHead className="text-right">{t('maxAmount')}</TableHead>
                    <TableHead>{t('receiptRequired')}</TableHead>
                    <TableHead>{t('tdsVds')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id} className={!cat.isActive ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-sm">{cat.code}</TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cat.glAccountName ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">{cat.budgetCategory ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm">
                        {cat.maxAmount != null ? formatCurrency(cat.maxAmount) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.receiptRequired ? 'default' : 'outline'}>
                          {cat.receiptRequired ? t('yes') : t('no')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {cat.tdsRate != null || cat.vdsRate != null
                          ? `TDS ${cat.tdsRate ?? 0}% / VDS ${cat.vdsRate ?? 0}%`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                          {cat.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(cat)}
                            aria-label={t('edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleActive(cat)}
                            aria-label={cat.isActive ? t('deactivate') : t('activate')}
                          >
                            {cat.isActive ? (
                              <ToggleRight className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? t('editCategory') : t('addCategory')}</DialogTitle>
            <DialogDescription>
              {editId ? t('editCategoryDescription') : t('addCategoryDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="f-code">{t('code')}</Label>
                <Input
                  id="f-code"
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value)}
                  placeholder={t('codePlaceholder')}
                  disabled={!!editId}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="f-name">{t('name')}</Label>
                <Input id="f-name" value={fName} onChange={(e) => setFName(e.target.value)} placeholder={t('namePlaceholder')} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('glAccount')}</Label>
              <SearchableSelect
                options={glAccounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                value={fGlAccountId}
                onValueChange={setFGlAccountId}
                placeholder={t('selectGlAccount')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="f-budget">{t('budgetCategory')}</Label>
                <Input id="f-budget" value={fBudgetCategory} onChange={(e) => setFBudgetCategory(e.target.value)} placeholder={t('budgetCategoryPlaceholder')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="f-max">{t('maxAmount')}</Label>
                <Input id="f-max" type="number" value={fMaxAmount} onChange={(e) => setFMaxAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="f-tds">{t('tdsRate')}</Label>
                <Input id="f-tds" type="number" value={fTdsRate} onChange={(e) => setFTdsRate(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="f-vds">{t('vdsRate')}</Label>
                <Input id="f-vds" type="number" value={fVdsRate} onChange={(e) => setFVdsRate(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="f-receipt" checked={fReceiptRequired} onCheckedChange={setFReceiptRequired} />
              <Label htmlFor="f-receipt">{t('receiptRequired')}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="f-active" checked={fIsActive} onCheckedChange={setFIsActive} />
              <Label htmlFor="f-active">{t('active')}</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="f-desc">{t('descriptionLabel')}</Label>
              <Textarea id="f-desc" value={fDescription} onChange={(e) => setFDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc('cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || !fCode || !fName}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? t('updateCategory') : t('addCategory')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
