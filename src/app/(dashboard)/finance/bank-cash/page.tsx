'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Loader2, Landmark, Wallet, Smartphone, Save, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchableSelect } from '@/components/shared/searchable-select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/page-header'
import { HelpButton } from '@/components/shared/help-modal'
import { useFormatters } from '@/hooks/use-formatters'

// ─── Types ───

interface BankCashAccount {
  id: string
  accountCode: string
  accountName: string
  type: string
  bankName: string | null
  branchName: string | null
  accountNumber: string | null
  routingNumber: string | null
  swiftCode: string | null
  currencyCode: string
  isMotherAccount: boolean
  currentBalance: number
  isActive: boolean
  description: string | null
  glAccountId: string | null
  glAccount: { id: string; code: string; name: string } | null
}

const ACCOUNT_TYPES = ['CURRENT', 'SAVINGS', 'FIXED_DEPOSIT', 'MOBILE_BANKING', 'CASH'] as const
type AccountType = (typeof ACCOUNT_TYPES)[number]

const TYPE_FILTER_MAP: Record<string, AccountType[]> = {
  all: [...ACCOUNT_TYPES],
  bank: ['CURRENT', 'SAVINGS'],
  cash: ['CASH'],
  mobile: ['MOBILE_BANKING'],
  fdr: ['FIXED_DEPOSIT'],
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  CURRENT: Landmark,
  SAVINGS: Landmark,
  FIXED_DEPOSIT: Landmark,
  MOBILE_BANKING: Smartphone,
  CASH: Wallet,
}

// ─── Main Page ───

