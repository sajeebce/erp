'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, BriefcaseBusiness, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface Designation {
  id: string
  title: string
  level?: number | null
  isActive: boolean
  _count?: { employees: number }
}

const emptyDepartmentForm = {
  name: '',
  code: '',
  parentId: '',
  isActive: true,
}

const emptyDesignationForm = {
  title: '',
  level: '',
  isActive: true,
}

export default function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState('departments')
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [designationsLoading, setDesignationsLoading] = useState(true)
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm)
  const [designationForm, setDesignationForm] = useState(emptyDesignationForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchDepartments = useCallback(() => {
    setDepartmentsLoading(true)
    fetch('/api/v1/hr/departments')
      .then((res) => res.json())
      .then((json) => { if (json.success) setDepartments(json.data) })
      .catch(() => setError('Failed to load departments'))
      .finally(() => setDepartmentsLoading(false))
  }, [])

  const fetchDesignations = useCallback(() => {
    setDesignationsLoading(true)
    fetch('/api/v1/hr/designations')
      .then((res) => res.json())
      .then((json) => { if (json.success) setDesignations(json.data) })
      .catch(() => setError('Failed to load designations'))
      .finally(() => setDesignationsLoading(false))
  }, [])

  useEffect(() => {
    fetchDepartments()
    fetchDesignations()
  }, [fetchDepartments, fetchDesignations])

  function openCreateDepartment() {
    setEditingDepartment(null)
    setDepartmentForm(emptyDepartmentForm)
    setError('')
    setDepartmentDialogOpen(true)
  }

  function openEditDepartment(department: Department) {
    setEditingDepartment(department)
    setDepartmentForm({
      name: department.name,
      code: department.code,
      parentId: department.parentId || '',
      isActive: department.isActive,
    })
    setError('')
    setDepartmentDialogOpen(true)
  }

  function openCreateDesignation() {
    setEditingDesignation(null)
    setDesignationForm(emptyDesignationForm)
    setError('')
    setDesignationDialogOpen(true)
  }

  function openEditDesignation(designation: Designation) {
    setEditingDesignation(designation)
    setDesignationForm({
      title: designation.title,
      level: designation.level ? String(designation.level) : '',
      isActive: designation.isActive,
    })
    setError('')
    setDesignationDialogOpen(true)
  }

  async function saveDepartment() {
    if (!departmentForm.name.trim() || !departmentForm.code.trim()) {
      setError('Department name and code are required')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(editingDepartment ? `/api/v1/hr/departments/${editingDepartment.id}` : '/api/v1/hr/departments', {
        method: editingDepartment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: departmentForm.name.trim(),
          code: departmentForm.code.trim(),
          parentId: departmentForm.parentId || null,
          isActive: departmentForm.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.error || 'Failed to save department')
        return
      }
      setDepartmentDialogOpen(false)
      fetchDepartments()
    } catch {
      setError('Failed to save department')
    } finally {
      setSaving(false)
    }
  }

  async function saveDesignation() {
    if (!designationForm.title.trim()) {
      setError('Designation title is required')
      return
    }

    const level = designationForm.level.trim() ? Number(designationForm.level) : null
    if (level !== null && (!Number.isInteger(level) || level < 1)) {
      setError('Hierarchy level must be a positive whole number')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(editingDesignation ? `/api/v1/hr/designations/${editingDesignation.id}` : '/api/v1/hr/designations', {
        method: editingDesignation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: designationForm.title.trim(),
          level,
          isActive: designationForm.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.error || 'Failed to save designation')
        return
      }
      setDesignationDialogOpen(false)
      fetchDesignations()
    } catch {
      setError('Failed to save designation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments & Designations"
        description="Manage HR departments and job designations used in recruitment, employees, payroll, and org chart."
      />

      {error && !departmentDialogOpen && !designationDialogOpen && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">
            <Building2 className="h-4 w-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="designations">
            <BriefcaseBusiness className="h-4 w-4" /> Designations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Departments</h2>
              <p className="text-sm text-muted-foreground">Create teams, units, and sub-departments for HR records and job postings.</p>
            </div>
            <Button size="sm" onClick={openCreateDepartment}>
              <Plus className="h-4 w-4 mr-2" /> Add Department
            </Button>
          </div>

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
                  {departmentsLoading ? (
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
                          <Button variant="ghost" size="icon" onClick={() => openEditDepartment(department)} aria-label={`Edit ${department.name}`}>
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
        </TabsContent>

        <TabsContent value="designations" className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Designations</h2>
              <p className="text-sm text-muted-foreground">Create job titles such as HR Officer, Accountant, Program Manager, or Field Coordinator.</p>
            </div>
            <Button size="sm" onClick={openCreateDesignation}>
              <Plus className="h-4 w-4 mr-2" /> Add Designation
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Designation title</TableHead>
                    <TableHead>Hierarchy level</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designationsLoading ? (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading designations...</TableCell></TableRow>
                  ) : designations.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No designations found</TableCell></TableRow>
                  ) : designations.map((designation) => (
                    <TableRow key={designation.id}>
                      <TableCell className="font-medium">{designation.title}</TableCell>
                      <TableCell>{designation.level || '-'}</TableCell>
                      <TableCell className="text-right">{designation._count?.employees || 0}</TableCell>
                      <TableCell>{designation.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditDesignation(designation)} aria-label={`Edit ${designation.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add Department'}</DialogTitle>
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
                <Input id="department-name" value={departmentForm.name} onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-code">Department code</Label>
                <Input id="department-code" value={departmentForm.code} onChange={(event) => setDepartmentForm((current) => ({ ...current, code: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department-parent">Parent department</Label>
              <select
                id="department-parent"
                value={departmentForm.parentId}
                onChange={(event) => setDepartmentForm((current) => ({ ...current, parentId: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">No parent department</option>
                {departments
                  .filter((department) => department.id !== editingDepartment?.id)
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
              <Switch id="department-active" checked={departmentForm.isActive} onCheckedChange={(isActive) => setDepartmentForm((current) => ({ ...current, isActive }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepartmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDepartment} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={designationDialogOpen} onOpenChange={setDesignationDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDesignation ? 'Edit Designation' : 'Add Designation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="designation-title">Designation title</Label>
              <Input
                id="designation-title"
                value={designationForm.title}
                onChange={(event) => setDesignationForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Example: HR Officer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation-level">Hierarchy level</Label>
              <Input
                id="designation-level"
                type="number"
                min="1"
                value={designationForm.level}
                onChange={(event) => setDesignationForm((current) => ({ ...current, level: event.target.value }))}
                placeholder="Example: 3"
              />
              <p className="text-xs text-muted-foreground">Lower level numbers appear higher in the org structure.</p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="designation-active">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive designations stay in history but should not be used for new employees.</p>
              </div>
              <Switch id="designation-active" checked={designationForm.isActive} onCheckedChange={(isActive) => setDesignationForm((current) => ({ ...current, isActive }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesignationDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDesignation} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
