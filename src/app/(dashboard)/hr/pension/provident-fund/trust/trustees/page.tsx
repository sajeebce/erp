'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Trustee {
  id: string
  name: string
  role: string
  appointedDate: string
  isActive: boolean
}

export default function TrusteesPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatDate } = useFormatters()

  const [trustees, setTrustees] = useState<Trustee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('MEMBER')
  const [formAppointedDate, setFormAppointedDate] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/pf/trust/trustees')
      .then(res => res.json())
      .then(json => { if (json.success) setTrustees(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setFormName('')
    setFormRole('MEMBER')
    setFormAppointedDate('')
    setFormIsActive(true)
    setEditId(null)
    setShowForm(false)
  }

  function startEdit(trustee: Trustee) {
    setEditId(trustee.id)
    setFormName(trustee.name)
    setFormRole(trustee.role)
    setFormAppointedDate(trustee.appointedDate?.split('T')[0] || '')
    setFormIsActive(trustee.isActive)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formAppointedDate) {
      setError('Name and appointed date are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editId
        ? `/api/v1/hr/pf/trust/trustees/${editId}`
        : '/api/v1/hr/pf/trust/trustees'
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), role: formRole, appointedDate: formAppointedDate, isActive: formIsActive }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        if (editId) {
          setTrustees(prev => prev.map(t => t.id === editId ? json.data : t))
        } else {
          setTrustees(prev => [...prev, json.data])
        }
        resetForm()
      } else {
        setError(json.error || 'Failed to save trustee')
      }
    } catch {
      setError('Failed to save trustee')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Trustees" description="PF trust board of trustees">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/trust')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Trustee
            </Button>
          )}
        </div>
      </PageHeader>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Trustees</CardTitle></CardHeader>
        <CardContent>
          {trustees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No trustees found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Appointed Date</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trustees.map((tr) => (
                    <tr key={tr.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{tr.name}</td>
                      <td className="py-2"><StatusBadge status={tr.role} /></td>
                      <td className="py-2">{formatDate(tr.appointedDate)}</td>
                      <td className="py-2"><StatusBadge status={tr.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(tr)}>{tc('buttons.edit')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editId ? 'Edit Trustee' : 'Add Trustee'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Trustee name" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="CHAIRMAN">Chairman</option>
                  <option value="SECRETARY">Secretary</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="MEMBER">Member</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Appointed Date *</Label>
                <Input type="date" value={formAppointedDate} onChange={(e) => setFormAppointedDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} className="h-4 w-4" />
                <Label>Active</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={resetForm} disabled={saving}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : editId ? 'Update Trustee' : 'Add Trustee'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
