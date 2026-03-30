'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

interface Nominee {
  id: string
  name: string
  relationship: string
  percentage: number
  nidNumber: string
  phone: string
  address: string
}

export default function ManageNomineesPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [nominees, setNominees] = useState<Nominee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formRelationship, setFormRelationship] = useState('')
  const [formPercentage, setFormPercentage] = useState('')
  const [formNid, setFormNid] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAddress, setFormAddress] = useState('')

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/hr/provident-fund/enrollments/${params.id}/nominees`)
      .then(res => res.json())
      .then(json => { if (json.success) setNominees(json.data) })
      .catch(() => setError('Failed to load nominees'))
      .finally(() => setLoading(false))
  }, [params.id])

  const totalPercentage = nominees.reduce((sum, n) => sum + n.percentage, 0)

  function resetForm() {
    setFormName('')
    setFormRelationship('')
    setFormPercentage('')
    setFormNid('')
    setFormPhone('')
    setFormAddress('')
    setEditId(null)
    setShowForm(false)
  }

  function startEdit(nominee: Nominee) {
    setEditId(nominee.id)
    setFormName(nominee.name)
    setFormRelationship(nominee.relationship)
    setFormPercentage(String(nominee.percentage))
    setFormNid(nominee.nidNumber || '')
    setFormPhone(nominee.phone || '')
    setFormAddress(nominee.address || '')
    setShowForm(true)
  }

  async function handleSaveNominee() {
    if (!formName.trim() || !formRelationship.trim() || !formPercentage) {
      setError('Name, relationship, and percentage are required')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      name: formName.trim(),
      relationship: formRelationship.trim(),
      percentage: parseFloat(formPercentage),
      nidNumber: formNid.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
    }

    try {
      const url = editId
        ? `/api/v1/hr/provident-fund/enrollments/${params.id}/nominees/${editId}`
        : `/api/v1/hr/provident-fund/enrollments/${params.id}/nominees`
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        if (editId) {
          setNominees(prev => prev.map(n => n.id === editId ? json.data : n))
        } else {
          setNominees(prev => [...prev, json.data])
        }
        resetForm()
      } else {
        setError(json.error || 'Failed to save nominee')
      }
    } catch {
      setError('Failed to save nominee')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(nomineeId: string) {
    if (!confirm('Are you sure you want to remove this nominee?')) return
    try {
      const res = await fetch(`/api/v1/hr/provident-fund/enrollments/${params.id}/nominees/${nomineeId}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        setNominees(prev => prev.filter(n => n.id !== nomineeId))
      } else {
        setError(json.error || 'Failed to delete nominee')
      }
    } catch {
      setError('Failed to delete nominee')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Nominees" description="Add, edit, or remove PF nominees. Total shares must equal 100%.">
        <Button variant="outline" size="sm" onClick={() => router.push(`/hr/pension/provident-fund/enrollments/${params.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Nominees ({totalPercentage}% allocated)</CardTitle>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />Add Nominee
              </Button>
            )}
          </div>
          {totalPercentage !== 100 && nominees.length > 0 && (
            <p className="text-sm text-orange-600">Warning: Total nominee share is {totalPercentage}%, should be 100%</p>
          )}
        </CardHeader>
        <CardContent>
          {nominees.length === 0 && !showForm ? (
            <p className="text-sm text-muted-foreground text-center py-6">No nominees added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Relationship</th>
                    <th className="pb-2 font-medium text-right">Share (%)</th>
                    <th className="pb-2 font-medium">NID</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nominees.map((n) => (
                    <tr key={n.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{n.name}</td>
                      <td className="py-2">{n.relationship}</td>
                      <td className="py-2 text-right font-mono">{n.percentage}%</td>
                      <td className="py-2 font-mono text-sm">{n.nidNumber || '\u2014'}</td>
                      <td className="py-2">{n.phone || '\u2014'}</td>
                      <td className="py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(n)}>{tc('buttons.edit')}</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(n.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
          <CardHeader><CardTitle>{editId ? 'Edit Nominee' : 'Add Nominee'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Relationship *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formRelationship} onChange={(e) => setFormRelationship(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="CHILD">Child</option>
                  <option value="PARENT">Parent</option>
                  <option value="SIBLING">Sibling</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Share (%) *</Label>
                <Input type="number" min="0" max="100" value={formPercentage} onChange={(e) => setFormPercentage(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>NID Number</Label>
                <Input value={formNid} onChange={(e) => setFormNid(e.target.value)} placeholder="National ID" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Address" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={resetForm} disabled={saving}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSaveNominee} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : editId ? 'Update Nominee' : 'Add Nominee'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
