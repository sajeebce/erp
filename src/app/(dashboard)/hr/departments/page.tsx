'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Department {
  id: string
  name: string
  code: string
  parentId?: string | null
  headId?: string | null
  headName?: string | null
  isActive: boolean
  _count?: { employees: number }
}

const emptyForm = {
  name: '',
  code: '',
  parentId: '',
  isActive: true,
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchDepartments = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/hr/departments')
      .then((res) => res.json())
      .then((json) => { if (json.success) setDepartments(json.data) })
      .catch(() => setError('Failed to load departments'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setDialogOpen(true)
  }

  function openEdit(department: Department) {
    setEditing(department)
    setForm({
      name: department.name,
      code: department.code,
      parentId: department.parentId || '',
      isActive: department.isActive,
    })
    setError('')
    setDialogOpen(true)
  }

  async function saveDepartment() {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Department name and code are required')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(editing ? `/api/v1/hr/departments/${editing.id}` : '/api/v1/hr/departments', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim(),
          parentId: form.parentId || null,
          isActive: form.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.error || 'Failed to save department')
        return
      }
      setDialogOpen(false)
      fetchDepartments()
    } catch {
      setError('Failed to save department')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Departments" description="Manage HR departments used by recruitment, employees, budgets, and org chart">
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Department
        </Button>
      </PageHeader>

      {error && !dialogOpen && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Head</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading departments...</TableCell></TableRow>
              ) : departments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No departments found</TableCell></TableRow>
              ) : departments.map((department) => {
                const parent = departments.find((item) => item.id === department.parentId)
                return (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.code}</TableCell>
                    <TableCell>{parent?.name || '-'}</TableCell>
                    <TableCell>{department.headName || '-'}</TableCell>
                    <TableCell className="text-right">{department._count?.employees || 0}</TableCell>
                    <TableCell>{department.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(department)} aria-label={`Edit ${department.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department-name">Department name</Label>
                <Input id="department-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-code">Department code</Label>
                <Input id="department-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department-parent">Parent department</Label>
              <select
                id="department-parent"
                value={form.parentId}
                onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">No parent department</option>
                {departments
                  .filter((department) => department.id !== editing?.id)
                  .map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="department-active">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive departments are hidden from new job posting selections.</p>
              </div>
              <Switch id="department-active" checked={form.isActive} onCheckedChange={(isActive) => setForm((current) => ({ ...current, isActive }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDepartment} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
