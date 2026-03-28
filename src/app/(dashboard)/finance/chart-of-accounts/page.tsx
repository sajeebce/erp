'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
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

// ─── Account Row (tree node) ───

function AccountRow({ account, depth = 0 }: { account: AccountNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = account.children.length > 0

  return (
    <>
      <div
        className="flex items-center py-2.5 px-4 hover:bg-muted/50 border-b border-muted/30 cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <div className="w-4" />
          )}
          <span className="font-mono text-xs text-muted-foreground w-12">{account.code}</span>
          <span className={`text-sm ${account.isGroup ? 'font-semibold' : ''} truncate`}>{account.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground uppercase">{account.type}</span>
          {!account.isActive && <StatusBadge status="INACTIVE" />}
        </div>
      </div>
      {expanded && account.children.map(child => (
        <AccountRow key={child.id} account={child} depth={depth + 1} />
      ))}
    </>
  )
}

// ─── Add Account Sheet ───

function AddAccountSheet({
  open,
  onOpenChange,
  groups,
  onSuccess,
  supportedLanguages,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: FlatAccount[]
  onSuccess: () => void
  supportedLanguages: string[]
}) {
  const t = useTranslations('finance.chartOfAccounts')
  const tc = useTranslations('common')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [localizedNameValues, setLocalizedNameValues] = useState<Record<string, string>>({})
  const [type, setType] = useState<AccountType | ''>('')
  const [nature, setNature] = useState<AccountNature | ''>('')
  const [parentId, setParentId] = useState('')
  const [isGroup, setIsGroup] = useState(false)
  const [isBankAccount, setIsBankAccount] = useState(false)
  const [description, setDescription] = useState('')
  const [fundCode, setFundCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setCode('')
    setName('')
    setLocalizedNameValues({})
    setType('')
    setNature('')
    setParentId('')
    setIsGroup(false)
    setIsBankAccount(false)
    setDescription('')
    setFundCode('')
    setError('')
  }

  function handleTypeChange(val: AccountType) {
    setType(val)
    setNature(NATURE_MAP[val])
  }

  function handleParentChange(val: string) {
    setParentId(val)
    // If parent selected, auto-set type to match parent
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
      const payload: Record<string, unknown> = {
        code: code.trim(),
        name: name.trim(),
        type,
        nature,
        isGroup,
      }
      const localizedName: Record<string, string> = {}
      for (const [locale, value] of Object.entries(localizedNameValues)) {
        if (value.trim()) localizedName[locale] = value.trim()
      }
      if (!localizedName[supportedLanguages[0] || 'en']) {
        localizedName[supportedLanguages[0] || 'en'] = name.trim()
      }
      payload.localizedName = localizedName
      if (parentId && parentId !== '_none') payload.parentId = parentId
      if (!isGroup && isBankAccount) payload.isBankAccount = true
      if (description.trim()) payload.description = description.trim()
      if (fundCode.trim()) payload.fundCode = fundCode.trim()

      const res = await fetch('/api/v1/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || t('failedToCreate'))
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

  // Filter parent options to only show same-type groups (or all if no type selected)
  const filteredGroups = type
    ? groups.filter(g => g.type === type)
    : groups

  return (
    <Sheet open={open} onOpenChange={(val) => { if (!val) reset(); onOpenChange(val) }}>
      <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('addAccount')}</SheetTitle>
          <SheetDescription>{t('createLedgerAccount')}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-4 flex-1">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Account Code */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-code">{t('code')} <span className="text-destructive">*</span></Label>
            <Input
              id="acc-code"
              placeholder="1000"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="font-mono"
              required
            />
          </div>

          {/* Localized Account Name */}
          <LocalizedNameInput
            label={t('accountName')}
            locales={supportedLanguages}
            values={localizedNameValues}
            onChange={(locale, value) => {
              const updated = { ...localizedNameValues, [locale]: value }
              setLocalizedNameValues(updated)
              // Sync primary name
              if (locale === supportedLanguages[0]) {
                setName(value)
              }
            }}
            required
          />

          {/* Account Type & Nature */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('accountType')} <span className="text-destructive">*</span></Label>
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
            </div>
            <div className="space-y-1.5">
              <Label>{t('normalBalance')}</Label>
              <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                {nature || t('autoSetByType')}
              </div>
            </div>
          </div>

          {/* Parent Account */}
          <div className="space-y-1.5">
            <Label>{t('parentAccount')}</Label>
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
          </div>

          {/* Switches */}
          <div className="space-y-3">
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
              placeholder="Account purpose or notes (optional)"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Footer */}
          <SheetFooter className="mt-2 px-0">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createAccount')}
            </Button>
          </SheetFooter>
        </form>
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

  const groupAccounts = flattenGroups(tree)

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('hierarchicalDescription')}>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
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
            tree.map(account => <AccountRow key={account.id} account={account} />)
          )}
        </CardContent>
      </Card>

      <AddAccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        groups={groupAccounts}
        onSuccess={fetchTree}
        supportedLanguages={supportedLanguages}
      />
    </div>
  )
}
