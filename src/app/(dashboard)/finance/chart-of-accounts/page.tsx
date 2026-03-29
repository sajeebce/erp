'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, ChevronRight, ChevronDown, Loader2, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { LocalizedNameInput } from '@/components/shared/localized-name-input'

// ─── Types ───

interface AccountNode {
  id: string
  code: string
  name: string
  type: string
  nature: string
  level: number
  isGroup: boolean
  isActive: boolean
  children: AccountNode[]
}

interface AccountDetail {
  id: string
  code: string
  name: string
  localizedName: Record<string, string> | null
  type: string
  nature: string
  parentId: string | null
  level: number
  isGroup: boolean
  isActive: boolean
  isBankAccount: boolean
  description: string | null
  fundCode: string | null
  parent: { id: string; code: string; name: string } | null
  balanceSummary: { totalDebit: number; totalCredit: number; balance: number }
}

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
type AccountNature = 'DEBIT' | 'CREDIT'

interface FlatAccount {
  id: string
  code: string
  name: string
  type: string
  level: number
}

const NATURE_MAP: Record<AccountType, AccountNature> = {
  ASSET: 'DEBIT',
  EXPENSE: 'DEBIT',
  LIABILITY: 'CREDIT',
  INCOME: 'CREDIT',
  EQUITY: 'CREDIT',
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
]

// ─── Helpers ───

