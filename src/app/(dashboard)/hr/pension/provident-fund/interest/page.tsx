'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Calculator, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'

interface InterestPosting {
  id: string
  periodStart: string
  periodEnd: string
  totalInterest: number
  memberCount: number
  status: string
  postedAt: string
}

interface PreviewItem {
  employeeName: string
  balance: number
  interestAmount: number
}

export default function PFInterestPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [postings, setPostings] = useState<InterestPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [postLoading, setPostLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewItem[] | null>(null)
  const [error, setError] = useState('')

  const now = new Date()
  const [periodStart, setPeriodStart] = useState(`${now.getFullYear() - 1}-07-01`)
  const [periodEnd, setPeriodEnd] = useState(`${now.getFullYear()}-06-30`)

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/interest/postings?limit=50')
      .then(res => res.json())
      .then(json => { if (json.success) setPostings(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handlePreview() {
    setPreviewLoading(true)
    setError('')
    setPreviewData(null)
    try {
      const res = await fetch(`/api/v1/hr/provident-fund/interest/preview?periodStart=${periodStart}&periodEnd=${periodEnd}`)
      const json = await res.json()
      if (json.success) setPreviewData(json.data)
      else setError(json.error || 'Failed to calculate preview')
    } catch {
      setError('Failed to calculate preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handlePostInterest() {
    if (!confirm('Are you sure you want to post interest for this period? This action cannot be undone.')) return
    setPostLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/hr/provident-fund/interest/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart, periodEnd }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setPostings(prev => [json.data, ...prev])
        setPreviewData(null)
      } else {
        setError(json.error || 'Failed to post interest')
      }
    } catch {
      setError('Failed to post interest')
    } finally {
      setPostLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Interest Posting" description="Calculate and post annual interest on PF balances" />

      <Card>
        <CardHeader><CardTitle>Calculate Annual Interest</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
            <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            <Button onClick={handlePostInterest} disabled={postLoading}>
              {postLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
              Post Interest
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Interest Preview ({previewData.length} members, Total: {formatCurrency(previewData.reduce((s, i) => s + i.interestAmount, 0))})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 font-medium text-right">Balance</th>
                    <th className="pb-2 font-medium text-right">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.employeeName}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(item.balance)}</td>
                      <td className="py-2 text-right font-mono text-green-600">{formatCurrency(item.interestAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Posting History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : postings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No interest postings found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium text-right">Total Interest</th>
                    <th className="pb-2 font-medium text-right">Members</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Posted At</th>
                  </tr>
                </thead>
                <tbody>
                  {postings.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(p.periodStart)} - {formatDate(p.periodEnd)}</td>
                      <td className="py-2 text-right font-mono font-medium">{formatCurrency(p.totalInterest)}</td>
                      <td className="py-2 text-right font-mono">{p.memberCount}</td>
                      <td className="py-2"><StatusBadge status={p.status} /></td>
                      <td className="py-2">{formatDate(p.postedAt)}</td>
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
