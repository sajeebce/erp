'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'

const REQUIRED_DOCUMENTS = [
  { type: 'NID_COPY', label: 'NID / Birth Certificate', required: true },
  { type: 'PHOTO', label: 'Passport-size Photos', required: true },
  { type: 'EDUCATIONAL_CERT', label: 'Educational Certificates', required: true },
  { type: 'EXPERIENCE_CERT', label: 'Experience Certificates', required: false },
  { type: 'TIN_CERTIFICATE', label: 'TIN Certificate', required: true },
  { type: 'MEDICAL_FITNESS', label: 'Medical Fitness Certificate', required: false },
  { type: 'BANK_ACCOUNT', label: 'Bank Account Details', required: true },
  { type: 'NOMINEE_FORM', label: 'Nominee Declaration Form', required: true },
  { type: 'EMERGENCY_CONTACT', label: 'Emergency Contact Form', required: true },
  { type: 'SIGNED_CONTRACT', label: 'Signed Employment Contract', required: true },
  { type: 'POLICY_ACKNOWLEDGMENT', label: 'Policy Handbook Acknowledgment', required: true },
  { type: 'NGOAB_FD4_NOTIFICATION', label: 'NGOAB FD-4 Notification', required: true },
]

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const
const STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'] as const

interface Department { id: string; name: string; code?: string }
interface Designation { id: string; title: string; level?: number }
interface Employee {
  id: string
  employeeNo: string
  fullName: string
  localizedName?: string | null
  fatherName?: string | null
  motherName?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  maritalStatus?: string | null
  nidNumber?: string | null
  phone?: string | null
  email?: string | null
  emergencyContact?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  departmentId: string
  designationId: string
  employmentType: string
  joiningDate: string
  confirmationDate?: string | null
  endDate?: string | null
  status: string
  basicSalary?: string | number | null
  bankName?: string | null
  bankAccountNo?: string | null
  tinNumber?: string | null
  notes?: string | null
  department?: Department
  designation?: Designation
  reportingTo?: { id: string; fullName: string; employeeNo: string } | null
  directReports?: { id: string; fullName: string; employeeNo: string }[]
  createdAt: string
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [status, setStatus] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [presentAddress, setPresentAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [notes, setNotes] = useState('')

  // Documents
  const [employeeDocuments, setEmployeeDocuments] = useState<{ type: string; uploadedAt: string }[]>([])

  // Lookup data
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [departmentId, setDepartmentId] = useState('')
  const [designationId, setDesignationId] = useState('')

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/employees/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setEmployee(json.data)
          populateForm(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))

    fetch(`/api/v1/hr/employees/${params.id}/documents`)
      .then(res => res.json())
      .then(json => { if (json.success) setEmployeeDocuments(json.data) })
      .catch(() => {})

    fetch('/api/v1/hr/departments')
      .then(res => res.json())
      .then(json => { if (json.success) setDepartments(json.data) })
      .catch(() => {})