function flattenGroups(nodes: AccountNode[]): FlatAccount[] {
  const result: FlatAccount[] = []
  function walk(list: AccountNode[]) {
    for (const n of list) {
      if (n.isGroup && n.isActive) {
        result.push({ id: n.id, code: n.code, name: n.name, type: n.type, level: n.level })
      }
      if (n.children.length > 0) walk(n.children)
    }
  }
  walk(nodes)
  return result.sort((a, b) => a.code.localeCompare(b.code))
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

// ─── Account Row (tree node) ───

function AccountRow({
  account,
  depth = 0,
  onEdit,
}: {
  account: AccountNode
  depth?: number
  onEdit: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = account.children.length > 0

  return (
    <>
      <div
        className="group flex items-center py-2.5 px-4 hover:bg-muted/50 border-b border-muted/30 transition-colors"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => hasChildren ? setExpanded(!expanded) : onEdit(account.id)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <div className="w-4" />
          )}
          <span className="font-mono text-xs text-muted-foreground w-12">{account.code}</span>
          <span className={`text-sm ${account.isGroup ? 'font-semibold' : ''} truncate`}>{account.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground uppercase">{account.type}</span>
          {!account.isActive && <StatusBadge status="INACTIVE" />}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onEdit(account.id) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {expanded && account.children.map(child => (
        <AccountRow key={child.id} account={child} depth={depth + 1} onEdit={onEdit} />
      ))}
    </>
  )
}

// ─── Account Sheet (Create + Edit) ───

function AccountSheet({
  open,
  onOpenChange,
  groups,
  onSuccess,
  supportedLanguages,
  editId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: FlatAccount[]
  onSuccess: () => void
  supportedLanguages: string[]
  editId: string | null
}) {
  const t = useTranslations('finance.chartOfAccounts')
  const tc = useTranslations('common')
  const isEdit = !!editId

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [localizedNameValues, setLocalizedNameValues] = useState<Record<string, string>>({})
  const [type, setType] = useState<AccountType | ''>('')
  const [nature, setNature] = useState<AccountNature | ''>('')
  const [parentId, setParentId] = useState('')
  const [isGroup, setIsGroup] = useState(false)
  const [isBankAccount, setIsBankAccount] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [description, setDescription] = useState('')
  const [fundCode, setFundCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<AccountDetail | null>(null)

  function reset() {
    setCode('')
    setName('')
    setLocalizedNameValues({})
    setType('')
    setNature('')
    setParentId('')
    setIsGroup(false)
    setIsBankAccount(false)
    setIsActive(true)
    setDescription('')
    setFundCode('')
    setError('')
    setDetail(null)
  }

  // Fetch account detail when editing
  useEffect(() => {
    if (!open || !editId) return
    setFetching(true)
    fetch(`/api/v1/finance/accounts/${editId}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data as AccountDetail
          setDetail(d)
          setCode(d.code)
          setName(d.name)
          setLocalizedNameValues((d.localizedName as Record<string, string>) || {})
          setType(d.type as AccountType)
          setNature(d.nature as AccountNature)
          setParentId(d.parentId || '_none')
          setIsGroup(d.isGroup)
          setIsBankAccount(d.isBankAccount)
          setIsActive(d.isActive)
          setDescription(d.description || '')
          setFundCode(d.fundCode || '')
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false))
  }, [open, editId])

  function handleTypeChange(val: AccountType) {
    setType(val)
    setNature(NATURE_MAP[val])
  }

  function handleParentChange(val: string) {
    setParentId(val)
    if (val && val !== '_none') {
      const parent = groups.find(g => g.id === val)
      if (parent) {
        const parentType = parent.type as AccountType
        setType(parentType)
        setNature(NATURE_MAP[parentType])
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !name.trim() || !type || !nature) {
      setError(t('codeRequired'))
      return
    }

    setError('')
    setLoading(true)

    try {
      const localizedName: Record<string, string> = {}
      for (const [locale, value] of Object.entries(localizedNameValues)) {
        if (value.trim()) localizedName[locale] = value.trim()
      }
      if (!localizedName[supportedLanguages[0] || 'en']) {
        localizedName[supportedLanguages[0] || 'en'] = name.trim()
      }

      let res
      if (isEdit) {
        // Only send editable fields
        res = await fetch(`/api/v1/finance/accounts/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            localizedName,
            description: description.trim() || null,
            fundCode: fundCode.trim() || null,
            isActive,
          }),
        })
      } else {
        const payload: Record<string, unknown> = {
          code: code.trim(),
          name: name.trim(),
          localizedName,
          type,
          nature,
          isGroup,
        }
        if (parentId && parentId !== '_none') payload.parentId = parentId
        if (!isGroup && isBankAccount) payload.isBankAccount = true
        if (description.trim()) payload.description = description.trim()
        if (fundCode.trim()) payload.fundCode = fundCode.trim()

        res = await fetch('/api/v1/finance/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || (isEdit ? t('failedToUpdate') : t('failedToCreate')))
        return
      }

      reset()
      onOpenChange(false)
      onSuccess()
    } catch {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = type
    ? groups.filter(g => g.type === type)
    : groups

  const hasTransactions = detail && (detail.balanceSummary.totalDebit > 0 || detail.balanceSummary.totalCredit > 0)

  return (
    <Sheet open={open} onOpenChange={(val) => { if (!val) reset(); onOpenChange(val) }}>
      <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('editAccount') : t('addAccount')}</SheetTitle>
          <SheetDescription>
            {isEdit ? t('editAccountDesc') : t('createLedgerAccount')}
          </SheetDescription>
        </SheetHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-4 flex-1">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Balance summary (edit mode only) */}
            {isEdit && detail && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('totalDebit')}</span>
                  <span className="font-mono">{formatCurrency(detail.balanceSummary.totalDebit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('totalCredit')}</span>
                  <span className="font-mono">{formatCurrency(detail.balanceSummary.totalCredit)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-1.5">
                  <span>{t('balance')}</span>
                  <span className="font-mono">{formatCurrency(detail.balanceSummary.balance)}</span>
                </div>
              </div>
            )}

            {/* Account Code — read-only in edit mode */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-code">{t('code')} <span className="text-destructive">*</span></Label>
              <Input
                id="acc-code"
                placeholder="1000"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="font-mono"
                required
                disabled={isEdit}
              />
              {isEdit && <p className="text-xs text-muted-foreground">{t('codeNotEditable')}</p>}
            </div>

            {/* Localized Account Name */}
            <LocalizedNameInput
              label={t('accountName')}
              locales={supportedLanguages}
              values={localizedNameValues}
              onChange={(locale, value) => {
                const updated = { ...localizedNameValues, [locale]: value }
                setLocalizedNameValues(updated)
                if (locale === supportedLanguages[0]) {
                  setName(value)
                }
              }}
              required
            />

            {/* Account Type & Nature — read-only in edit mode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('accountType')} <span className="text-destructive">*</span></Label>
                {isEdit ? (
                  <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm">{type}</div>
                ) : (
                  <Select value={type} onValueChange={(val) => handleTypeChange(val as AccountType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{t('normalBalance')}</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                  {nature || t('autoSetByType')}
                </div>
              </div>
            </div>

            {isEdit && <p className="text-xs text-muted-foreground -mt-3">{t('typeNotEditable')}</p>}

            {/* Parent Account — read-only in edit mode */}
            <div className="space-y-1.5">
              <Label>{t('parentAccount')}</Label>
              {isEdit ? (
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                  {detail?.parent ? (
                    <><span className="font-mono text-xs mr-1.5">{detail.parent.code}</span>{detail.parent.name}</>
                  ) : (
                    t('noneRootLevel')
                  )}
                </div>
              ) : (
                <>
                  <Select value={parentId} onValueChange={handleParentChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('noneRootLevel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{t('noneRootLevel')}</SelectItem>
                      {filteredGroups.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          <span className="font-mono text-xs text-muted-foreground mr-1.5">{g.code}</span>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {type && filteredGroups.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t('noGroupOfType', { type })}</p>
                  )}
                </>
              )}
            </div>

            {/* Switches */}
            <div className="space-y-3">
              {!isEdit && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sw-group">{t('groupAccount')}</Label>
                      <p className="text-xs text-muted-foreground">{t('groupAccountDesc')}</p>
                    </div>
                    <Switch id="sw-group" checked={isGroup} onCheckedChange={(val) => { setIsGroup(val); if (val) setIsBankAccount(false) }} />
                  </div>
                  {!isGroup && (
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sw-bank">{t('bankCashAccount')}</Label>
                        <p className="text-xs text-muted-foreground">{t('bankCashAccountDesc')}</p>
                      </div>
                      <Switch id="sw-bank" checked={isBankAccount} onCheckedChange={setIsBankAccount} />
                    </div>
                  )}
                </>
              )}
              {isEdit && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sw-active">{t('activeStatus')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {hasTransactions ? t('hasTransactionsWarning') : t('activeStatusDesc')}
                    </p>
                  </div>
                  <Switch id="sw-active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              )}
            </div>

            {/* Fund Code */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-fund">{t('fundCode')}</Label>
              <Input
                id="acc-fund"
                placeholder="e.g. USAID, DFID (optional)"
                value={fundCode}
                onChange={e => setFundCode(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-desc">{t('description')}</Label>
              <Textarea
                id="acc-desc"
                placeholder={t('descriptionPlaceholder')}
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Footer */}
            <SheetFooter className="mt-2 px-0">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? tc('buttons.save') : t('createAccount')}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Page ───

export default function ChartOfAccountsPage() {
  const t = useTranslations('finance.chartOfAccounts')
  const [tree, setTree] = useState<AccountNode[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['en'])

  const fetchTree = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/finance/accounts/tree')
      .then(res => res.json())
      .then(json => { if (json.success) setTree(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fetchOrgLanguages = useCallback(() => {
    fetch('/api/v1/settings/organization')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.supportedLanguages?.length) {
          setSupportedLanguages(json.data.supportedLanguages)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => { fetchTree(); fetchOrgLanguages() }, [fetchTree, fetchOrgLanguages])

  function handleEdit(id: string) {
    setEditId(id)
    setSheetOpen(true)
  }

  function handleAdd() {
    setEditId(null)
    setSheetOpen(true)
  }

  const groupAccounts = flattenGroups(tree)

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('hierarchicalDescription')}>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />{t('addAccount')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="py-3 border-b">
          <div className="flex items-center px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className="flex-1">{t('account')}</span>
            <span>{t('type')}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{t('loadingAccounts')}</div>
          ) : tree.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t('noAccountsFound')}</div>
          ) : (
            tree.map(account => <AccountRow key={account.id} account={account} onEdit={handleEdit} />)
          )}
        </CardContent>
      </Card>

      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        groups={groupAccounts}
        onSuccess={fetchTree}
        supportedLanguages={supportedLanguages}
        editId={editId}
      />
    </div>
  )
}
