'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Users, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface TrustData {
  name: string
  registrationNo: string
  nbrRegistration: string
  trustBalance: number
  totalMembers: number
  totalInvestments: number
  recentTransactions: {
    id: string
    date: string
    description: string
    debit: number
    credit: number
    balance: number
  }[]
}

export default function TrustDashboardPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()

  const [data, setData] = useState<TrustData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/trust')
      .then(res => res.json())
      .then(json => { if (json.success) setData(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const trust = data || {
    name: 'PF Trust',
    registrationNo: '\u2014',
    nbrRegistration: '\u2014',
    trustBalance: 0,
    totalMembers: 0,
    totalInvestments: 0,
    recentTransactions: [],
  }

  return (
    <div className="space-y-6">
      <PageHeader title="PF Trust Fund" description="Trust fund management, registration, and transactions">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/trust/trustees')}>
            <Users className="h-4 w-4 mr-2" />Trustees
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/trust/transactions')}>
            <FileText className="h-4 w-4 mr-2" />Transactions
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Trust Balance</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(trust.trustBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold">{trust.totalMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Investments</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(trust.totalInvestments)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Trust Information</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><span className="text-muted-foreground">Trust Name:</span> <span className="font-medium">{trust.name}</span></div>
          <div><span className="text-muted-foreground">Registration No:</span> <span className="font-mono">{trust.registrationNo}</span></div>
          <div><span className="text-muted-foreground">NBR Registration:</span> <span className="font-mono">{trust.nbrRegistration}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {trust.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent transactions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Debit</th>
                    <th className="pb-2 font-medium text-right">Credit</th>
                    <th className="pb-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {trust.recentTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(txn.date)}</td>
                      <td className="py-2">{txn.description}</td>
                      <td className="py-2 text-right font-mono text-red-600">{txn.debit ? formatCurrency(txn.debit) : '\u2014'}</td>
                      <td className="py-2 text-right font-mono text-green-600">{txn.credit ? formatCurrency(txn.credit) : '\u2014'}</td>
                      <td className="py-2 text-right font-mono font-medium">{formatCurrency(txn.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
