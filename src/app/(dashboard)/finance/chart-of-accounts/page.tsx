'use client'

import { useEffect, useState } from 'react'
import { Plus, ChevronRight, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'

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

export default function ChartOfAccountsPage() {
  const [tree, setTree] = useState<AccountNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/finance/accounts/tree')
      .then(res => res.json())
      .then(json => { if (json.success) setTree(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Chart of Accounts" description="Hierarchical account structure for your organization">
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Account</Button>
      </PageHeader>

      <Card>
        <CardHeader className="py-3 border-b">
          <div className="flex items-center px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className="flex-1">Account</span>
            <span>Type</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading accounts...</div>
          ) : tree.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No accounts found. Create your first account.</div>
          ) : (
            tree.map(account => <AccountRow key={account.id} account={account} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