    fetch('/api/v1/hr/designations')
      .then(res => res.json())
      .then(json => { if (json.success) setDesignations(json.data) })
      .catch(() => {})
  }, [params.id, tc])

  function populateForm(emp: Employee) {
    setFullName(emp.fullName)
    setPhone(emp.phone || '')
    setEmail(emp.email || '')
    setEmploymentType(emp.employmentType)
    setStatus(emp.status)
    setBasicSalary(emp.basicSalary != null ? String(emp.basicSalary) : '')
    setPresentAddress(emp.presentAddress || '')
    setEmergencyContact(emp.emergencyContact || '')
    setNotes(emp.notes || '')
    setDepartmentId(emp.departmentId)
    setDesignationId(emp.designationId)
  }

  function handleCancel() {
    if (employee) populateForm(employee)
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setError(t('form.requiredFields'))
      return
    }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      fullName: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      employmentType,
      status,
      basicSalary: basicSalary ? parseFloat(basicSalary) : null,
      presentAddress: presentAddress.trim() || null,
      emergencyContact: emergencyContact.trim() || null,
      notes: notes.trim() || null,
      departmentId,
      designationId,
    }

    try {
      const res = await fetch(`/api/v1/hr/employees/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEmployee(json.data)
        populateForm(json.data)
        setEditing(false)
      } else {
        setError(json.error || t('form.failedToSave'))
      }
    } catch {
      setError(t('form.failedToSave'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('form.employeeDetails')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? t('form.editEmployee') : employee.fullName}
        description={editing ? '' : `${employee.employeeNo} - ${employee.department?.name || ''}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {!editing && (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              {tc('buttons.edit')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* View Mode */}
      {!editing && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle>{t('form.personalInfo')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">{t('fields.fullName')}:</span> <span className="font-medium">{employee.fullName}</span></div>
                {employee.localizedName && <div><span className="text-muted-foreground">{t('form.localizedName')}:</span> {employee.localizedName}</div>}
                {employee.dateOfBirth && <div><span className="text-muted-foreground">{t('form.dateOfBirth')}:</span> {formatDate(employee.dateOfBirth)}</div>}
                {employee.gender && <div><span className="text-muted-foreground">{t('form.gender')}:</span> {t(`form.genders.${employee.gender}`)}</div>}
                {employee.maritalStatus && <div><span className="text-muted-foreground">{t('form.maritalStatus')}:</span> {t(`form.maritalStatuses.${employee.maritalStatus}`)}</div>}
                {employee.nidNumber && <div><span className="text-muted-foreground">{t('form.nidNumber')}:</span> <span className="font-mono text-xs">{employee.nidNumber}</span></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('form.employmentInfo')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">{t('fields.employeeNo')}:</span> <span className="font-mono font-medium">{employee.employeeNo}</span></div>
                <div><span className="text-muted-foreground">{t('fields.department')}:</span> {employee.department?.name || '\u2014'}</div>
                <div><span className="text-muted-foreground">{t('fields.designation')}:</span> {employee.designation?.title || '\u2014'}</div>
                <div><span className="text-muted-foreground">{t('fields.employmentType')}:</span> <StatusBadge status={employee.employmentType} /></div>
                <div><span className="text-muted-foreground">{t('fields.joiningDate')}:</span> {formatDate(employee.joiningDate)}</div>
                <div><span className="text-muted-foreground">{t('fields.status')}:</span> <StatusBadge status={employee.status} /></div>
                {employee.basicSalary != null && <div><span className="text-muted-foreground">{t('fields.basicSalary')}:</span> <span className="font-mono">{formatCurrency(Number(employee.basicSalary))}</span></div>}
                {employee.reportingTo && <div><span className="text-muted-foreground">{t('form.reportingTo')}:</span> {employee.reportingTo.fullName}</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('form.contactInfo')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {employee.email && <div><span className="text-muted-foreground">{t('fields.email')}:</span> {employee.email}</div>}
                {employee.phone && <div><span className="text-muted-foreground">{t('fields.phone')}:</span> {employee.phone}</div>}
                {employee.emergencyContact && <div><span className="text-muted-foreground">{t('form.emergencyContact')}:</span> {employee.emergencyContact}</div>}
                {employee.presentAddress && <div><span className="text-muted-foreground">{t('form.presentAddress')}:</span> {employee.presentAddress}</div>}
                {employee.permanentAddress && <div><span className="text-muted-foreground">{t('form.permanentAddress')}:</span> {employee.permanentAddress}</div>}
                {employee.bankName && <div><span className="text-muted-foreground">{t('form.bankName')}:</span> {employee.bankName}</div>}
                {employee.bankAccountNo && <div><span className="text-muted-foreground">{t('form.bankAccountNo')}:</span> <span className="font-mono text-xs">{employee.bankAccountNo}</span></div>}
              </CardContent>
            </Card>
          </div>

          {employee.directReports && employee.directReports.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t('form.directReports')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {employee.directReports.map((dr) => (
                    <button
                      key={dr.id}
                      onClick={() => router.push(`/hr/employees/${dr.id}`)}
                      className="text-left p-2 rounded-md hover:bg-muted text-sm transition-colors"
                    >
                      <span className="font-medium">{dr.fullName}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">{dr.employeeNo}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Documents Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {REQUIRED_DOCUMENTS.map(doc => {
                  const uploaded = employeeDocuments.find(d => d.type === doc.type)
                  return (
                    <div key={doc.type} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {uploaded ? (
                          <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                          </div>
                        )}
                        <span className="text-sm">{doc.label}</span>
                        {doc.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                      </div>
                      {uploaded ? (
                        <span className="text-xs text-muted-foreground">{formatDate(uploaded.uploadedAt)}</span>
                      ) : (
                        <span className="text-xs text-amber-600">Missing</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {employee.notes && (
            <Card>
              <CardHeader><CardTitle>{t('form.notes')}</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{employee.notes}</p></CardContent>
            </Card>
          )}

          {/* File Attachments */}
          <Card>
            <CardContent className="pt-6">
              <FileUpload entityType="employee" entityId={params.id as string} module="hr" readOnly={['INACTIVE', 'SUSPENDED'].includes(employee.status)} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Mode */}
      {editing && (
        <>
        <Card>
          <CardHeader><CardTitle>{t('form.editEmployee')}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('fields.fullName')} *</Label>
                <Input id="edit-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('fields.email')}</Label>
                <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t('fields.phone')}</Label>
                <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergency">{t('form.emergencyContact')}</Label>
                <Input id="edit-emergency" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dept">{t('fields.department')}</Label>
                <SearchableSelect
                  id="edit-dept"
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  value={departmentId}
                  onValueChange={setDepartmentId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desig">{t('fields.designation')}</Label>
                <SearchableSelect
                  id="edit-desig"
                  options={designations.map((d) => ({ value: d.id, label: d.title }))}
                  value={designationId}
                  onValueChange={setDesignationId}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">{t('fields.employmentType')}</Label>
                <SearchableSelect
                  id="edit-type"
                  options={EMPLOYMENT_TYPES.map((et) => ({ value: et, label: tc(`employmentTypes.${et}`) }))}
                  value={employmentType}
                  onValueChange={setEmploymentType}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">{tc('labels.status')}</Label>
                <SearchableSelect
                  id="edit-status"
                  options={STATUSES.map((s) => ({ value: s, label: tc(`status.${s}`) }))}
                  value={status}
                  onValueChange={setStatus}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">{t('fields.basicSalary')}</Label>
                <Input id="edit-salary" type="number" min="0" step="0.01" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">{t('form.presentAddress')}</Label>
              <Textarea id="edit-address" value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t('form.notes')}</Label>
              <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('form.saving')}
                </>
              ) : (
                tc('buttons.save')
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* File Attachments */}
        <Card>
          <CardContent className="pt-6">
            <FileUpload entityType="employee" entityId={params.id as string} module="hr" readOnly={false} />
          </CardContent>
        </Card>
        </>
      )}
    </div>
  )
}