export default function BankCashPage() {
  const t = useTranslations('finance.bankCash')
  const th = useTranslations('finance.help.bankCash')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [accounts, setAccounts] = useState<BankCashAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  // GL accounts for linking
  const [glAccounts, setGlAccounts] = useState<{id: string, code: string, name: string}[]>([])

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<AccountType | ''>('')
  const [formBankName, setFormBankName] = useState('')
  const [formBranchName, setFormBranchName] = useState('')
  const [formAccountNumber, setFormAccountNumber] = useState('')
  const [formRoutingNumber, setFormRoutingNumber] = useState('')
  const [formSwiftCode, setFormSwiftCode] = useState('')
  const [formCurrency, setFormCurrency] = useState('BDT')
  const [formIsMotherAccount, setFormIsMotherAccount] = useState(false)
  const [formBalance, setFormBalance] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formGlAccountId, setFormGlAccountId] = useState('')

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/finance/bank-accounts?limit=200')
      const json = await res.json()
      if (json.success) {
        setAccounts(json.data)
      } else {
        console.error('Bank accounts API error:', json)
      }
    } catch (err) {
      console.error('Bank accounts fetch error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  useEffect(() => {
    async function fetchGlAccounts() {
      try {
        const res = await fetch('/api/v1/finance/accounts?type=ASSET&isGroup=false&limit=500')
        const json = await res.json()
        if (json.success) setGlAccounts(json.data)
      } catch { /* ignore */ }
    }
    fetchGlAccounts()
  }, [])

  function resetForm() {
    setFormCode('')
    setFormName('')
    setFormType('')
    setFormBankName('')
    setFormBranchName('')
    setFormAccountNumber('')
    setFormRoutingNumber('')
    setFormSwiftCode('')
    setFormCurrency('BDT')
    setFormIsMotherAccount(false)
    setFormBalance('')
    setFormDescription('')
    setFormIsActive(true)
    setFormGlAccountId('')
    setError('')
    setEditId(null)
  }

  function openCreate() {
    resetForm()
    setSheetOpen(true)
  }

  function openEdit(acc: BankCashAccount) {
    setEditId(acc.id)
    setFormCode(acc.accountCode)
    setFormName(acc.accountName)
    setFormType(acc.type as AccountType)
    setFormBankName(acc.bankName || '')
    setFormBranchName(acc.branchName || '')
    setFormAccountNumber(acc.accountNumber || '')
    setFormRoutingNumber(acc.routingNumber || '')
    setFormSwiftCode(acc.swiftCode || '')
    setFormCurrency(acc.currencyCode)
    setFormIsMotherAccount(acc.isMotherAccount)
    setFormBalance(String(Number(acc.currentBalance)))
    setFormDescription(acc.description || '')
    setFormIsActive(acc.isActive)
    setFormGlAccountId(acc.glAccountId || '')
    setError('')
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!formCode.trim() || !formName.trim() || !formType) {
      setError(t('saveFailed'))
      return
    }
    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      accountCode: formCode.trim(),
      accountName: formName.trim(),
      type: formType,
      bankName: formBankName.trim() || null,
      branchName: formBranchName.trim() || null,
      accountNumber: formAccountNumber.trim() || null,
      routingNumber: formRoutingNumber.trim() || null,
      swiftCode: formSwiftCode.trim() || null,
      currencyCode: formCurrency,
      isMotherAccount: formIsMotherAccount,
      description: formDescription.trim() || null,
      glAccountId: formGlAccountId && formGlAccountId !== '_none' ? formGlAccountId : null,
    }
    if (!editId) {
      payload.currentBalance = Number(formBalance) || 0
    }
    if (editId) {
      payload.isActive = formIsActive
    }

    try {
      const url = editId ? `/api/v1/finance/bank-accounts/${editId}` : '/api/v1/finance/bank-accounts'
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setSheetOpen(false)
        resetForm()
        setSavedMsg(t('saved'))
        setTimeout(() => setSavedMsg(''), 3000)
        await fetchAccounts()
      } else {
        setError(json.error?.message || t('saveFailed'))
      }
    } catch {
      setError(t('saveFailed'))
    }
    setSaving(false)
  }

  // Filter accounts
  const filterTypes = TYPE_FILTER_MAP[filter] || ACCOUNT_TYPES
  const filtered = accounts.filter(a => filterTypes.includes(a.type as AccountType))

  // Summary calculations
  const bankTotal = accounts
    .filter(a => ['CURRENT', 'SAVINGS'].includes(a.type) && a.isActive)
    .reduce((sum, a) => sum + Number(a.currentBalance), 0)
  const cashTotal = accounts
    .filter(a => a.type === 'CASH' && a.isActive)
    .reduce((sum, a) => sum + Number(a.currentBalance), 0)
  const mobileTotal = accounts
    .filter(a => a.type === 'MOBILE_BANKING' && a.isActive)
    .reduce((sum, a) => sum + Number(a.currentBalance), 0)
  const totalLiquid = bankTotal + cashTotal + mobileTotal

  // ─── Render ───
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <HelpButton
          title={th('title')}
          description={th('description')}
          steps={[
            { title: th('step1Title'), description: th('step1Desc') },
            { title: th('step2Title'), description: th('step2Desc') },
            { title: th('step3Title'), description: th('step3Desc') },
            { title: th('step4Title'), description: th('step4Desc') },
            { title: th('step5Title'), description: th('step5Desc') },
          ]}
          tips={[th('tip1'), th('tip2'), th('tip3')]}
        />
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />{t('addAccount')}
        </Button>
      </PageHeader>

      {savedMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center gap-2">
          <Check className="h-4 w-4" />{savedMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalBank')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold font-mono">{formatCurrency(bankTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalCash')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold font-mono">{formatCurrency(cashTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalMobileBanking')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-violet-500" />
              <p className="text-2xl font-bold font-mono">{formatCurrency(mobileTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalLiquid')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalLiquid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b">
        {(['all', 'bank', 'cash', 'mobile', 'fdr'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(tab)} ({accounts.filter(a => TYPE_FILTER_MAP[tab]?.includes(a.type as AccountType)).length})
          </button>
        ))}
      </div>

      {/* Accounts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('noAccounts')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('code')}</TableHead>
                    <TableHead>{t('accountName')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('bankName')}</TableHead>
                    <TableHead>{t('accountNumber')}</TableHead>
                    <TableHead className="text-right">{t('currentBalance')}</TableHead>
                    <TableHead>{t('currency')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(acc => {
                    const Icon = TYPE_ICONS[acc.type] || Landmark
                    return (
                      <TableRow key={acc.id} className="group">
                        <TableCell className="font-mono text-xs">{acc.accountCode}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <span className="text-sm font-medium">{acc.accountName}</span>
                              {acc.isMotherAccount && <Badge variant="secondary" className="text-[10px] px-1 ml-1">NGOAB</Badge>}
                              {acc.glAccount && (
                                <p className="text-xs text-muted-foreground"><span className="font-mono">{acc.glAccount.code}</span> {acc.glAccount.name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{t(`typeOptions.${acc.type}`)}</Badge></TableCell>
                        <TableCell className="text-sm">{acc.bankName || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{acc.accountNumber || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(Number(acc.currentBalance))}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{acc.currencyCode}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={acc.isActive ? 'default' : 'secondary'} className="text-xs">
                            {acc.isActive ? t('active') : t('inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openEdit(acc)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(val) => { if (!val) resetForm(); setSheetOpen(val) }}>
        <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editId ? t('editAccount') : t('addAccount')}</SheetTitle>
            <SheetDescription>{editId ? t('updateAccount') : t('createAccount')}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('accountCode')} *</Label>
                <Input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="BA-001" className="font-mono" disabled={!!editId} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('accountType')} *</Label>
                <SearchableSelect
                  id="account-type"
                  options={ACCOUNT_TYPES.map(ty => ({ value: ty, label: t(`typeOptions.${ty}`) }))}
                  value={formType}
                  onValueChange={v => setFormType(v as AccountType)}
                  placeholder={t('selectType')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('accountName')} *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Main Operating Account" />
            </div>

            {formType !== 'CASH' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t('bankName')}</Label>
                    <Input value={formBankName} onChange={e => setFormBankName(e.target.value)} placeholder={formType === 'MOBILE_BANKING' ? 'bKash / Nagad' : 'Sonali Bank'} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('branchName')}</Label>
                    <Input value={formBranchName} onChange={e => setFormBranchName(e.target.value)} placeholder="Mohakhali Branch" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('accountNumber')}</Label>
                  <Input value={formAccountNumber} onChange={e => setFormAccountNumber(e.target.value)} placeholder={formType === 'MOBILE_BANKING' ? '01712345678' : '1234567890'} className="font-mono" />
                </div>

                {formType !== 'MOBILE_BANKING' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{t('routingNumber')}</Label>
                      <Input value={formRoutingNumber} onChange={e => setFormRoutingNumber(e.target.value)} className="font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('swiftCode')}</Label>
                      <Input value={formSwiftCode} onChange={e => setFormSwiftCode(e.target.value)} className="font-mono" />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('currency')}</Label>
                <SearchableSelect
                  id="currency"
                  options={['BDT', 'USD', 'EUR', 'GBP'].map(c => ({ value: c, label: c }))}
                  value={formCurrency}
                  onValueChange={setFormCurrency}
                  placeholder={t('currency')}
                />
              </div>
              {!editId && (
                <div className="space-y-1.5">
                  <Label>{t('openingBalance')}</Label>
                  <Input type="number" step="0.01" value={formBalance} onChange={e => setFormBalance(e.target.value)} placeholder="0.00" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t('glAccount')}</Label>
              <SearchableSelect
                id="gl-account"
                options={[{ value: '_none', label: t('noGlAccount') }, ...glAccounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))]}
                value={formGlAccountId}
                onValueChange={setFormGlAccountId}
                placeholder={t('selectGlAccount')}
              />
              <p className="text-xs text-muted-foreground">{t('glAccountHint')}</p>
            </div>

            {['CURRENT', 'SAVINGS'].includes(formType) && (
              <div className="flex items-center justify-between py-1">
                <div>
                  <Label htmlFor="sw-mother">{t('isMotherAccount')}</Label>
                  <p className="text-xs text-muted-foreground">{t('isMotherAccountDesc')}</p>
                </div>
                <Switch id="sw-mother" checked={formIsMotherAccount} onCheckedChange={setFormIsMotherAccount} />
              </div>
            )}

            {editId && (
              <div className="flex items-center justify-between py-1">
                <Label htmlFor="sw-active">{t('status')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{formIsActive ? t('active') : t('inactive')}</span>
                  <Switch id="sw-active" checked={formIsActive} onCheckedChange={setFormIsActive} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{tc('labels.description')}</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />
            </div>

            <SheetFooter className="px-0 mt-2">
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {editId ? t('updateAccount') : t('createAccount')}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
