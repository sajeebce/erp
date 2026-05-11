'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Loader2, Pencil, Check, AlertTriangle, X,
  Plus, Trash2, Save, User, Briefcase, DollarSign,
  FileText, Calendar, FolderOpen, GraduationCap,
  Award, Shield, ScrollText, Clock, ExternalLink,
  Phone, Mail, MapPin, ChevronLeft, ChevronRight, Upload, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { FileUpload } from '@/components/shared/file-upload'
import { useFormatters } from '@/hooks/use-formatters'
import { cn } from '@/lib/utils'

// ─── Constants ──────────────────────────────────────────────────────

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
  { type: 'PASSPORT_COPY', label: 'Passport Copy', required: false },
  { type: 'WORK_PERMIT', label: 'Work Permit', required: false },
]

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const
const STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'] as const
const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const
const RELATIONSHIPS = ['SPOUSE', 'PARENT', 'SIBLING', 'CHILD', 'FRIEND', 'OTHER'] as const
const RELIGIONS = [
  { value: 'Islam', labelKey: 'ISLAM' },
  { value: 'Hinduism', labelKey: 'HINDUISM' },
  { value: 'Buddhism', labelKey: 'BUDDHISM' },
  { value: 'Christianity', labelKey: 'CHRISTIANITY' },
  { value: 'Other', labelKey: 'OTHER' },
] as const
const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] as const
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
const PAYMENT_METHODS = ['BANK_TRANSFER', 'MOBILE_BANKING', 'CHECK', 'CASH'] as const
const PAY_FREQUENCIES = ['MONTHLY', 'BI_WEEKLY', 'WEEKLY'] as const
const PROFICIENCY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const
const LANGUAGE_LEVELS = ['NONE', 'BASIC', 'FLUENT', 'NATIVE'] as const

const READ_ONLY_TABS = new Set(['leave', 'projects', 'performance', 'contracts', 'timeline'])

function formatRawLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeReligionValue(value: string | null | undefined) {
  const normalized = String(value || '').trim().toUpperCase()
  const matched = RELIGIONS.find((religion) =>
    religion.value.toUpperCase() === normalized || religion.labelKey === normalized
  )
  return matched?.value || String(value || '').trim()
}

// Tab definitions for scrollable tab bar
const TAB_ITEMS: { value: string; labelKey: string; icon: typeof User }[] = [
  { value: 'personal', labelKey: 'profile.tabs.personal', icon: User },
  { value: 'employment', labelKey: 'profile.tabs.employment', icon: Briefcase },
  { value: 'compensation', labelKey: 'profile.tabs.compensation', icon: DollarSign },
  { value: 'documents', labelKey: 'profile.tabs.documents', icon: FileText },
  { value: 'leave', labelKey: 'profile.tabs.leave', icon: Calendar },
  { value: 'projects', labelKey: 'profile.tabs.projects', icon: FolderOpen },
  { value: 'education', labelKey: 'profile.tabs.education', icon: GraduationCap },
  { value: 'performance', labelKey: 'profile.tabs.performance', icon: Award },
  { value: 'compliance', labelKey: 'profile.tabs.compliance', icon: Shield },
  { value: 'contracts', labelKey: 'profile.tabs.contracts', icon: ScrollText },
  { value: 'timeline', labelKey: 'profile.tabs.timeline', icon: Clock },
]

// ─── Types ──────────────────────────────────────────────────────────

interface Department { id: string; name: string; code?: string }
interface Designation { id: string; title: string; level?: number }
interface BusinessUnit { id: string; code: string; name: string; shortName?: string | null }
interface ProjectOption { id: string; projectNo?: string; name: string; status?: string }

interface EmergencyContact {
  id: string; contactName: string; relationship: string;
  phone: string; alternatePhone?: string | null; email?: string | null;
  address?: string | null; isPrimary: boolean
}

interface Education {
  id: string; degree: string; institution: string;
  fieldOfStudy?: string | null; startYear?: number | null;
  endYear?: number | null; grade?: string | null; country?: string | null;
  filePath?: string | null
}

interface WorkHistory {
  id: string; employer: string; jobTitle: string; department?: string | null;
  startDate: string; endDate?: string | null; reasonForLeaving?: string | null;
  responsibilities?: string | null; location?: string | null; isCurrent: boolean;
  filePath?: string | null
}

interface Skill {
  id: string; skillName: string; proficiency: string; yearsOfExp?: number | null
}

interface Language {
  id: string; language: string; readLevel?: string | null;
  writeLevel?: string | null; speakLevel?: string | null
}

interface Certification {
  id: string; name: string; issuingOrg: string;
  issueDate?: string | null; expiryDate?: string | null;
  certificateNo?: string | null; filePath?: string | null
}

interface EmployeeDocument {
  id: string; name: string; type: string; filePath: string;
  uploadedAt: string; documentNumber?: string | null;
  issuedDate?: string | null; expiryDate?: string | null;
  issuingAuthority?: string | null; verificationStatus?: string | null
}

interface ProjectAllocation {
  id: string; projectId: string; percentage: number | string;
  startDate: string; endDate?: string | null; isActive: boolean;
  project?: { id: string; name: string; code?: string }
}

interface ProfileSummary {
  leaveBalance: { totalEntitled: number; totalTaken: number; totalRemaining: number }
  contractStatus: { hasActive: boolean; contractNo: string | null; endDate: string | null; daysLeft: number | null }
  pfBalance: { enrolled: boolean; balance: number }
  activeProjects: { count: number; totalAllocation: number }
  onboardingProgress: { total: number; completed: number; percentage: number }
  gratuityAccrual: { eligible: boolean; accrued: number }
}

interface LeaveBalance { id: string; leaveType: string; entitled: number; taken: number; remaining: number }
interface LeaveApplication { id: string; leaveType: string; startDate: string; endDate: string; status: string; days: number }

interface TimelineEvent {
  date: string; type: string; title: string; description: string; icon: string
}

interface PerformanceReview {
  id: string; reviewPeriod: string; reviewType: string;
  selfScore?: number | null; supervisorScore?: number | null; finalScore?: number | null;
  rating?: string | null; status: string; completedAt?: string | null;
  okrScore?: number | null; competencyScore?: number | null;
  selfComments?: string | null; supervisorComments?: string | null;
  developmentPlan?: string | null
}

interface Contract {
  id: string; contractNo?: string; contractType?: string; startDate: string;
  endDate?: string | null; status: string; createdAt: string
}

interface Employee {
  id: string
  employeeNo: string
  fullName: string
  localizedName?: Record<string, string> | null
  fatherName?: string | null
  motherName?: string | null
  spouseName?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  maritalStatus?: string | null
  bloodGroup?: string | null
  religion?: string | null
  nationality?: string | null
  birthPlace?: string | null
  disability?: string | null
  nidNumber?: string | null
  passport?: string | null
  phone?: string | null
  email?: string | null
  photo?: string | null
  emergencyContact?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  numberOfDependents?: number | null
  departmentId: string
  designationId: string
  primaryBusinessUnitId?: string | null
  primaryBusinessUnit?: BusinessUnit | null
  employmentType: string
  joiningDate: string
  confirmationDate?: string | null
  endDate?: string | null
  probationEndDate?: string | null
  reportingToId?: string | null
  status: string
  dutyStation?: string | null
  gradeLevel?: string | null
  costCenter?: string | null
  workingHoursPerWeek?: number | string | null
  noticePeriodDays?: number | null
  isExpatriate?: boolean
  shiftSchedule?: string | null
  convertedFromApplicationId?: string | null
  basicSalary?: string | number | null
  houseRentAllowance?: string | number | null
  medicalAllowance?: string | number | null
  transportAllowance?: string | number | null
  otherAllowances?: { name: string; amount: number }[] | null
  grossSalary?: string | number | null
  payFrequency?: string | null
  paymentMethod?: string | null
  bankName?: string | null
  bankBranch?: string | null
  bankAccountNo?: string | null
  bankRoutingNo?: string | null
  mobileBankingProvider?: string | null
  mobileBankingNumber?: string | null
  tinNumber?: string | null
  taxCircle?: string | null
  taxZone?: string | null
  ngoabNotified?: boolean
  fd4ReferenceNo?: string | null
  fd4SubmissionDate?: string | null
  fd4ApprovalStatus?: string | null
  codeOfConductSigned?: boolean
  codeOfConductDate?: string | null
  pseaDeclarationSigned?: boolean
  safeguardingTrainingDate?: string | null
  safeguardingTrainingExpiry?: string | null
  backgroundCheckStatus?: string | null
  backgroundCheckDate?: string | null
  mdsCheckCompleted?: boolean
  codeOfConductFilePath?: string | null
  pseaDeclarationFilePath?: string | null
  safeguardingCertFilePath?: string | null
  backgroundCheckFilePath?: string | null
  fd4DocumentFilePath?: string | null
  notes?: string | null
  department?: Department
  designation?: Designation
  reportingTo?: { id: string; fullName: string; employeeNo: string } | null
  directReports?: { id: string; fullName: string; employeeNo: string }[]
  emergencyContacts?: EmergencyContact[]
  educationHistory?: Education[]
  workHistory?: WorkHistory[]
  dependents?: unknown[]
  skills?: Skill[]
  languages?: Language[]
  certifications?: Certification[]
  documents?: EmployeeDocument[]
  projectAllocations?: ProjectAllocation[]
  salaryGradeId?: string | null
  salaryStepNo?: number | null
  salaryStructureId?: string | null
  salaryGrade?: {
    id: string; code: string; name: string; currency: string
    steps: { id: string; stepNumber: number; basicSalary: string | number }[]
  } | null
  salaryStructure?: {
    id: string; name: string
    lines: {
      id: string; calculationType: string; amount?: string | number | null
      percentage?: string | number | null; sortOrder: number
      component: { id: string; code: string; name: string; type: string }
    }[]
  } | null
  createdAt: string
}

// ─── Helpers ────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : parseFloat(v) || 0
}

function isProvidentFundComponent(line: NonNullable<Employee['salaryStructure']>['lines'][number]) {
  const code = line.component.code.toUpperCase()
  const name = line.component.name.toUpperCase()
  return ['PF', 'PF_DEDUCTION', 'PF_EMP', 'PF_ER'].includes(code) || name.includes('PROVIDENT FUND')
}

function getEffectiveSalaryStep(employee: Employee) {
  const steps = employee.salaryGrade?.steps || []
  const storedBasic = num(employee.basicSalary)
  const matchedStep = storedBasic > 0
    ? steps.find((step) => num(step.basicSalary) === storedBasic)
    : undefined
  const selectedStep = steps.find((step) => step.stepNumber === (employee.salaryStepNo || 1))
  const step = matchedStep || selectedStep || steps[0]

  return {
    step,
    stepNo: step?.stepNumber || employee.salaryStepNo || 1,
    basic: storedBasic > 0 ? storedBasic : num(step?.basicSalary),
  }
}

function formatSalaryGradePayLevel(employee: Employee) {
  if (!employee.salaryGrade) return employee.gradeLevel || ''

  const effectiveStep = getEffectiveSalaryStep(employee)
  return `${employee.salaryGrade.code} - Pay Level ${effectiveStep.stepNo}`
}

function calculateSalaryBreakdown(employee: Employee, hasActiveProvidentFund = true) {
  const effectiveStep = getEffectiveSalaryStep(employee)
  const basic = effectiveStep.basic
  const lines = employee.salaryStructure?.lines || []
  const earnings: { name: string; amount: number }[] = []
  const deductions: { name: string; amount: number }[] = []
  let gross = basic

  for (const line of lines) {
    if (!hasActiveProvidentFund && isProvidentFundComponent(line)) continue

    let amount = 0
    if (line.calculationType === 'FIXED') amount = num(line.amount)
    else if (line.calculationType === 'PERCENT_OF_BASIC') amount = basic * num(line.percentage) / 100
    else if (line.calculationType === 'PERCENT_OF_GROSS') amount = 0

    const entry = { name: line.component.name, amount: Math.round(amount) }
    if (line.component.type === 'EARNING') {
      earnings.push(entry)
      gross += entry.amount
    } else if (line.component.type === 'DEDUCTION') {
      deductions.push(entry)
    }
  }

  for (const line of lines) {
    if (line.calculationType !== 'PERCENT_OF_GROSS') continue
    if (!hasActiveProvidentFund && isProvidentFundComponent(line)) continue

    const amount = Math.round(gross * num(line.percentage) / 100)
    const entry = { name: line.component.name, amount }
    if (line.component.type === 'EARNING') {
      earnings.push(entry)
      gross += amount
    } else if (line.component.type === 'DEDUCTION') {
      deductions.push(entry)
    }
  }

  const byName = (pattern: RegExp) => earnings.find((entry) => pattern.test(entry.name))?.amount || 0
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0)

  return {
    basic,
    earnings,
    deductions,
    gross,
    net: gross - totalDeductions,
    houseRent: byName(/house\s*rent|hra/i),
    medical: byName(/medical/i),
    transport: byName(/transport/i),
  }
}

function getPendingProvidentFundDeductions(employee: Employee, hasActiveProvidentFund: boolean) {
  if (hasActiveProvidentFund) return []

  const names = new Set<string>()
  for (const line of employee.salaryStructure?.lines || []) {
    if (line.component.type === 'DEDUCTION' && isProvidentFundComponent(line)) {
      names.add(line.component.name)
    }
  }

  return Array.from(names)
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children} <span className="text-destructive">*</span>
    </span>
  )
}

function getPayrollReadinessIssues(employee: Employee): string[] {
  const issues: string[] = []
  const activeAllocationTotal = (employee.projectAllocations || [])
    .filter(a => a.isActive)
    .reduce((sum, a) => sum + num(a.percentage), 0)

  if (employee.status !== 'ACTIVE') issues.push('Employee status must be Active')
  if (!employee.departmentId) issues.push('Department is required')
  if (!employee.designationId) issues.push('Designation is required')
  if (!employee.primaryBusinessUnitId) issues.push('Business Unit / Concern is required')
  if (!employee.employmentType) issues.push('Employment type is required')
  if (!employee.joiningDate) issues.push('Joining date is required')
  if (num(employee.basicSalary) <= 0) issues.push('Basic salary must be greater than 0')
  if (!employee.payFrequency) issues.push('Pay frequency is required')
  if (!employee.paymentMethod) issues.push('Payment method is required')
  if (employee.paymentMethod === 'BANK_TRANSFER' && !employee.bankName) issues.push('Bank name is required')
  if (employee.paymentMethod === 'BANK_TRANSFER' && !employee.bankAccountNo) issues.push('Bank account no is required')
  if (employee.paymentMethod === 'MOBILE_BANKING' && !employee.mobileBankingProvider) issues.push('Mobile banking provider is required')
  if (employee.paymentMethod === 'MOBILE_BANKING' && !employee.mobileBankingNumber) issues.push('Mobile banking number is required')
  if (activeAllocationTotal <= 0) issues.push('Project allocation is required')
  if (activeAllocationTotal > 0 && activeAllocationTotal !== 100) issues.push('Active project allocation total must be 100%')

  return issues
}

function getHeaderReadinessWarnings(employee: Employee, profileSummary: ProfileSummary | null): string[] {
  const warnings: string[] = []
  const needsPayrollReadiness = ['ACTIVE', 'PROBATION', 'ON_LEAVE'].includes(employee.status)
  if (!needsPayrollReadiness) return warnings

  const activeAllocationTotal = (employee.projectAllocations || [])
    .filter((allocation) => allocation.isActive)
    .reduce((sum, allocation) => sum + num(allocation.percentage), 0)

  if (!employee.primaryBusinessUnitId) warnings.push('Business Unit required')
  if (activeAllocationTotal <= 0) warnings.push('Project allocation required')
  else if (activeAllocationTotal !== 100) warnings.push('Project allocation must be 100%')
  if (profileSummary && !profileSummary.contractStatus.hasActive) warnings.push('Active contract required')

  return warnings
}

function dateStr(v: string | null | undefined): string {
  if (!v) return ''
  return v.split('T')[0]
}

// ─── Blood Group Key Mapper ─────────────────────────────────────────
const BLOOD_GROUP_KEYS: Record<string, string> = {
  'A+': 'A_POSITIVE', 'A-': 'A_NEGATIVE',
  'B+': 'B_POSITIVE', 'B-': 'B_NEGATIVE',
  'AB+': 'AB_POSITIVE', 'AB-': 'AB_NEGATIVE',
  'O+': 'O_POSITIVE', 'O-': 'O_NEGATIVE',
}

// ─── Field Display Component ────────────────────────────────────────

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  const isBlank = value === null || value === undefined || value === ''
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`min-h-5 text-sm font-medium ${mono ? 'font-mono' : ''}`}>
        {isBlank ? '\u00a0' : value}
      </span>
    </div>
  )
}

// ─── Scrollable Tab Navigation (Material UI / Ant Design pattern) ───

function ScrollableTabBar({
  activeTab,
  t,
}: {
  activeTab: string
  t: ReturnType<typeof useTranslations>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)

    // Native wheel listener (non-passive) to prevent page scroll when hovering tab bar
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      el.removeEventListener('wheel', handleWheel)
      ro.disconnect()
    }
  }, [updateScrollState])

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null }
  }, [])

  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    stopAutoScroll()
    scrollIntervalRef.current = setInterval(() => {
      const el = scrollRef.current
      if (!el) return
      el.scrollLeft += direction === 'right' ? 3 : -3
    }, 8)
  }, [stopAutoScroll])

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll])

  // Scroll active tab into view on tab change
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const activeEl = el.querySelector('[data-state="active"]') as HTMLElement | null
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [activeTab])

  return (
    <div className="relative flex items-center">
      {/* Left arrow */}
      <div className={cn(
        'absolute left-0 z-20 h-full flex items-center transition-opacity duration-200',
        canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="flex items-center h-full bg-gradient-to-r from-background via-background to-transparent pr-3 pl-0.5">
          <button
            className="flex items-center justify-center h-7 w-7 rounded-full border bg-background shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onMouseEnter={() => startAutoScroll('left')}
            onMouseLeave={stopAutoScroll}
            onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable tab list */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto scrollbar-none">
        <TabsList variant="line" className="w-max justify-start flex-nowrap border-b px-8">
          {TAB_ITEMS.map(tab => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 shrink-0">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(tab.labelKey)}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>

      {/* Right arrow */}
      <div className={cn(
        'absolute right-0 z-20 h-full flex items-center transition-opacity duration-200',
        canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="flex items-center h-full bg-gradient-to-l from-background via-background to-transparent pl-3 pr-0.5">
          <button
            className="flex items-center justify-center h-7 w-7 rounded-full border bg-background shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onMouseEnter={() => startAutoScroll('right')}
            onMouseLeave={stopAutoScroll}
            onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate, formatNumber } = useFormatters()
  const employeeId = params.id as string
  const documentUrl = useCallback((filePath: string | null | undefined) => {
    if (!filePath) return ''
    if (/^(https?:|\/)/.test(filePath)) return filePath
    return `/api/v1/hr/employees/${employeeId}/documents/download?key=${encodeURIComponent(filePath)}`
  }, [employeeId])

  // ── Core State ──
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('personal')
  const [editingTabs, setEditingTabs] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  // ── Lookup Data ──
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])

  // ── Edit Form State (grouped) ──
  const [personalForm, setPersonalForm] = useState<Record<string, string | boolean | null>>({})
  const [employmentForm, setEmploymentForm] = useState<Record<string, string | boolean | null>>({})
  const [compensationForm, setCompensationForm] = useState<Record<string, string | null>>({})
  const [complianceForm, setComplianceForm] = useState<Record<string, string | boolean | null>>({})

  const effectiveSalaryStep = employee ? getEffectiveSalaryStep(employee) : null

  const formatRelationship = useCallback((relationship: string | null | undefined) => {
    const value = String(relationship || '').trim()
    if (!value) return '—'
    const normalized = value.toUpperCase()
    if ((RELATIONSHIPS as readonly string[]).includes(normalized)) {
      return t(`form.relationships.${normalized}`)
    }
    return formatRawLabel(value)
  }, [t])

  // ── Sub-resource data (lazy-loaded) ──
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[] | null>(null)
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[] | null>(null)
  const [contracts, setContracts] = useState<Contract[] | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null)
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[] | null>(null)

  // ── Inline CRUD state ──
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState<Partial<EmergencyContact>>({})
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null)
  const [educationForm, setEducationForm] = useState<Partial<Education>>({})
  const [showAddEducation, setShowAddEducation] = useState(false)
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null)
  const [workForm, setWorkForm] = useState<Partial<WorkHistory>>({})
  const [showAddWork, setShowAddWork] = useState(false)
  const [skillForm, setSkillForm] = useState({ skillName: '', proficiency: 'INTERMEDIATE', yearsOfExp: '' })
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(null)
  const [languageForm, setLanguageForm] = useState<Partial<Language>>({})
  const [showAddLanguage, setShowAddLanguage] = useState(false)
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [certForm, setCertForm] = useState<Partial<Certification>>({})
  const [showAddCert, setShowAddCert] = useState(false)
  const [showAddProjectAllocation, setShowAddProjectAllocation] = useState(false)
  const [projectAllocationForm, setProjectAllocationForm] = useState({
    projectId: '',
    percentage: '100',
    startDate: '',
    endDate: '',
  })
  const [projectAllocationSaving, setProjectAllocationSaving] = useState(false)
  const [contractActionId, setContractActionId] = useState<string | null>(null)

  // ── Tab loaded tracking ──
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['personal']))

  // ═══ Data Fetching ═══

  const fetchEmployee = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/hr/employees/${employeeId}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setEmployee(json.data)
      } else {
        setError(tc('errors.notFound'))
      }
    } catch {
      setError(tc('errors.loadFailed'))
    }
  }, [employeeId, tc])

  useEffect(() => {
    if (!employeeId) return
    setLoading(true)

    Promise.all([
      fetch(`/api/v1/hr/employees/${employeeId}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/v1/hr/employees/${employeeId}/profile-summary`, { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/v1/hr/departments').then(r => r.json()),
      fetch('/api/v1/hr/designations').then(r => r.json()),
      fetch('/api/v1/settings/business-units?isActive=true').then(r => r.json()),
    ]).then(([empJson, summaryJson, deptJson, desigJson, buJson]) => {
      if (empJson.success) setEmployee(empJson.data)
      else setError(tc('errors.notFound'))
      if (summaryJson.success) setProfileSummary(summaryJson.data)
      if (deptJson.success) setDepartments(deptJson.data)
      if (desigJson.success) setDesignations(desigJson.data)
      if (buJson.success) setBusinessUnits(Array.isArray(buJson.data) ? buJson.data : [])
    }).catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [employeeId, tc])

  const fetchProfileSummary = useCallback(async () => {
    const res = await fetch(`/api/v1/hr/employees/${employeeId}/profile-summary`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({ success: false }))
    if (res.success) setProfileSummary(res.data)
  }, [employeeId])

  useEffect(() => {
    if (!employeeId) return

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchProfileSummary()
      }
    }

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnFocus)

    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnFocus)
    }
  }, [employeeId, fetchProfileSummary])

  const fetchContracts = useCallback(async () => {
    const res = await fetch(`/api/v1/hr/contracts?employeeId=${employeeId}`).then(r => r.json()).catch(() => ({ success: false }))
    setContracts(res.success ? (Array.isArray(res.data) ? res.data : res.data?.items || []) : [])
  }, [employeeId])

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/v1/hr/projects/options?status=ACTIVE').then(r => r.json()).catch(() => ({ success: false }))
    setProjects(res.success ? (Array.isArray(res.data) ? res.data : res.data?.items || []) : [])
  }, [])

  const fetchTabData = useCallback(async (tab: string) => {
    if (loadedTabs.has(tab)) return
    setLoadedTabs(prev => new Set(prev).add(tab))

    switch (tab) {
      case 'leave': {
        const [balRes, appRes] = await Promise.all([
          fetch(`/api/v1/hr/leave/balances?employeeId=${employeeId}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`/api/v1/hr/leave/applications?employeeId=${employeeId}&limit=5`).then(r => r.json()).catch(() => ({ success: false })),
        ])
        if (balRes.success) setLeaveBalances(Array.isArray(balRes.data) ? balRes.data : balRes.data?.items || [])
        else setLeaveBalances([])
        if (appRes.success) setLeaveApplications(Array.isArray(appRes.data) ? appRes.data : appRes.data?.items || [])
        else setLeaveApplications([])
        break
      }
      case 'performance': {
        const res = await fetch(`/api/v1/hr/employees/${employeeId}/performance-reviews`).then(r => r.json()).catch(() => ({ success: false }))
        setPerformanceReviews(res.success ? (Array.isArray(res.data) ? res.data : []) : [])
        break
      }
      case 'contracts': {
        await fetchContracts()
        break
      }
      case 'projects': {
        await fetchProjects()
        break
      }
      case 'timeline': {
        const res = await fetch(`/api/v1/hr/employees/${employeeId}/timeline`).then(r => r.json()).catch(() => ({ success: false }))
        setTimeline(res.success ? (Array.isArray(res.data) ? res.data : res.data?.events || []) : [])
        break
      }
    }
  }, [employeeId, fetchContracts, fetchProjects, loadedTabs])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    fetchTabData(tab)
  }, [fetchTabData])

  // ═══ Edit Mode Helpers ═══

  const isEditing = editingTabs[activeTab] || false

  const populatePersonalForm = useCallback((emp: Employee) => {
    setPersonalForm({
      fullName: emp.fullName,
      localizedName: typeof emp.localizedName === 'string'
        ? emp.localizedName
        : emp.localizedName
          ? Object.values(emp.localizedName).filter(Boolean).join(' / ')
          : '',
      fatherName: emp.fatherName || '',
      motherName: emp.motherName || '',
      spouseName: emp.spouseName || '',
      dateOfBirth: dateStr(emp.dateOfBirth),
      gender: emp.gender || '',
      maritalStatus: emp.maritalStatus || '',
      bloodGroup: emp.bloodGroup || '',
      religion: normalizeReligionValue(emp.religion),
      nationality: emp.nationality || '',
      birthPlace: emp.birthPlace || '',
      nidNumber: emp.nidNumber || '',
      passport: emp.passport || '',
      disability: emp.disability || '',
      phone: emp.phone || '',
      email: emp.email || '',
      presentAddress: emp.presentAddress || '',
      permanentAddress: emp.permanentAddress || '',
    })
  }, [])

  const populateEmploymentForm = useCallback((emp: Employee) => {
    setEmploymentForm({
      status: emp.status,
      departmentId: emp.departmentId,
      designationId: emp.designationId,
      primaryBusinessUnitId: emp.primaryBusinessUnitId || '',
      employmentType: emp.employmentType,
      gradeLevel: formatSalaryGradePayLevel(emp),
      joiningDate: dateStr(emp.joiningDate),
      confirmationDate: dateStr(emp.confirmationDate),
      probationEndDate: dateStr(emp.probationEndDate),
      endDate: dateStr(emp.endDate),
      dutyStation: emp.dutyStation || '',
      costCenter: emp.costCenter || '',
      reportingToId: emp.reportingToId || '',
      shiftSchedule: emp.shiftSchedule || '',
      workingHoursPerWeek: emp.workingHoursPerWeek != null ? String(emp.workingHoursPerWeek) : '',
      noticePeriodDays: emp.noticePeriodDays != null ? String(emp.noticePeriodDays) : '',
      isExpatriate: emp.isExpatriate || false,
    })
  }, [])

  const populateCompensationForm = useCallback((emp: Employee) => {
    const structureBreakdown = emp.salaryGrade && emp.salaryStructure
      ? calculateSalaryBreakdown(emp, Boolean(profileSummary?.pfBalance.enrolled))
      : null

    setCompensationForm({
      basicSalary: String(structureBreakdown?.basic || emp.basicSalary || ''),
      houseRentAllowance: structureBreakdown ? String(structureBreakdown.houseRent) : (emp.houseRentAllowance != null ? String(emp.houseRentAllowance) : ''),
      medicalAllowance: structureBreakdown ? String(structureBreakdown.medical) : (emp.medicalAllowance != null ? String(emp.medicalAllowance) : ''),
      transportAllowance: structureBreakdown ? String(structureBreakdown.transport) : (emp.transportAllowance != null ? String(emp.transportAllowance) : ''),
      grossSalary: structureBreakdown ? String(structureBreakdown.gross) : (emp.grossSalary != null ? String(emp.grossSalary) : ''),
      payFrequency: emp.payFrequency || 'MONTHLY',
      paymentMethod: emp.paymentMethod || 'BANK_TRANSFER',
      bankName: emp.bankName || '',
      bankBranch: emp.bankBranch || '',
      bankAccountNo: emp.bankAccountNo || '',
      bankRoutingNo: emp.bankRoutingNo || '',
      mobileBankingProvider: emp.mobileBankingProvider || '',
      mobileBankingNumber: emp.mobileBankingNumber || '',
      tinNumber: emp.tinNumber || '',
      taxCircle: emp.taxCircle || '',
      taxZone: emp.taxZone || '',
    })
  }, [profileSummary?.pfBalance.enrolled])

  const populateComplianceForm = useCallback((emp: Employee) => {
    setComplianceForm({
      ngoabNotified: emp.ngoabNotified || false,
      fd4ReferenceNo: emp.fd4ReferenceNo || '',
      fd4SubmissionDate: dateStr(emp.fd4SubmissionDate),
      fd4ApprovalStatus: emp.fd4ApprovalStatus || '',
      codeOfConductSigned: emp.codeOfConductSigned || false,
      codeOfConductDate: dateStr(emp.codeOfConductDate),
      pseaDeclarationSigned: emp.pseaDeclarationSigned || false,
      safeguardingTrainingDate: dateStr(emp.safeguardingTrainingDate),
      safeguardingTrainingExpiry: dateStr(emp.safeguardingTrainingExpiry),
      backgroundCheckStatus: emp.backgroundCheckStatus || '',
      backgroundCheckDate: dateStr(emp.backgroundCheckDate),
      mdsCheckCompleted: emp.mdsCheckCompleted || false,
    })
  }, [])

  const toggleEdit = useCallback(() => {
    if (READ_ONLY_TABS.has(activeTab)) return
    if (!employee) return

    if (!editingTabs[activeTab]) {
      if (activeTab === 'personal') populatePersonalForm(employee)
      else if (activeTab === 'employment') populateEmploymentForm(employee)
      else if (activeTab === 'compensation') populateCompensationForm(employee)
      else if (activeTab === 'compliance') populateComplianceForm(employee)
      setEditingTabs(prev => ({ ...prev, [activeTab]: true }))
    } else {
      setEditingTabs(prev => ({ ...prev, [activeTab]: false }))
      setError('')
    }
  }, [activeTab, editingTabs, employee, populatePersonalForm, populateEmploymentForm, populateCompensationForm, populateComplianceForm])

  const saveCurrentTab = useCallback(async () => {
    if (!employee) return
    setSaving(true)
    setError('')

    let payload: Record<string, unknown> = {}

    if (activeTab === 'personal') {
      if (!String(personalForm.fullName || '').trim()) {
        setError(t('form.requiredFields'))
        setSaving(false)
        return
      }
      payload = {
        fullName: String(personalForm.fullName).trim(),
        localizedName: personalForm.localizedName || null,
        fatherName: personalForm.fatherName || null,
        motherName: personalForm.motherName || null,
        spouseName: personalForm.spouseName || null,
        dateOfBirth: personalForm.dateOfBirth || null,
        gender: personalForm.gender || null,
        maritalStatus: personalForm.maritalStatus || null,
        bloodGroup: personalForm.bloodGroup || null,
        religion: personalForm.religion || null,
        nationality: personalForm.nationality || null,
        birthPlace: personalForm.birthPlace || null,
        nidNumber: personalForm.nidNumber || null,
        passport: personalForm.passport || null,
        disability: personalForm.disability || null,
        phone: personalForm.phone || null,
        email: personalForm.email || null,
        presentAddress: personalForm.presentAddress || null,
        permanentAddress: personalForm.permanentAddress || null,
      }
    } else if (activeTab === 'employment') {
      const missing = [
        !employmentForm.status && 'Status',
        !employmentForm.departmentId && 'Department',
        !employmentForm.designationId && 'Designation',
        !employmentForm.primaryBusinessUnitId && 'Business Unit / Concern',
        !employmentForm.employmentType && 'Employment type',
        !employmentForm.joiningDate && 'Joining date',
      ].filter(Boolean)
      if (missing.length > 0) {
        setError(`Required for payroll: ${missing.join(', ')}`)
        setSaving(false)
        return
      }
      payload = {
        status: employmentForm.status,
        departmentId: employmentForm.departmentId,
        designationId: employmentForm.designationId,
        primaryBusinessUnitId: employmentForm.primaryBusinessUnitId || null,
        employmentType: employmentForm.employmentType,
        gradeLevel: employee.gradeLevel || null,
        joiningDate: employmentForm.joiningDate,
        confirmationDate: employmentForm.confirmationDate || null,
        probationEndDate: employmentForm.probationEndDate || null,
        endDate: employmentForm.endDate || null,
        reportingToId: employmentForm.reportingToId || null,
        dutyStation: employmentForm.dutyStation || null,
        costCenter: employmentForm.costCenter || null,
        shiftSchedule: employmentForm.shiftSchedule || null,
        workingHoursPerWeek: employmentForm.workingHoursPerWeek ? parseFloat(String(employmentForm.workingHoursPerWeek)) : null,
        noticePeriodDays: employmentForm.noticePeriodDays ? parseInt(String(employmentForm.noticePeriodDays), 10) : null,
        isExpatriate: Boolean(employmentForm.isExpatriate),
      }
    } else if (activeTab === 'compensation') {
      const basicSalary = num(compensationForm.basicSalary)
      const missing = [
        basicSalary <= 0 && 'Basic salary greater than 0',
        !compensationForm.payFrequency && 'Pay frequency',
        !compensationForm.paymentMethod && 'Payment method',
        compensationForm.paymentMethod === 'BANK_TRANSFER' && !compensationForm.bankName && 'Bank name',
        compensationForm.paymentMethod === 'BANK_TRANSFER' && !compensationForm.bankAccountNo && 'Bank account no',
        compensationForm.paymentMethod === 'MOBILE_BANKING' && !compensationForm.mobileBankingProvider && 'Mobile banking provider',
        compensationForm.paymentMethod === 'MOBILE_BANKING' && !compensationForm.mobileBankingNumber && 'Mobile banking number',
      ].filter(Boolean)
      if (missing.length > 0) {
        setError(`Required for payroll: ${missing.join(', ')}`)
        setSaving(false)
        return
      }
      payload = {
        basicSalary,
        houseRentAllowance: compensationForm.houseRentAllowance ? parseFloat(compensationForm.houseRentAllowance) : null,
        medicalAllowance: compensationForm.medicalAllowance ? parseFloat(compensationForm.medicalAllowance) : null,
        transportAllowance: compensationForm.transportAllowance ? parseFloat(compensationForm.transportAllowance) : null,
        grossSalary: compensationForm.grossSalary ? parseFloat(compensationForm.grossSalary) : null,
        payFrequency: compensationForm.payFrequency || null,
        paymentMethod: compensationForm.paymentMethod || null,
        bankName: compensationForm.bankName || null,
        bankBranch: compensationForm.bankBranch || null,
        bankAccountNo: compensationForm.bankAccountNo || null,
        bankRoutingNo: compensationForm.bankRoutingNo || null,
        mobileBankingProvider: compensationForm.mobileBankingProvider || null,
        mobileBankingNumber: compensationForm.mobileBankingNumber || null,
        tinNumber: compensationForm.tinNumber || null,
        taxCircle: compensationForm.taxCircle || null,
        taxZone: compensationForm.taxZone || null,
      }
    } else if (activeTab === 'compliance') {
      payload = {
        ngoabNotified: Boolean(complianceForm.ngoabNotified),
        fd4ReferenceNo: complianceForm.fd4ReferenceNo || null,
        fd4SubmissionDate: complianceForm.fd4SubmissionDate || null,
        fd4ApprovalStatus: complianceForm.fd4ApprovalStatus || null,
        codeOfConductSigned: Boolean(complianceForm.codeOfConductSigned),
        codeOfConductDate: complianceForm.codeOfConductDate || null,
        pseaDeclarationSigned: Boolean(complianceForm.pseaDeclarationSigned),
        safeguardingTrainingDate: complianceForm.safeguardingTrainingDate || null,
        safeguardingTrainingExpiry: complianceForm.safeguardingTrainingExpiry || null,
        backgroundCheckStatus: complianceForm.backgroundCheckStatus || null,
        backgroundCheckDate: complianceForm.backgroundCheckDate || null,
        mdsCheckCompleted: Boolean(complianceForm.mdsCheckCompleted),
      }
    }

    try {
      const res = await fetch(`/api/v1/hr/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        await fetchEmployee()
        setEditingTabs(prev => ({ ...prev, [activeTab]: false }))
      } else {
        setError(json.error || t('form.failedToSave'))
      }
    } catch {
      setError(t('form.failedToSave'))
    } finally {
      setSaving(false)
    }
  }, [activeTab, employee, personalForm, employmentForm, compensationForm, complianceForm, employeeId, fetchEmployee, t])

  // ═══ Sub-resource CRUD helpers ═══

  const saveProjectAllocation = useCallback(async () => {
    const percentage = num(projectAllocationForm.percentage)
    if (!projectAllocationForm.projectId || percentage <= 0 || percentage > 100 || !projectAllocationForm.startDate) {
      setError('Project, allocation percentage between 0.01 and 100, and start date are required')
      return
    }

    setProjectAllocationSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/hr/employees/${employeeId}/project-allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectAllocationForm.projectId,
          percentage,
          startDate: projectAllocationForm.startDate,
          endDate: projectAllocationForm.endDate || null,
        }),
      })
      const json = await res.json()

      if (res.ok && json.success) {
        setShowAddProjectAllocation(false)
        setProjectAllocationForm({
          projectId: '',
          percentage: '100',
          startDate: dateStr(employee?.joiningDate) || '',
          endDate: '',
        })
        await fetchEmployee()
        await fetchProfileSummary()
      } else {
        setError(json.error || 'Failed to save project allocation')
      }
    } catch {
      setError('Failed to save project allocation')
    } finally {
      setProjectAllocationSaving(false)
    }
  }, [employee?.joiningDate, employeeId, fetchEmployee, fetchProfileSummary, projectAllocationForm])

  const activateContract = useCallback(async (contract: Contract) => {
    if (!employee) return
    const readinessIssues = getPayrollReadinessIssues(employee)
    if (readinessIssues.length > 0) {
      setError(`Before activating contract, complete: ${readinessIssues.join(', ')}`)
      return
    }

    setContractActionId(contract.id)
    setError('')

    try {
      const res = await fetch(`/api/v1/hr/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      const json = await res.json()

      if (res.ok && json.success) {
        await fetchContracts()
        await fetchProfileSummary()
      } else {
        setError(json.error || 'Failed to activate contract')
      }
    } catch {
      setError('Failed to activate contract')
    } finally {
      setContractActionId(null)
    }
  }, [employee, fetchContracts, fetchProfileSummary])

  const apiSubResource = useCallback(async (
    resource: string, method: string, id?: string, body?: unknown
  ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    const url = id
      ? `/api/v1/hr/employees/${employeeId}/${resource}/${id}`
      : `/api/v1/hr/employees/${employeeId}/${resource}`
    try {
      const res = await fetch(url, {
        method,
        headers: method !== 'DELETE' ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      return await res.json()
    } catch {
      return { success: false, error: 'Request failed' }
    }
  }, [employeeId])

  // Emergency Contact CRUD
  const saveContact = useCallback(async (isNew: boolean) => {
    if (!contactForm.contactName?.trim() || !contactForm.phone?.trim()) return
    const body = {
      contactName: contactForm.contactName.trim(),
      relationship: contactForm.relationship || 'OTHER',
      phone: contactForm.phone.trim(),
      alternatePhone: contactForm.alternatePhone || null,
      isPrimary: contactForm.isPrimary || false,
    }
    const result = isNew
      ? await apiSubResource('emergency-contacts', 'POST', undefined, body)
      : await apiSubResource('emergency-contacts', 'PUT', editingContactId!, body)
    if (result.success) {
      await fetchEmployee()
      setShowAddContact(false)
      setEditingContactId(null)
      setContactForm({})
    }
  }, [contactForm, editingContactId, apiSubResource, fetchEmployee])

  const deleteContact = useCallback(async (id: string) => {
    const result = await apiSubResource('emergency-contacts', 'DELETE', id)
    if (result.success) await fetchEmployee()
  }, [apiSubResource, fetchEmployee])

  // Education CRUD
  const saveEducation = useCallback(async (isNew: boolean) => {
    if (!educationForm.degree?.trim() || !educationForm.institution?.trim()) return
    const body = {
      degree: educationForm.degree.trim(),
      institution: educationForm.institution.trim(),
      fieldOfStudy: educationForm.fieldOfStudy || null,
      startYear: educationForm.startYear || null,
      endYear: educationForm.endYear || null,
      grade: educationForm.grade || null,
      country: educationForm.country || null,
    }
    const result = isNew
      ? await apiSubResource('education', 'POST', undefined, body)
      : await apiSubResource('education', 'PUT', editingEducationId!, body)
    if (result.success) {
      await fetchEmployee()
      setShowAddEducation(false)
      setEditingEducationId(null)
      setEducationForm({})
    }
  }, [educationForm, editingEducationId, apiSubResource, fetchEmployee])

  const deleteEducation = useCallback(async (id: string) => {
    const result = await apiSubResource('education', 'DELETE', id)
    if (result.success) await fetchEmployee()
  }, [apiSubResource, fetchEmployee])

  // Work History CRUD
  const saveWork = useCallback(async (isNew: boolean) => {
    if (!workForm.employer?.trim() || !workForm.jobTitle?.trim() || !workForm.startDate) return
    const body = {
      employer: workForm.employer.trim(),
      jobTitle: workForm.jobTitle.trim(),
      department: workForm.department || null,
      startDate: workForm.startDate,
      endDate: workForm.endDate || null,
      reasonForLeaving: workForm.reasonForLeaving || null,
      location: workForm.location || null,
    }
    const result = isNew
      ? await apiSubResource('work-history', 'POST', undefined, body)
      : await apiSubResource('work-history', 'PUT', editingWorkId!, body)
    if (result.success) {
      await fetchEmployee()
      setShowAddWork(false)
      setEditingWorkId(null)
      setWorkForm({})
    }
  }, [workForm, editingWorkId, apiSubResource, fetchEmployee])

  const deleteWork = useCallback(async (id: string) => {
    const result = await apiSubResource('work-history', 'DELETE', id)
    if (result.success) await fetchEmployee()
  }, [apiSubResource, fetchEmployee])

  // Skills CRUD
  const saveSkill = useCallback(async () => {
    if (!skillForm.skillName.trim()) return
    const body = {
      skillName: skillForm.skillName.trim(),
      proficiency: skillForm.proficiency,
      yearsOfExp: skillForm.yearsOfExp ? parseInt(skillForm.yearsOfExp, 10) : null,
    }
    const result = await apiSubResource('skills', 'POST', undefined, body)
    if (result.success) {
      await fetchEmployee()
      setShowAddSkill(false)
      setSkillForm({ skillName: '', proficiency: 'INTERMEDIATE', yearsOfExp: '' })
    }
  }, [skillForm, apiSubResource, fetchEmployee])

  const deleteSkill = useCallback(async (id: string) => {
    const result = await apiSubResource('skills', 'DELETE', id)
    if (result.success) await fetchEmployee()
  }, [apiSubResource, fetchEmployee])

  // Language CRUD
  const saveLanguage = useCallback(async (isNew: boolean) => {
    if (!languageForm.language?.trim()) return
    const body = {
      language: languageForm.language.trim(),
      readLevel: languageForm.readLevel || null,
      writeLevel: languageForm.writeLevel || null,
      speakLevel: languageForm.speakLevel || null,
    }
    const result = isNew
      ? await apiSubResource('languages', 'POST', undefined, body)
      : await apiSubResource('languages', 'PUT', editingLanguageId!, body)
    if (result.success) {
      await fetchEmployee()
      setShowAddLanguage(false)
      setEditingLanguageId(null)
      setLanguageForm({})
    }
  }, [languageForm, editingLanguageId, apiSubResource, fetchEmployee])

  const deleteLanguage = useCallback(async (id: string) => {
    const result = await apiSubResource('languages', 'DELETE', id)
    if (result.success) await fetchEmployee()
  }, [apiSubResource, fetchEmployee])

  // Certification CRUD
  // Document upload helper for education/work/cert rows
  const uploadRowDocument = useCallback(async (
    resource: 'education' | 'work-history' | 'certifications',
    recordId: string,
    docType: string,
    file: File,
  ) => {
    // 1. Upload file via documents API
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', docType)
    formData.append('name', `${docType} - ${file.name}`)
    try {
      const uploadRes = await fetch(`/api/v1/hr/employees/${employeeId}/documents`, {
        method: 'POST',
        body: formData,
      })
      const uploadJson = await uploadRes.json()
      if (!uploadJson.success) return
      // 2. Update the record's filePath
      const filePath = uploadJson.data.filePath
      await fetch(`/api/v1/hr/employees/${employeeId}/${resource}/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      })
      await fetchEmployee()
    } catch { /* silently fail */ }
  }, [employeeId, fetchEmployee])

  const removeRowDocument = useCallback(async (
    resource: 'education' | 'work-history' | 'certifications',
    recordId: string,
  ) => {
    await fetch(`/api/v1/hr/employees/${employeeId}/${resource}/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: null }),
    })
    await fetchEmployee()
  }, [employeeId, fetchEmployee])

  // Compliance document upload helper
  const uploadComplianceDoc = useCallback(async (
    field: string,
    docType: string,
    file: File,
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', docType)
    formData.append('name', `${docType} - ${file.name}`)
    try {
      const uploadRes = await fetch(`/api/v1/hr/employees/${employeeId}/documents`, {
        method: 'POST',
        body: formData,
      })
      const uploadJson = await uploadRes.json()
      if (!uploadJson.success) return
      await fetch(`/api/v1/hr/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: uploadJson.data.filePath }),
      })
      await fetchEmployee()
    } catch { /* silently fail */ }
  }, [employeeId, fetchEmployee])

  const saveCert = useCallback(async (isNew: boolean) => {
    if (!certForm.name?.trim() || !certForm.issuingOrg?.trim()) return
    const body = {
      name: certForm.name.trim(),
      issuingOrg: certForm.issuingOrg.trim(),
      issueDate: certForm.issueDate || null,
      expiryDate: certForm.expiryDate || null,
      certificateNo: certForm.certificateNo || null,
    }
    const result = isNew
      ? await apiSubResource('certifications', 'POST', undefined, body)
      : await apiSubResource('certifications', 'PUT', editingCertId!, body)
    if (result.success) {
      await fetchEmployee()
      setShowAddCert(false)
      setEditingCertId(null)
      setCertForm({})
    }
  }, [certForm, editingCertId, apiSubResource, fetchEmployee])

  const deleteCert = useCallback(async (id: string) => {
    const result = await apiSubResource('certifications', 'DELETE', id)
    if (result.success) await fetchEmployee()
  }, [apiSubResource, fetchEmployee])

  // ═══ Localized name display ═══
  const localizedNameDisplay = useMemo(() => {
    if (!employee?.localizedName) return null
    if (typeof employee.localizedName === 'string') return employee.localizedName
    const obj = employee.localizedName as Record<string, string>
    return Object.values(obj).filter(Boolean).join(' / ')
  }, [employee?.localizedName])

  const headerReadinessWarnings = useMemo(
    () => employee ? getHeaderReadinessWarnings(employee, profileSummary) : [],
    [employee, profileSummary],
  )

  // ═══ Loading / Not Found ═══

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
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
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

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader title={t('form.employeeDetails')} description="">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
          {!READ_ONLY_TABS.has(activeTab) && activeTab !== 'documents' && activeTab !== 'education' && (
            <Button
              size="sm"
              variant={isEditing ? 'outline' : 'default'}
              onClick={toggleEdit}
            >
              {isEditing ? (
                <><X className="h-4 w-4 mr-2" />{tc('buttons.cancel')}</>
              ) : (
                <><Pencil className="h-4 w-4 mr-2" />{tc('buttons.edit')}</>
              )}
            </Button>
          )}
          {isEditing && (
            <Button size="sm" onClick={saveCurrentTab} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {tc('buttons.save')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Profile Header Card ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative h-20 w-20 shrink-0 group">
                {employee.photo ? (
                  <img src={documentUrl(employee.photo)} alt={employee.fullName} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                    {getInitials(employee.fullName)}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="h-5 w-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('type', 'PHOTO')
                    formData.append('name', 'Profile Photo')
                    try {
                      const uploadRes = await fetch(`/api/v1/hr/employees/${employeeId}/documents`, { method: 'POST', body: formData })
                      const uploadJson = await uploadRes.json()
                      if (uploadJson.success) {
                        await fetch(`/api/v1/hr/employees/${employeeId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ photo: uploadJson.data.filePath }),
                        })
                        await fetchEmployee()
                      }
                    } catch {}
                    e.target.value = ''
                  }} />
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold">{employee.fullName}</h2>
                {localizedNameDisplay && (
                  <span className="text-muted-foreground text-sm">({localizedNameDisplay})</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                <span className="font-mono">{employee.employeeNo}</span>
                <span>&middot;</span>
                <span>{employee.designation?.title}</span>
                <span>&middot;</span>
                <span>{employee.department?.name}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <StatusBadge status={employee.status} />
                <StatusBadge status={employee.employmentType} />
                {employee.isExpatriate && <Badge variant="secondary">Expatriate</Badge>}
                {headerReadinessWarnings.map((warning) => (
                  <Badge key={warning} variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                    <AlertTriangle className="h-3 w-3" />
                    {warning}
                  </Badge>
                ))}
              </div>

              {/* Smart Buttons */}
              {profileSummary && (
                <div className="flex flex-wrap gap-2">
                  {profileSummary.leaveBalance.totalRemaining > 0 && (
                    <Badge variant="outline" className="gap-1 py-1">
                      <Calendar className="h-3 w-3" />
                      {t('profile.tabs.leave')}: {profileSummary.leaveBalance.totalRemaining}d
                    </Badge>
                  )}
                  {profileSummary.contractStatus.hasActive && profileSummary.contractStatus.daysLeft != null && (
                    <Badge variant={profileSummary.contractStatus.daysLeft < 30 ? 'destructive' : 'outline'} className="gap-1 py-1">
                      <ScrollText className="h-3 w-3" />
                      {t('profile.tabs.contracts')}: {profileSummary.contractStatus.daysLeft}d
                    </Badge>
                  )}
                  {profileSummary.pfBalance.enrolled && (
                    <Badge variant="outline" className="gap-1 py-1">
                      <DollarSign className="h-3 w-3" />
                      PF: {formatCurrency(profileSummary.pfBalance.balance)}
                    </Badge>
                  )}
                  {profileSummary.activeProjects.count > 0 && (
                    <Badge variant="outline" className="gap-1 py-1">
                      <FolderOpen className="h-3 w-3" />
                      {profileSummary.activeProjects.count} {t('profile.tabs.projects')}
                    </Badge>
                  )}
                  {profileSummary.onboardingProgress.total > 0 && profileSummary.onboardingProgress.percentage < 100 && (
                    <Badge variant="outline" className="gap-1 py-1">
                      <Check className="h-3 w-3" />
                      Onboarding: {profileSummary.onboardingProgress.percentage}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Contact Quick Info */}
            <div className="flex-shrink-0 space-y-1 text-sm text-muted-foreground">
              {employee.email && (
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{employee.email}</div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{employee.phone}</div>
              )}
              {employee.dutyStation && (
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{employee.dutyStation}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs with scroll + arrow buttons ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ScrollableTabBar activeTab={activeTab} t={t} />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 1: Personal Information                               */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="personal" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle>{t('form.personalInfo')}</CardTitle></CardHeader>
            <CardContent>
              {!editingTabs.personal ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label={t('fields.fullName')} value={employee.fullName} />
                  <Field label={t('form.localizedName')} value={localizedNameDisplay} />
                  <Field label={t('form.fatherName')} value={employee.fatherName} />
                  <Field label={t('form.motherName')} value={employee.motherName} />
                  <Field label={t('form.spouseName')} value={employee.spouseName} />
                  <Field
                    label={t('form.dateOfBirth')}
                    value={employee.dateOfBirth ? `${formatDate(employee.dateOfBirth)} (${calculateAge(employee.dateOfBirth)} yrs)` : null}
                  />
                  <Field label={t('form.gender')} value={employee.gender ? t(`form.genders.${employee.gender}`) : null} />
                  <Field label={t('form.maritalStatus')} value={employee.maritalStatus ? t(`form.maritalStatuses.${employee.maritalStatus}`) : null} />
                  <Field label={t('form.bloodGroup')} value={employee.bloodGroup ? t(`form.bloodGroups.${BLOOD_GROUP_KEYS[employee.bloodGroup] || employee.bloodGroup}`) : null} />
                  <Field label={t('form.religion')} value={employee.religion ? formatRawLabel(normalizeReligionValue(employee.religion)) : null} />
                  <Field label={t('form.nationality')} value={employee.nationality} />
                  <Field label={t('form.birthPlace')} value={employee.birthPlace} />
                  <Field label={t('form.nidNumber')} value={employee.nidNumber} mono />
                  <Field label={t('form.passport')} value={employee.passport} mono />
                  <Field label={t('form.disability')} value={employee.disability} />
                  <Field label={t('fields.phone')} value={employee.phone} />
                  <Field label={t('fields.email')} value={employee.email} />
                  <Field label={t('form.presentAddress')} value={employee.presentAddress} />
                  <Field label={t('form.permanentAddress')} value={employee.permanentAddress} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('fields.fullName')} *</Label>
                    <Input value={String(personalForm.fullName || '')} onChange={e => setPersonalForm(p => ({ ...p, fullName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.localizedName')}</Label>
                    <Input value={String(personalForm.localizedName || '')} onChange={e => setPersonalForm(p => ({ ...p, localizedName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.fatherName')}</Label>
                    <Input value={String(personalForm.fatherName || '')} onChange={e => setPersonalForm(p => ({ ...p, fatherName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.motherName')}</Label>
                    <Input value={String(personalForm.motherName || '')} onChange={e => setPersonalForm(p => ({ ...p, motherName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.spouseName')}</Label>
                    <Input value={String(personalForm.spouseName || '')} onChange={e => setPersonalForm(p => ({ ...p, spouseName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.dateOfBirth')}</Label>
                    <Input type="date" value={String(personalForm.dateOfBirth || '')} onChange={e => setPersonalForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.gender')}</Label>
                    <SearchableSelect
                      options={GENDERS.map(g => ({ value: g, label: t(`form.genders.${g}`) }))}
                      value={String(personalForm.gender || '')}
                      onValueChange={v => setPersonalForm(p => ({ ...p, gender: v }))}
                      placeholder={t('form.gender')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.maritalStatus')}</Label>
                    <SearchableSelect
                      options={MARITAL_STATUSES.map(m => ({ value: m, label: t(`form.maritalStatuses.${m}`) }))}
                      value={String(personalForm.maritalStatus || '')}
                      onValueChange={v => setPersonalForm(p => ({ ...p, maritalStatus: v }))}
                      placeholder={t('form.maritalStatus')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.bloodGroup')}</Label>
                    <SearchableSelect
                      options={BLOOD_GROUPS.map(b => ({ value: b, label: b }))}
                      value={String(personalForm.bloodGroup || '')}
                      onValueChange={v => setPersonalForm(p => ({ ...p, bloodGroup: v }))}
                      placeholder={t('form.bloodGroup')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.religion')}</Label>
                    <SearchableSelect
                      options={RELIGIONS.map(r => ({ value: r.value, label: t(`form.religions.${r.labelKey}`) }))}
                      value={String(personalForm.religion || '')}
                      onValueChange={v => setPersonalForm(p => ({ ...p, religion: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.nationality')}</Label>
                    <Input value={String(personalForm.nationality || '')} onChange={e => setPersonalForm(p => ({ ...p, nationality: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.birthPlace')}</Label>
                    <Input value={String(personalForm.birthPlace || '')} onChange={e => setPersonalForm(p => ({ ...p, birthPlace: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.nidNumber')}</Label>
                    <Input value={String(personalForm.nidNumber || '')} onChange={e => setPersonalForm(p => ({ ...p, nidNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.passport')}</Label>
                    <Input value={String(personalForm.passport || '')} onChange={e => setPersonalForm(p => ({ ...p, passport: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.disability')}</Label>
                    <Input value={String(personalForm.disability || '')} onChange={e => setPersonalForm(p => ({ ...p, disability: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('fields.phone')}</Label>
                    <Input type="tel" value={String(personalForm.phone || '')} onChange={e => setPersonalForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('fields.email')}</Label>
                    <Input type="email" value={String(personalForm.email || '')} onChange={e => setPersonalForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('form.presentAddress')}</Label>
                    <Textarea value={String(personalForm.presentAddress || '')} onChange={e => setPersonalForm(p => ({ ...p, presentAddress: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('form.permanentAddress')}</Label>
                    <Textarea value={String(personalForm.permanentAddress || '')} onChange={e => setPersonalForm(p => ({ ...p, permanentAddress: e.target.value }))} rows={2} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('emergencyContacts.title')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setShowAddContact(true); setContactForm({ relationship: 'OTHER', isPrimary: false }) }}>
                <Plus className="h-4 w-4 mr-1" />{tc('buttons.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('emergencyContacts.name')}</TableHead>
                    <TableHead>{t('emergencyContacts.relationship')}</TableHead>
                    <TableHead>{t('fields.phone')}</TableHead>
                    <TableHead>{t('emergencyContacts.altPhone')}</TableHead>
                    <TableHead>{t('emergencyContacts.primary')}</TableHead>
                    <TableHead className="w-24">{tc('labels.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employee.emergencyContacts || []).map(contact => (
                    editingContactId === contact.id ? (
                      <TableRow key={contact.id}>
                        <TableCell><Input value={contactForm.contactName || ''} onChange={e => setContactForm(f => ({ ...f, contactName: e.target.value }))} /></TableCell>
                        <TableCell>
                          <SearchableSelect
                            options={RELATIONSHIPS.map(r => ({ value: r, label: t(`form.relationships.${r}`) }))}
                            value={contactForm.relationship || ''}
                            onValueChange={v => setContactForm(f => ({ ...f, relationship: v }))}
                          />
                        </TableCell>
                        <TableCell><Input value={contactForm.phone || ''} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} /></TableCell>
                        <TableCell><Input value={contactForm.alternatePhone || ''} onChange={e => setContactForm(f => ({ ...f, alternatePhone: e.target.value }))} /></TableCell>
                        <TableCell>
                          <input type="checkbox" checked={contactForm.isPrimary || false} onChange={e => setContactForm(f => ({ ...f, isPrimary: e.target.checked }))} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => saveContact(false)}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingContactId(null); setContactForm({}) }}><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.contactName}</TableCell>
                        <TableCell>{formatRelationship(contact.relationship)}</TableCell>
                        <TableCell className="font-mono text-xs">{contact.phone}</TableCell>
                        <TableCell className="font-mono text-xs">{contact.alternatePhone || '\u2014'}</TableCell>
                        <TableCell>{contact.isPrimary ? <Badge variant="default">Primary</Badge> : '\u2014'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => {
                              setEditingContactId(contact.id)
                              setContactForm({ ...contact })
                            }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteContact(contact.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                  {(employee.emergencyContacts || []).length === 0 && !showAddContact && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">{tc('labels.noData')}</TableCell></TableRow>
                  )}
                  {showAddContact && (
                    <TableRow>
                      <TableCell><Input placeholder={t('emergencyContacts.name')} value={contactForm.contactName || ''} onChange={e => setContactForm(f => ({ ...f, contactName: e.target.value }))} /></TableCell>
                      <TableCell>
                        <SearchableSelect
                          options={RELATIONSHIPS.map(r => ({ value: r, label: t(`form.relationships.${r}`) }))}
                          value={contactForm.relationship || ''}
                          onValueChange={v => setContactForm(f => ({ ...f, relationship: v }))}
                          placeholder={t('emergencyContacts.relationship')}
                        />
                      </TableCell>
                      <TableCell><Input placeholder={t('fields.phone')} value={contactForm.phone || ''} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} /></TableCell>
                      <TableCell><Input placeholder={t('emergencyContacts.altPhone')} value={contactForm.alternatePhone || ''} onChange={e => setContactForm(f => ({ ...f, alternatePhone: e.target.value }))} /></TableCell>
                      <TableCell>
                        <input type="checkbox" checked={contactForm.isPrimary || false} onChange={e => setContactForm(f => ({ ...f, isPrimary: e.target.checked }))} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => saveContact(true)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setShowAddContact(false); setContactForm({}) }}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 2: Employment Information                             */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="employment" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle>{t('form.employmentInfo')}</CardTitle></CardHeader>
            <CardContent>
              {!editingTabs.employment ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label={t('fields.employeeNo')} value={employee.employeeNo} mono />
                  <Field label={t('fields.status')} value={<StatusBadge status={employee.status} />} />
                  <Field label={t('fields.department')} value={employee.department?.name} />
                  <Field label={t('fields.designation')} value={employee.designation?.title} />
                  <Field
                    label="Business Unit / Concern"
                    value={(() => {
                      const unit = employee.primaryBusinessUnit || businessUnits.find(bu => bu.id === employee.primaryBusinessUnitId)
                      return unit ? `${unit.code} - ${unit.shortName || unit.name}` : null
                    })()}
                  />
                  <Field label={t('fields.employmentType')} value={<StatusBadge status={employee.employmentType} />} />
                  <Field label="Grade / Pay Level" value={formatSalaryGradePayLevel(employee)} />
                  <Field label={t('fields.joiningDate')} value={formatDate(employee.joiningDate)} />
                  <Field label={t('form.confirmationDate')} value={employee.confirmationDate ? formatDate(employee.confirmationDate) : null} />
                  <Field label={t('form.probationEndDate')} value={employee.probationEndDate ? formatDate(employee.probationEndDate) : null} />
                  <Field label={t('form.endDate')} value={employee.endDate ? formatDate(employee.endDate) : null} />
                  <Field label={t('form.dutyStation')} value={employee.dutyStation} />
                  <Field label={t('form.costCenter')} value={employee.costCenter} />
                  <Field
                    label={t('form.reportingTo')}
                    value={employee.reportingTo ? (
                      <button
                        onClick={() => router.push(`/hr/employees/${employee.reportingTo!.id}`)}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {employee.reportingTo.fullName}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : null}
                  />
                  <Field label={t('form.shiftSchedule')} value={employee.shiftSchedule} />
                  <Field label={t('form.workingHoursPerWeek')} value={employee.workingHoursPerWeek != null ? `${employee.workingHoursPerWeek} hours` : null} />
                  <Field label={t('form.noticePeriod')} value={employee.noticePeriodDays != null ? `${employee.noticePeriodDays} days` : null} />
                  <Field label={t('form.isExpatriate')} value={employee.isExpatriate ? <Badge variant="secondary">Yes</Badge> : null} />
                  <Field label={t('form.convertedFrom')} value={employee.convertedFromApplicationId ? employee.convertedFromApplicationId : null} mono />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employee No — read-only */}
                  <div className="space-y-2">
                    <Label>{t('fields.employeeNo')}</Label>
                    <Input value={employee.employeeNo} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('fields.status')}</RequiredLabel></Label>
                    <SearchableSelect
                      options={STATUSES.map(s => ({ value: s, label: tc(`status.${s}`) }))}
                      value={String(employmentForm.status || '')}
                      onValueChange={v => setEmploymentForm(p => ({ ...p, status: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('fields.department')}</RequiredLabel></Label>
                    <SearchableSelect
                      options={departments.map(d => ({ value: d.id, label: d.name }))}
                      value={String(employmentForm.departmentId || '')}
                      onValueChange={v => setEmploymentForm(p => ({ ...p, departmentId: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('fields.designation')}</RequiredLabel></Label>
                    <SearchableSelect
                      options={designations.map(d => ({ value: d.id, label: d.title }))}
                      value={String(employmentForm.designationId || '')}
                      onValueChange={v => setEmploymentForm(p => ({ ...p, designationId: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>Business Unit / Concern</RequiredLabel></Label>
                    <SearchableSelect
                      options={[
                        { value: '', label: 'No concern assigned' },
                        ...businessUnits.map(bu => ({
                          value: bu.id,
                          label: `${bu.code} - ${bu.shortName || bu.name}`,
                        })),
                      ]}
                      value={String(employmentForm.primaryBusinessUnitId || '')}
                      onValueChange={v => setEmploymentForm(p => ({ ...p, primaryBusinessUnitId: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('fields.employmentType')}</RequiredLabel></Label>
                    <SearchableSelect
                      options={EMPLOYMENT_TYPES.map(et => ({ value: et, label: tc(`employmentTypes.${et}`) }))}
                      value={String(employmentForm.employmentType || '')}
                      onValueChange={v => setEmploymentForm(p => ({ ...p, employmentType: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade / Pay Level</Label>
                    <Input value={String(employmentForm.gradeLevel || '')} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('fields.joiningDate')}</RequiredLabel></Label>
                    <Input required type="date" value={String(employmentForm.joiningDate || '')} onChange={e => setEmploymentForm(p => ({ ...p, joiningDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.confirmationDate')}</Label>
                    <Input type="date" value={String(employmentForm.confirmationDate || '')} onChange={e => setEmploymentForm(p => ({ ...p, confirmationDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.probationEndDate')}</Label>
                    <Input type="date" value={String(employmentForm.probationEndDate || '')} onChange={e => setEmploymentForm(p => ({ ...p, probationEndDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.endDate')}</Label>
                    <Input type="date" value={String(employmentForm.endDate || '')} onChange={e => setEmploymentForm(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.reportingTo')}</Label>
                    <SearchableSelect
                      options={[
                        { value: '', label: '— None —' },
                        ...(employee.directReports || []).length === 0
                          ? departments.length > 0
                            ? [{ value: employee.reportingTo?.id || '', label: employee.reportingTo?.fullName || '' }].filter(o => o.value)
                            : []
                          : [],
                        ...(employee.reportingTo ? [{ value: employee.reportingTo.id, label: `${employee.reportingTo.fullName} (${employee.reportingTo.employeeNo})` }] : []),
                      ].filter((o, i, arr) => arr.findIndex(x => x.value === o.value) === i)}
                      value={String(employmentForm.reportingToId || '')}
                      onValueChange={v => setEmploymentForm(p => ({ ...p, reportingToId: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.dutyStation')}</Label>
                    <Input value={String(employmentForm.dutyStation || '')} onChange={e => setEmploymentForm(p => ({ ...p, dutyStation: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.costCenter')}</Label>
                    <Input value={String(employmentForm.costCenter || '')} onChange={e => setEmploymentForm(p => ({ ...p, costCenter: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.shiftSchedule')}</Label>
                    <Input value={String(employmentForm.shiftSchedule || '')} onChange={e => setEmploymentForm(p => ({ ...p, shiftSchedule: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.workingHoursPerWeek')}</Label>
                    <Input type="number" value={String(employmentForm.workingHoursPerWeek || '')} onChange={e => setEmploymentForm(p => ({ ...p, workingHoursPerWeek: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.noticePeriod')}</Label>
                    <Input type="number" value={String(employmentForm.noticePeriodDays || '')} onChange={e => setEmploymentForm(p => ({ ...p, noticePeriodDays: e.target.value }))} />
                  </div>
                  <div className="space-y-2 flex items-center gap-2 pt-6">
                    <input type="checkbox" id="edit-expat" checked={Boolean(employmentForm.isExpatriate)} onChange={e => setEmploymentForm(p => ({ ...p, isExpatriate: e.target.checked }))} />
                    <Label htmlFor="edit-expat">{t('form.isExpatriate')}</Label>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('form.convertedFrom')}</Label>
                    <Input value={employee.convertedFromApplicationId || ''} disabled className="bg-muted font-mono" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Direct Reports */}
          {employee.directReports && employee.directReports.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t('form.directReports')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {employee.directReports.map(dr => (
                    <button
                      key={dr.id}
                      onClick={() => router.push(`/hr/employees/${dr.id}`)}
                      className="text-left p-3 rounded-lg border hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {getInitials(dr.fullName)}
                      </div>
                      <div>
                        <span className="font-medium text-sm">{dr.fullName}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">{dr.employeeNo}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 3: Compensation & Benefits                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="compensation" className="space-y-6 mt-6">
          {!editingTabs.compensation ? (
            <>
              {/* Salary Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.salaryBreakdown')}</CardTitle>
                  {employee.salaryGrade && (
                    <p className="text-sm text-muted-foreground">
                      {employee.salaryGrade.code} — Pay Level {effectiveSalaryStep?.stepNo || employee.salaryStepNo || 1}
                      {employee.salaryStructure && <> &middot; {employee.salaryStructure.name}</>}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {employee.salaryGrade && employee.salaryStructure && effectiveSalaryStep ? (() => {
                    const hasActiveProvidentFund = Boolean(profileSummary?.pfBalance.enrolled)
                    const breakdown = calculateSalaryBreakdown(employee, hasActiveProvidentFund)
                    const { basic, earnings, deductions, gross, net } = breakdown
                    const pendingProvidentFundDeductions = getPendingProvidentFundDeductions(employee, hasActiveProvidentFund)

                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('profile.component')}</TableHead>
                            <TableHead className="text-right">{t('fields.amount')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-muted/30">
                            <TableCell className="font-medium">{t('fields.basicSalary')}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(basic)}</TableCell>
                          </TableRow>
                          {earnings.length > 0 && earnings.map((e, i) => (
                            <TableRow key={`e-${i}`}>
                              <TableCell className="text-green-700 dark:text-green-400">(+) {e.name}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(e.amount)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold border-t-2">
                            <TableCell>{t('form.grossSalary')}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(gross)}</TableCell>
                          </TableRow>
                          {pendingProvidentFundDeductions.map((name) => (
                            <TableRow key={`pf-pending-${name}`}>
                              <TableCell className="text-red-600 dark:text-red-400">(-) {name}</TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">Not deducted - PF enroll needed</TableCell>
                            </TableRow>
                          ))}
                          {deductions.length > 0 && deductions.map((d, i) => (
                            <TableRow key={`d-${i}`}>
                              <TableCell className="text-red-600 dark:text-red-400">(-) {d.name}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(d.amount)}</TableCell>
                            </TableRow>
                          ))}
                          {(deductions.length > 0 || pendingProvidentFundDeductions.length > 0) && (
                            <TableRow className="font-bold border-t-2">
                              <TableCell>{t('profile.netSalary') || 'Net Salary'}</TableCell>
                              <TableCell className="text-right font-mono text-primary">{formatCurrency(net)}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )
                  })() : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('profile.component')}</TableHead>
                          <TableHead className="text-right">{t('fields.amount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{t('fields.basicSalary')}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(num(employee.basicSalary))}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('form.houseRentAllowance')}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(num(employee.houseRentAllowance))}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('form.medicalAllowance')}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(num(employee.medicalAllowance))}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('form.transportAllowance')}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(num(employee.transportAllowance))}</TableCell>
                        </TableRow>
                        {employee.otherAllowances && Array.isArray(employee.otherAllowances) && employee.otherAllowances.map((a, i) => (
                          <TableRow key={i}>
                            <TableCell>{a.name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(a.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold border-t-2">
                          <TableCell>{t('form.grossSalary')}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(
                            num(employee.grossSalary) || (
                              num(employee.basicSalary) + num(employee.houseRentAllowance) +
                              num(employee.medicalAllowance) + num(employee.transportAllowance) +
                              (employee.otherAllowances || []).reduce((sum, a) => sum + (a.amount || 0), 0)
                            )
                          )}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader><CardTitle>{t('profile.paymentDetails')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <Field label={t('form.payFrequency')} value={employee.payFrequency ? t(`form.payFrequencies.${employee.payFrequency}`) : null} />
                    <Field label={t('form.paymentMethod')} value={employee.paymentMethod ? t(`form.paymentMethods.${employee.paymentMethod}`) : null} />
                    <Field label={t('form.bankName')} value={employee.bankName} />
                    <Field label={t('form.bankBranch')} value={employee.bankBranch} />
                    <Field label={t('form.bankAccountNo')} value={employee.bankAccountNo} mono />
                    <Field label={t('form.bankRoutingNo')} value={employee.bankRoutingNo} mono />
                    <Field label={t('form.mobileBankingProvider')} value={employee.mobileBankingProvider} />
                    <Field label={t('form.mobileBankingNumber')} value={employee.mobileBankingNumber} mono />
                    <Field label={t('form.tinNumber')} value={employee.tinNumber} mono />
                    <Field label={t('form.taxCircle')} value={employee.taxCircle} />
                    <Field label={t('form.taxZone')} value={employee.taxZone} />
                  </div>
                </CardContent>
              </Card>

              {/* Retirement Benefits */}
              {profileSummary && (
                <Card>
                  <CardHeader><CardTitle>{t('profile.retirementBenefits')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg border space-y-2">
                        <h4 className="font-medium text-sm">{t('profile.providentFund')}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={profileSummary.pfBalance.enrolled ? 'default' : 'secondary'}>
                            {profileSummary.pfBalance.enrolled ? t('profile.enrolled') : t('profile.notEnrolled')}
                          </Badge>
                        </div>
                        {profileSummary.pfBalance.enrolled && (
                          <p className="text-lg font-mono font-semibold">{formatCurrency(profileSummary.pfBalance.balance)}</p>
                        )}
                      </div>
                      <div className="p-4 rounded-lg border space-y-2">
                        <h4 className="font-medium text-sm">{t('profile.gratuity')}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={profileSummary.gratuityAccrual.eligible ? 'default' : 'secondary'}>
                            {profileSummary.gratuityAccrual.eligible ? t('profile.eligible') : t('profile.notEligible')}
                          </Badge>
                        </div>
                        {profileSummary.gratuityAccrual.eligible && (
                          <p className="text-lg font-mono font-semibold">{formatCurrency(profileSummary.gratuityAccrual.accrued)}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader><CardTitle>{t('profile.tabs.compensation')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('fields.basicSalary')}</RequiredLabel></Label>
                    <Input required type="number" min="0.01" step="0.01" value={compensationForm.basicSalary || ''} onChange={e => setCompensationForm(p => ({ ...p, basicSalary: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.houseRentAllowance')}</Label>
                    <Input type="number" min="0" step="0.01" value={compensationForm.houseRentAllowance || ''} onChange={e => setCompensationForm(p => ({ ...p, houseRentAllowance: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.medicalAllowance')}</Label>
                    <Input type="number" min="0" step="0.01" value={compensationForm.medicalAllowance || ''} onChange={e => setCompensationForm(p => ({ ...p, medicalAllowance: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.transportAllowance')}</Label>
                    <Input type="number" min="0" step="0.01" value={compensationForm.transportAllowance || ''} onChange={e => setCompensationForm(p => ({ ...p, transportAllowance: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.grossSalary')}</Label>
                    <Input type="number" min="0" step="0.01" value={compensationForm.grossSalary || ''} onChange={e => setCompensationForm(p => ({ ...p, grossSalary: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('form.payFrequency')}</RequiredLabel></Label>
                    <SearchableSelect
                      options={PAY_FREQUENCIES.map(f => ({ value: f, label: t(`form.payFrequencies.${f}`) }))}
                      value={compensationForm.payFrequency || ''}
                      onValueChange={v => setCompensationForm(p => ({ ...p, payFrequency: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label><RequiredLabel>{t('form.paymentMethod')}</RequiredLabel></Label>
                    <SearchableSelect
                      options={PAYMENT_METHODS.map(m => ({ value: m, label: t(`form.paymentMethods.${m}`) }))}
                      value={compensationForm.paymentMethod || ''}
                      onValueChange={v => setCompensationForm(p => ({ ...p, paymentMethod: v }))}
                    />
                  </div>
                  <Separator className="md:col-span-2 my-2" />
                  <div className="space-y-2">
                    <Label>{compensationForm.paymentMethod === 'BANK_TRANSFER' ? <RequiredLabel>{t('form.bankName')}</RequiredLabel> : t('form.bankName')}</Label>
                    <Input value={compensationForm.bankName || ''} onChange={e => setCompensationForm(p => ({ ...p, bankName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.bankBranch')}</Label>
                    <Input value={compensationForm.bankBranch || ''} onChange={e => setCompensationForm(p => ({ ...p, bankBranch: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{compensationForm.paymentMethod === 'BANK_TRANSFER' ? <RequiredLabel>{t('form.bankAccountNo')}</RequiredLabel> : t('form.bankAccountNo')}</Label>
                    <Input value={compensationForm.bankAccountNo || ''} onChange={e => setCompensationForm(p => ({ ...p, bankAccountNo: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.bankRoutingNo')}</Label>
                    <Input value={compensationForm.bankRoutingNo || ''} onChange={e => setCompensationForm(p => ({ ...p, bankRoutingNo: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{compensationForm.paymentMethod === 'MOBILE_BANKING' ? <RequiredLabel>{t('form.mobileBankingProvider')}</RequiredLabel> : t('form.mobileBankingProvider')}</Label>
                    <Input value={compensationForm.mobileBankingProvider || ''} onChange={e => setCompensationForm(p => ({ ...p, mobileBankingProvider: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{compensationForm.paymentMethod === 'MOBILE_BANKING' ? <RequiredLabel>{t('form.mobileBankingNumber')}</RequiredLabel> : t('form.mobileBankingNumber')}</Label>
                    <Input value={compensationForm.mobileBankingNumber || ''} onChange={e => setCompensationForm(p => ({ ...p, mobileBankingNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.tinNumber')}</Label>
                    <Input value={compensationForm.tinNumber || ''} onChange={e => setCompensationForm(p => ({ ...p, tinNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.taxCircle')}</Label>
                    <Input value={compensationForm.taxCircle || ''} onChange={e => setCompensationForm(p => ({ ...p, taxCircle: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form.taxZone')}</Label>
                    <Input value={compensationForm.taxZone || ''} onChange={e => setCompensationForm(p => ({ ...p, taxZone: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 4: Documents                                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="documents" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle>{t('profile.requiredDocuments')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {REQUIRED_DOCUMENTS.map(doc => {
                  const uploaded = (employee.documents || []).find(d => d.type === doc.type)
                  return (
                    <div key={doc.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {uploaded ? (
                          <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{doc.label}</span>
                            {doc.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                          </div>
                          {uploaded && (
                            <div className="text-xs text-muted-foreground mt-0.5 space-x-3">
                              {uploaded.documentNumber && <span>#{uploaded.documentNumber}</span>}
                              {uploaded.issuedDate && <span>Issued: {formatDate(uploaded.issuedDate)}</span>}
                              {uploaded.expiryDate && <span>Expires: {formatDate(uploaded.expiryDate)}</span>}
                              {uploaded.issuingAuthority && <span>{uploaded.issuingAuthority}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {uploaded ? (
                          <div className="flex items-center gap-2">
                            <StatusBadge status={uploaded.verificationStatus || 'PENDING'} />
                            <span className="text-xs text-muted-foreground">{formatDate(uploaded.uploadedAt)}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => window.open(documentUrl(uploaded.filePath), '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />{tc('buttons.view')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*,.pdf,.doc,.docx'
                                input.onchange = async () => {
                                  const file = input.files?.[0]
                                  if (!file) return
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  formData.append('type', doc.type)
                                  formData.append('name', doc.label)
                                  try {
                                    const res = await fetch(`/api/v1/hr/employees/${employeeId}/documents/${uploaded.id}`, {
                                      method: 'PUT',
                                      body: formData,
                                    })
                                    const json = await res.json()
                                    if (json.success) await fetchEmployee()
                                    else setError(json.error?.message || 'Failed to replace document')
                                  } catch {
                                    setError('Failed to replace document')
                                  }
                                }
                                input.click()
                              }}
                            >
                              {tc('buttons.replace')}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*,.pdf,.doc,.docx'
                              input.onchange = async () => {
                                const file = input.files?.[0]
                                if (!file) return
                                const formData = new FormData()
                                formData.append('file', file)
                                formData.append('type', doc.type)
                                formData.append('name', doc.label)
                                try {
                                  const res = await fetch(`/api/v1/hr/employees/${employeeId}/documents`, {
                                    method: 'POST',
                                    body: formData,
                                  })
                                  const json = await res.json()
                                  if (json.success) await fetchEmployee()
                                  else setError(json.error?.message || 'Failed to upload document')
                                } catch {
                                  setError('Failed to upload document')
                                }
                              }
                              input.click()
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />{tc('buttons.upload')}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Additional Documents / FileUpload */}
          <Card>
            <CardHeader><CardTitle>{t('profile.additionalDocuments')}</CardTitle></CardHeader>
            <CardContent>
              <FileUpload
                entityType="employee"
                entityId={employeeId}
                module="hr"
                readOnly={['INACTIVE', 'SUSPENDED'].includes(employee.status)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 5: Leave & Attendance                                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="leave" className="space-y-6 mt-6">
          {/* Leave Balances */}
          <Card>
            <CardHeader><CardTitle>{t('profile.leaveBalances')}</CardTitle></CardHeader>
            <CardContent>
              {leaveBalances === null ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : leaveBalances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{tc('labels.noData')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {leaveBalances.map(lb => (
                    <div key={lb.id} className="p-4 rounded-lg border space-y-2">
                      <h4 className="font-medium text-sm">{lb.leaveType}</h4>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Entitled: {lb.entitled}</span>
                        <span>Taken: {lb.taken}</span>
                      </div>
                      <p className="text-2xl font-bold font-mono">{lb.remaining}</p>
                      <p className="text-xs text-muted-foreground">{t('profile.daysRemaining')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leave Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('profile.recentLeave')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => router.push(`/hr/leave?employeeId=${employeeId}`)}>
                {t('profile.viewAll')} <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {leaveApplications === null ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : leaveApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{tc('labels.noData')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('leave.type')}</TableHead>
                      <TableHead>{t('leave.from')}</TableHead>
                      <TableHead>{t('leave.to')}</TableHead>
                      <TableHead>{t('leave.days')}</TableHead>
                      <TableHead>{tc('labels.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveApplications.map(la => (
                      <TableRow key={la.id}>
                        <TableCell>{la.leaveType}</TableCell>
                        <TableCell>{formatDate(la.startDate)}</TableCell>
                        <TableCell>{formatDate(la.endDate)}</TableCell>
                        <TableCell>{la.days}</TableCell>
                        <TableCell><StatusBadge status={la.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 6: Projects & Allocations                             */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="projects" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('profile.projectAllocations')}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (projects.length === 0) await fetchProjects()
                  setProjectAllocationForm({
                    projectId: '',
                    percentage: '100',
                    startDate: dateStr(employee.joiningDate),
                    endDate: '',
                  })
                  setShowAddProjectAllocation(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1" />Add Allocation
              </Button>
            </CardHeader>
            <CardContent>
              {showAddProjectAllocation && (
                <div className="mb-5 rounded-lg border bg-muted/20 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Project</Label>
                      <SearchableSelect
                        options={projects.map(project => ({
                          value: project.id,
                          label: `${project.projectNo || 'PRJ'} - ${project.name}`,
                        }))}
                        value={projectAllocationForm.projectId}
                        onValueChange={v => setProjectAllocationForm(p => ({ ...p, projectId: v }))}
                        placeholder="Select project"
                        searchPlaceholder="Search projects..."
                        emptyMessage="No active projects found"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Allocation %</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={projectAllocationForm.percentage}
                        onChange={e => setProjectAllocationForm(p => ({ ...p, percentage: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('fields.startDate')}</Label>
                      <Input
                        type="date"
                        value={projectAllocationForm.startDate}
                        onChange={e => setProjectAllocationForm(p => ({ ...p, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('fields.endDate')}</Label>
                      <Input
                        type="date"
                        value={projectAllocationForm.endDate}
                        onChange={e => setProjectAllocationForm(p => ({ ...p, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddProjectAllocation(false)}
                    >
                      {tc('buttons.cancel')}
                    </Button>
                    <Button size="sm" onClick={saveProjectAllocation} disabled={projectAllocationSaving}>
                      {projectAllocationSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {tc('buttons.save')}
                    </Button>
                  </div>
                </div>
              )}
              {(!employee.projectAllocations || employee.projectAllocations.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-6">{tc('labels.noData')}</p>
              ) : (
                <>
                  {(() => {
                    const total = employee.projectAllocations!.filter(a => a.isActive).reduce((s, a) => s + num(a.percentage), 0)
                    return total !== 100 && total > 0 ? (
                      <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Total allocation is {formatNumber(total)}% (expected 100%)
                      </div>
                    ) : null
                  })()}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('profile.project')}</TableHead>
                        <TableHead>{t('profile.allocation')}</TableHead>
                        <TableHead>{t('fields.startDate')}</TableHead>
                        <TableHead>{t('fields.endDate')}</TableHead>
                        <TableHead>{tc('labels.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employee.projectAllocations!.map(pa => (
                        <TableRow key={pa.id}>
                          <TableCell>
                            <button onClick={() => router.push(`/projects/${pa.projectId}`)} className="text-primary hover:underline">
                              {pa.project?.name || pa.projectId}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono">{num(pa.percentage)}%</TableCell>
                          <TableCell>{formatDate(pa.startDate)}</TableCell>
                          <TableCell>{pa.endDate ? formatDate(pa.endDate) : '\u2014'}</TableCell>
                          <TableCell><Badge variant={pa.isActive ? 'default' : 'secondary'}>{pa.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 7: Education & Skills                                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="education" className="space-y-6 mt-6">
          {/* Education History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('profile.educationHistory')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setShowAddEducation(true); setEducationForm({ country: 'Bangladesh' }) }}>
                <Plus className="h-4 w-4 mr-1" />{tc('buttons.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('education.degree')}</TableHead>
                    <TableHead>{t('education.institution')}</TableHead>
                    <TableHead>{t('education.field')}</TableHead>
                    <TableHead>{t('education.year')}</TableHead>
                    <TableHead>{t('education.grade')}</TableHead>
                    <TableHead className="w-20">{t('profile.document')}</TableHead>
                    <TableHead className="w-24">{tc('labels.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employee.educationHistory || []).map(edu => (
                    editingEducationId === edu.id ? (
                      <TableRow key={edu.id}>
                        <TableCell><Input value={educationForm.degree || ''} onChange={e => setEducationForm(f => ({ ...f, degree: e.target.value }))} /></TableCell>
                        <TableCell><Input value={educationForm.institution || ''} onChange={e => setEducationForm(f => ({ ...f, institution: e.target.value }))} /></TableCell>
                        <TableCell><Input value={educationForm.fieldOfStudy || ''} onChange={e => setEducationForm(f => ({ ...f, fieldOfStudy: e.target.value }))} /></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Input type="number" placeholder="Start" className="w-20" value={educationForm.startYear ?? ''} onChange={e => setEducationForm(f => ({ ...f, startYear: e.target.value ? parseInt(e.target.value) : null }))} />
                            <Input type="number" placeholder="End" className="w-20" value={educationForm.endYear ?? ''} onChange={e => setEducationForm(f => ({ ...f, endYear: e.target.value ? parseInt(e.target.value) : null }))} />
                          </div>
                        </TableCell>
                        <TableCell><Input value={educationForm.grade || ''} onChange={e => setEducationForm(f => ({ ...f, grade: e.target.value }))} /></TableCell>
                        <TableCell />
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => saveEducation(false)}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingEducationId(null); setEducationForm({}) }}><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={edu.id}>
                        <TableCell className="font-medium">{edu.degree}</TableCell>
                        <TableCell>{edu.institution}</TableCell>
                        <TableCell>{edu.fieldOfStudy || '\u2014'}</TableCell>
                        <TableCell>{edu.startYear && edu.endYear ? `${edu.startYear}-${edu.endYear}` : edu.endYear || '\u2014'}</TableCell>
                        <TableCell>{edu.grade || '\u2014'}</TableCell>
                        <TableCell>
                          {edu.filePath ? (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" title={t('profile.viewDocument')} onClick={() => window.open(documentUrl(edu.filePath), '_blank')}><Eye className="h-4 w-4 text-green-600" /></Button>
                              <Button size="icon" variant="ghost" title={t('profile.removeDocument')} onClick={() => removeRowDocument('education', edu.id)}><X className="h-3 w-3 text-muted-foreground" /></Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer" title={t('profile.uploadDocument')}>
                              <Upload className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadRowDocument('education', edu.id, 'EDUCATIONAL_CERT', f); e.target.value = '' }} />
                            </label>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingEducationId(edu.id); setEducationForm({ ...edu }) }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteEducation(edu.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                  {(employee.educationHistory || []).length === 0 && !showAddEducation && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">{tc('labels.noData')}</TableCell></TableRow>
                  )}
                  {showAddEducation && (
                    <TableRow>
                      <TableCell><Input placeholder={t('education.degree')} value={educationForm.degree || ''} onChange={e => setEducationForm(f => ({ ...f, degree: e.target.value }))} /></TableCell>
                      <TableCell><Input placeholder={t('education.institution')} value={educationForm.institution || ''} onChange={e => setEducationForm(f => ({ ...f, institution: e.target.value }))} /></TableCell>
                      <TableCell><Input placeholder={t('education.field')} value={educationForm.fieldOfStudy || ''} onChange={e => setEducationForm(f => ({ ...f, fieldOfStudy: e.target.value }))} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Input type="number" placeholder="Start" className="w-20" value={educationForm.startYear ?? ''} onChange={e => setEducationForm(f => ({ ...f, startYear: e.target.value ? parseInt(e.target.value) : null }))} />
                          <Input type="number" placeholder="End" className="w-20" value={educationForm.endYear ?? ''} onChange={e => setEducationForm(f => ({ ...f, endYear: e.target.value ? parseInt(e.target.value) : null }))} />
                        </div>
                      </TableCell>
                      <TableCell><Input placeholder={t('education.grade')} value={educationForm.grade || ''} onChange={e => setEducationForm(f => ({ ...f, grade: e.target.value }))} /></TableCell>
                      <TableCell />
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => saveEducation(true)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setShowAddEducation(false); setEducationForm({}) }}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('profile.workExperience')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setShowAddWork(true); setWorkForm({}) }}>
                <Plus className="h-4 w-4 mr-1" />{tc('buttons.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('work.employer')}</TableHead>
                    <TableHead>{t('work.jobTitle')}</TableHead>
                    <TableHead>{t('fields.startDate')}</TableHead>
                    <TableHead>{t('fields.endDate')}</TableHead>
                    <TableHead>{t('work.location')}</TableHead>
                    <TableHead className="w-20">{t('profile.document')}</TableHead>
                    <TableHead className="w-24">{tc('labels.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employee.workHistory || []).map(wh => (
                    editingWorkId === wh.id ? (
                      <TableRow key={wh.id}>
                        <TableCell><Input value={workForm.employer || ''} onChange={e => setWorkForm(f => ({ ...f, employer: e.target.value }))} /></TableCell>
                        <TableCell><Input value={workForm.jobTitle || ''} onChange={e => setWorkForm(f => ({ ...f, jobTitle: e.target.value }))} /></TableCell>
                        <TableCell><Input type="date" value={dateStr(workForm.startDate)} onChange={e => setWorkForm(f => ({ ...f, startDate: e.target.value }))} /></TableCell>
                        <TableCell><Input type="date" value={dateStr(workForm.endDate)} onChange={e => setWorkForm(f => ({ ...f, endDate: e.target.value }))} /></TableCell>
                        <TableCell><Input value={workForm.location || ''} onChange={e => setWorkForm(f => ({ ...f, location: e.target.value }))} /></TableCell>
                        <TableCell />
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => saveWork(false)}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingWorkId(null); setWorkForm({}) }}><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={wh.id}>
                        <TableCell className="font-medium">{wh.employer}</TableCell>
                        <TableCell>{wh.jobTitle}</TableCell>
                        <TableCell>{formatDate(wh.startDate)}</TableCell>
                        <TableCell>{wh.endDate ? formatDate(wh.endDate) : <Badge variant="outline">Current</Badge>}</TableCell>
                        <TableCell>{wh.location || '\u2014'}</TableCell>
                        <TableCell>
                          {wh.filePath ? (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" title={t('profile.viewDocument')} onClick={() => window.open(documentUrl(wh.filePath), '_blank')}><Eye className="h-4 w-4 text-green-600" /></Button>
                              <Button size="icon" variant="ghost" title={t('profile.removeDocument')} onClick={() => removeRowDocument('work-history', wh.id)}><X className="h-3 w-3 text-muted-foreground" /></Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer" title={t('profile.uploadDocument')}>
                              <Upload className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadRowDocument('work-history', wh.id, 'EXPERIENCE_CERT', f); e.target.value = '' }} />
                            </label>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingWorkId(wh.id); setWorkForm({ ...wh }) }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteWork(wh.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                  {(employee.workHistory || []).length === 0 && !showAddWork && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">{tc('labels.noData')}</TableCell></TableRow>
                  )}
                  {showAddWork && (
                    <TableRow>
                      <TableCell><Input placeholder={t('work.employer')} value={workForm.employer || ''} onChange={e => setWorkForm(f => ({ ...f, employer: e.target.value }))} /></TableCell>
                      <TableCell><Input placeholder={t('work.jobTitle')} value={workForm.jobTitle || ''} onChange={e => setWorkForm(f => ({ ...f, jobTitle: e.target.value }))} /></TableCell>
                      <TableCell><Input type="date" value={dateStr(workForm.startDate)} onChange={e => setWorkForm(f => ({ ...f, startDate: e.target.value }))} /></TableCell>
                      <TableCell><Input type="date" value={dateStr(workForm.endDate)} onChange={e => setWorkForm(f => ({ ...f, endDate: e.target.value }))} /></TableCell>
                      <TableCell><Input placeholder={t('work.location')} value={workForm.location || ''} onChange={e => setWorkForm(f => ({ ...f, location: e.target.value }))} /></TableCell>
                      <TableCell />
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => saveWork(true)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setShowAddWork(false); setWorkForm({}) }}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('profile.skills')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAddSkill(true)}>
                <Plus className="h-4 w-4 mr-1" />{tc('buttons.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {(employee.skills || []).map(skill => (
                  <Badge key={skill.id} variant="secondary" className="gap-1 py-1.5 px-3">
                    {skill.skillName}
                    <span className="text-[10px] opacity-70">({skill.proficiency})</span>
                    {skill.yearsOfExp != null && <span className="text-[10px] opacity-70">{skill.yearsOfExp}yr</span>}
                    <button onClick={() => deleteSkill(skill.id)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {(employee.skills || []).length === 0 && !showAddSkill && (
                  <p className="text-sm text-muted-foreground">{tc('labels.noData')}</p>
                )}
              </div>
              {showAddSkill && (
                <div className="flex items-end gap-2 border-t pt-4">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('skills.name')}</Label>
                    <Input value={skillForm.skillName} onChange={e => setSkillForm(f => ({ ...f, skillName: e.target.value }))} placeholder={t('skills.name')} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('skills.proficiency')}</Label>
                    <SearchableSelect
                      options={PROFICIENCY_LEVELS.map(p => ({ value: p, label: p }))}
                      value={skillForm.proficiency}
                      onValueChange={v => setSkillForm(f => ({ ...f, proficiency: v }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('skills.years')}</Label>
                    <Input type="number" min="0" className="w-20" value={skillForm.yearsOfExp} onChange={e => setSkillForm(f => ({ ...f, yearsOfExp: e.target.value }))} />
                  </div>
                  <Button size="icon" variant="ghost" onClick={saveSkill}><Save className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { setShowAddSkill(false); setSkillForm({ skillName: '', proficiency: 'INTERMEDIATE', yearsOfExp: '' }) }}><X className="h-4 w-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('profile.languages')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setShowAddLanguage(true); setLanguageForm({}) }}>
                <Plus className="h-4 w-4 mr-1" />{tc('buttons.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('languages.language')}</TableHead>
                    <TableHead>{t('languages.read')}</TableHead>
                    <TableHead>{t('languages.write')}</TableHead>
                    <TableHead>{t('languages.speak')}</TableHead>
                    <TableHead className="w-24">{tc('labels.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employee.languages || []).map(lang => (
                    editingLanguageId === lang.id ? (
                      <TableRow key={lang.id}>
                        <TableCell><Input value={languageForm.language || ''} onChange={e => setLanguageForm(f => ({ ...f, language: e.target.value }))} /></TableCell>
                        <TableCell>
                          <SearchableSelect options={LANGUAGE_LEVELS.map(l => ({ value: l, label: l }))} value={languageForm.readLevel || ''} onValueChange={v => setLanguageForm(f => ({ ...f, readLevel: v }))} />
                        </TableCell>
                        <TableCell>
                          <SearchableSelect options={LANGUAGE_LEVELS.map(l => ({ value: l, label: l }))} value={languageForm.writeLevel || ''} onValueChange={v => setLanguageForm(f => ({ ...f, writeLevel: v }))} />
                        </TableCell>
                        <TableCell>
                          <SearchableSelect options={LANGUAGE_LEVELS.map(l => ({ value: l, label: l }))} value={languageForm.speakLevel || ''} onValueChange={v => setLanguageForm(f => ({ ...f, speakLevel: v }))} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => saveLanguage(false)}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingLanguageId(null); setLanguageForm({}) }}><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={lang.id}>
                        <TableCell className="font-medium">{lang.language}</TableCell>
                        <TableCell>{lang.readLevel || '\u2014'}</TableCell>
                        <TableCell>{lang.writeLevel || '\u2014'}</TableCell>
                        <TableCell>{lang.speakLevel || '\u2014'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingLanguageId(lang.id); setLanguageForm({ ...lang }) }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteLanguage(lang.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                  {(employee.languages || []).length === 0 && !showAddLanguage && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">{tc('labels.noData')}</TableCell></TableRow>
                  )}
                  {showAddLanguage && (
                    <TableRow>
                      <TableCell><Input placeholder={t('languages.language')} value={languageForm.language || ''} onChange={e => setLanguageForm(f => ({ ...f, language: e.target.value }))} /></TableCell>
                      <TableCell>
                        <SearchableSelect options={LANGUAGE_LEVELS.map(l => ({ value: l, label: l }))} value={languageForm.readLevel || ''} onValueChange={v => setLanguageForm(f => ({ ...f, readLevel: v }))} />
                      </TableCell>
                      <TableCell>
                        <SearchableSelect options={LANGUAGE_LEVELS.map(l => ({ value: l, label: l }))} value={languageForm.writeLevel || ''} onValueChange={v => setLanguageForm(f => ({ ...f, writeLevel: v }))} />
                      </TableCell>
                      <TableCell>
                        <SearchableSelect options={LANGUAGE_LEVELS.map(l => ({ value: l, label: l }))} value={languageForm.speakLevel || ''} onValueChange={v => setLanguageForm(f => ({ ...f, speakLevel: v }))} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => saveLanguage(true)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setShowAddLanguage(false); setLanguageForm({}) }}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('profile.certifications')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setShowAddCert(true); setCertForm({}) }}>
                <Plus className="h-4 w-4 mr-1" />{tc('buttons.add')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('certifications.name')}</TableHead>
                    <TableHead>{t('certifications.issuingOrg')}</TableHead>
                    <TableHead>{t('certifications.issueDate')}</TableHead>
                    <TableHead>{t('certifications.expiryDate')}</TableHead>
                    <TableHead>{t('certifications.certNo')}</TableHead>
                    <TableHead className="w-20">{t('profile.document')}</TableHead>
                    <TableHead className="w-24">{tc('labels.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employee.certifications || []).map(cert => (
                    editingCertId === cert.id ? (
                      <TableRow key={cert.id}>
                        <TableCell><Input value={certForm.name || ''} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} /></TableCell>
                        <TableCell><Input value={certForm.issuingOrg || ''} onChange={e => setCertForm(f => ({ ...f, issuingOrg: e.target.value }))} /></TableCell>
                        <TableCell><Input type="date" value={dateStr(certForm.issueDate)} onChange={e => setCertForm(f => ({ ...f, issueDate: e.target.value }))} /></TableCell>
                        <TableCell><Input type="date" value={dateStr(certForm.expiryDate)} onChange={e => setCertForm(f => ({ ...f, expiryDate: e.target.value }))} /></TableCell>
                        <TableCell><Input value={certForm.certificateNo || ''} onChange={e => setCertForm(f => ({ ...f, certificateNo: e.target.value }))} /></TableCell>
                        <TableCell />
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => saveCert(false)}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingCertId(null); setCertForm({}) }}><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">{cert.name}</TableCell>
                        <TableCell>{cert.issuingOrg}</TableCell>
                        <TableCell>{cert.issueDate ? formatDate(cert.issueDate) : '\u2014'}</TableCell>
                        <TableCell>{cert.expiryDate ? formatDate(cert.expiryDate) : '\u2014'}</TableCell>
                        <TableCell className="font-mono text-xs">{cert.certificateNo || '\u2014'}</TableCell>
                        <TableCell>
                          {cert.filePath ? (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" title={t('profile.viewDocument')} onClick={() => window.open(documentUrl(cert.filePath), '_blank')}><Eye className="h-4 w-4 text-green-600" /></Button>
                              <Button size="icon" variant="ghost" title={t('profile.removeDocument')} onClick={() => removeRowDocument('certifications', cert.id)}><X className="h-3 w-3 text-muted-foreground" /></Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer" title={t('profile.uploadDocument')}>
                              <Upload className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadRowDocument('certifications', cert.id, 'CERTIFICATION', f); e.target.value = '' }} />
                            </label>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingCertId(cert.id); setCertForm({ ...cert }) }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteCert(cert.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                  {(employee.certifications || []).length === 0 && !showAddCert && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">{tc('labels.noData')}</TableCell></TableRow>
                  )}
                  {showAddCert && (
                    <TableRow>
                      <TableCell><Input placeholder={t('certifications.name')} value={certForm.name || ''} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} /></TableCell>
                      <TableCell><Input placeholder={t('certifications.issuingOrg')} value={certForm.issuingOrg || ''} onChange={e => setCertForm(f => ({ ...f, issuingOrg: e.target.value }))} /></TableCell>
                      <TableCell><Input type="date" value={dateStr(certForm.issueDate)} onChange={e => setCertForm(f => ({ ...f, issueDate: e.target.value }))} /></TableCell>
                      <TableCell><Input type="date" value={dateStr(certForm.expiryDate)} onChange={e => setCertForm(f => ({ ...f, expiryDate: e.target.value }))} /></TableCell>
                      <TableCell><Input placeholder={t('certifications.certNo')} value={certForm.certificateNo || ''} onChange={e => setCertForm(f => ({ ...f, certificateNo: e.target.value }))} /></TableCell>
                      <TableCell />
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => saveCert(true)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setShowAddCert(false); setCertForm({}) }}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 8: Performance                                        */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('performance.performanceReviews')}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => router.push(`/hr/performance?employeeId=${employeeId}`)}>
                {t('profile.viewPerformance')} <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {performanceReviews === null ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : performanceReviews.length === 0 ? (
                <div className="text-center py-10">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-sm text-muted-foreground">{t('performance.noReviews')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('performance.reviewPeriod')}</TableHead>
                      <TableHead>{t('performance.reviewType')}</TableHead>
                      <TableHead className="text-center">{t('performance.selfScore')}</TableHead>
                      <TableHead className="text-center">{t('performance.supervisorScore')}</TableHead>
                      <TableHead className="text-center">{t('performance.finalScore')}</TableHead>
                      <TableHead>{t('performance.rating')}</TableHead>
                      <TableHead>{t('performance.status')}</TableHead>
                      <TableHead>{t('performance.completedDate')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceReviews.map(review => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.reviewPeriod}</TableCell>
                        <TableCell><Badge variant="outline">{review.reviewType}</Badge></TableCell>
                        <TableCell className="text-center">{review.selfScore != null ? Number(review.selfScore).toFixed(1) : '\u2014'}</TableCell>
                        <TableCell className="text-center">{review.supervisorScore != null ? Number(review.supervisorScore).toFixed(1) : '\u2014'}</TableCell>
                        <TableCell className="text-center font-semibold">{review.finalScore != null ? Number(review.finalScore).toFixed(1) : '\u2014'}</TableCell>
                        <TableCell>{review.rating ? <StatusBadge status={review.rating} /> : '\u2014'}</TableCell>
                        <TableCell><StatusBadge status={review.status} /></TableCell>
                        <TableCell>{review.completedAt ? formatDate(review.completedAt) : '\u2014'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 9: Compliance & Legal                                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="compliance" className="space-y-6 mt-6">
          {!editingTabs.compliance ? (
            <>
              {/* NGOAB Compliance */}
              <Card>
                <CardHeader><CardTitle>{t('compliance.ngoab')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <Field
                      label={t('compliance.ngoabNotified')}
                      value={<Badge variant={employee.ngoabNotified ? 'default' : 'secondary'}>{employee.ngoabNotified ? tc('labels.yes') : tc('labels.no')}</Badge>}
                    />
                    <Field label={t('compliance.fd4ReferenceNo')} value={employee.fd4ReferenceNo} mono />
                    <Field label={t('compliance.fd4SubmissionDate')} value={employee.fd4SubmissionDate ? formatDate(employee.fd4SubmissionDate) : null} />
                    <Field label={t('compliance.fd4ApprovalStatus')} value={employee.fd4ApprovalStatus ? <StatusBadge status={employee.fd4ApprovalStatus} /> : null} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t('compliance.uploadFd4')}</span>
                      {employee.fd4DocumentFilePath ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(documentUrl(employee.fd4DocumentFilePath), '_blank')}><Eye className="h-3.5 w-3.5 mr-1" />{t('profile.viewDocument')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => uploadComplianceDoc('fd4DocumentFilePath', 'NGOAB_FD4_NOTIFICATION', new File([], ''))}><X className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-primary hover:underline">
                          <Upload className="h-3.5 w-3.5" />{t('profile.uploadDocument')}
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadComplianceDoc('fd4DocumentFilePath', 'NGOAB_FD4_NOTIFICATION', f); e.target.value = '' }} />
                        </label>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safeguarding */}
              <Card>
                <CardHeader><CardTitle>{t('compliance.safeguarding')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <Field
                      label={t('compliance.codeOfConduct')}
                      value={<Badge variant={employee.codeOfConductSigned ? 'default' : 'secondary'}>{employee.codeOfConductSigned ? tc('labels.signed') : tc('labels.notSigned')}</Badge>}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t('compliance.uploadCoc')}</span>
                      {employee.codeOfConductFilePath ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(documentUrl(employee.codeOfConductFilePath), '_blank')}><Eye className="h-3.5 w-3.5 mr-1" />{t('profile.viewDocument')}</Button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-primary hover:underline">
                          <Upload className="h-3.5 w-3.5" />{t('profile.uploadDocument')}
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadComplianceDoc('codeOfConductFilePath', 'CODE_OF_CONDUCT', f); e.target.value = '' }} />
                        </label>
                      )}
                    </div>
                    <Field
                      label={t('compliance.psea')}
                      value={<Badge variant={employee.pseaDeclarationSigned ? 'default' : 'secondary'}>{employee.pseaDeclarationSigned ? tc('labels.signed') : tc('labels.notSigned')}</Badge>}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t('compliance.uploadPsea')}</span>
                      {employee.pseaDeclarationFilePath ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(documentUrl(employee.pseaDeclarationFilePath), '_blank')}><Eye className="h-3.5 w-3.5 mr-1" />{t('profile.viewDocument')}</Button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-primary hover:underline">
                          <Upload className="h-3.5 w-3.5" />{t('profile.uploadDocument')}
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadComplianceDoc('pseaDeclarationFilePath', 'PSEA_DECLARATION', f); e.target.value = '' }} />
                        </label>
                      )}
                    </div>
                    <Field label={t('compliance.safeguardingTraining')} value={employee.safeguardingTrainingDate ? formatDate(employee.safeguardingTrainingDate) : null} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t('compliance.uploadSafeguarding')}</span>
                      {employee.safeguardingCertFilePath ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(documentUrl(employee.safeguardingCertFilePath), '_blank')}><Eye className="h-3.5 w-3.5 mr-1" />{t('profile.viewDocument')}</Button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-primary hover:underline">
                          <Upload className="h-3.5 w-3.5" />{t('profile.uploadDocument')}
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadComplianceDoc('safeguardingCertFilePath', 'SAFEGUARDING_CERT', f); e.target.value = '' }} />
                        </label>
                      )}
                    </div>
                    <Field label={t('compliance.safeguardingExpiry')} value={employee.safeguardingTrainingExpiry ? formatDate(employee.safeguardingTrainingExpiry) : null} />
                    <Field label={t('compliance.backgroundCheck')} value={employee.backgroundCheckStatus ? <StatusBadge status={employee.backgroundCheckStatus} /> : null} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{t('compliance.uploadBackgroundCheck')}</span>
                      {employee.backgroundCheckFilePath ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(documentUrl(employee.backgroundCheckFilePath), '_blank')}><Eye className="h-3.5 w-3.5 mr-1" />{t('profile.viewDocument')}</Button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-primary hover:underline">
                          <Upload className="h-3.5 w-3.5" />{t('profile.uploadDocument')}
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadComplianceDoc('backgroundCheckFilePath', 'BACKGROUND_CHECK', f); e.target.value = '' }} />
                        </label>
                      )}
                    </div>
                    <Field label={t('compliance.backgroundCheckDate')} value={employee.backgroundCheckDate ? formatDate(employee.backgroundCheckDate) : null} />
                    <Field
                      label={t('compliance.mdsCheck')}
                      value={<Badge variant={employee.mdsCheckCompleted ? 'default' : 'secondary'}>{employee.mdsCheckCompleted ? tc('labels.completed') : tc('labels.pending')}</Badge>}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Expatriate Info */}
              {employee.isExpatriate && (
                <Card>
                  <CardHeader><CardTitle>{t('compliance.expatriate')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <Field label={t('form.passport')} value={employee.passport} mono />
                      <Field label={t('form.nationality')} value={employee.nationality} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader><CardTitle>{t('profile.tabs.compliance')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 flex items-center gap-2 pt-6">
                    <input type="checkbox" id="edit-ngoab" checked={Boolean(complianceForm.ngoabNotified)} onChange={e => setComplianceForm(p => ({ ...p, ngoabNotified: e.target.checked }))} />
                    <Label htmlFor="edit-ngoab">{t('compliance.ngoabNotified')}</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.fd4ReferenceNo')}</Label>
                    <Input value={String(complianceForm.fd4ReferenceNo || '')} onChange={e => setComplianceForm(p => ({ ...p, fd4ReferenceNo: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.fd4SubmissionDate')}</Label>
                    <Input type="date" value={String(complianceForm.fd4SubmissionDate || '')} onChange={e => setComplianceForm(p => ({ ...p, fd4SubmissionDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.fd4ApprovalStatus')}</Label>
                    <SearchableSelect
                      options={['PENDING', 'APPROVED', 'REJECTED'].map(s => ({ value: s, label: tc(`status.${s}`) }))}
                      value={String(complianceForm.fd4ApprovalStatus || '')}
                      onValueChange={v => setComplianceForm(p => ({ ...p, fd4ApprovalStatus: v }))}
                    />
                  </div>
                  <Separator className="md:col-span-2 my-2" />
                  <div className="space-y-2 flex items-center gap-2 pt-6">
                    <input type="checkbox" id="edit-coc" checked={Boolean(complianceForm.codeOfConductSigned)} onChange={e => setComplianceForm(p => ({ ...p, codeOfConductSigned: e.target.checked }))} />
                    <Label htmlFor="edit-coc">{t('compliance.codeOfConduct')}</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.codeOfConductDate')}</Label>
                    <Input type="date" value={String(complianceForm.codeOfConductDate || '')} onChange={e => setComplianceForm(p => ({ ...p, codeOfConductDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2 flex items-center gap-2 pt-6">
                    <input type="checkbox" id="edit-psea" checked={Boolean(complianceForm.pseaDeclarationSigned)} onChange={e => setComplianceForm(p => ({ ...p, pseaDeclarationSigned: e.target.checked }))} />
                    <Label htmlFor="edit-psea">{t('compliance.psea')}</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.safeguardingTraining')}</Label>
                    <Input type="date" value={String(complianceForm.safeguardingTrainingDate || '')} onChange={e => setComplianceForm(p => ({ ...p, safeguardingTrainingDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.safeguardingExpiry')}</Label>
                    <Input type="date" value={String(complianceForm.safeguardingTrainingExpiry || '')} onChange={e => setComplianceForm(p => ({ ...p, safeguardingTrainingExpiry: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.backgroundCheck')}</Label>
                    <SearchableSelect
                      options={['PENDING', 'CLEARED', 'FLAGGED'].map(s => ({ value: s, label: tc(`status.${s}`) }))}
                      value={String(complianceForm.backgroundCheckStatus || '')}
                      onValueChange={v => setComplianceForm(p => ({ ...p, backgroundCheckStatus: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('compliance.backgroundCheckDate')}</Label>
                    <Input type="date" value={String(complianceForm.backgroundCheckDate || '')} onChange={e => setComplianceForm(p => ({ ...p, backgroundCheckDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2 flex items-center gap-2 pt-6">
                    <input type="checkbox" id="edit-mds" checked={Boolean(complianceForm.mdsCheckCompleted)} onChange={e => setComplianceForm(p => ({ ...p, mdsCheckCompleted: e.target.checked }))} />
                    <Label htmlFor="edit-mds">{t('compliance.mdsCheck')}</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 10: Contracts                                         */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="contracts" className="space-y-6 mt-6">
          {/* Active Contract Highlight */}
          {profileSummary?.contractStatus.hasActive && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{t('contracts.active')}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {profileSummary.contractStatus.contractNo && <span className="font-mono">{profileSummary.contractStatus.contractNo}</span>}
                      {profileSummary.contractStatus.endDate && (
                        <span className="ml-2">Ends: {formatDate(profileSummary.contractStatus.endDate)}</span>
                      )}
                    </p>
                  </div>
                  {profileSummary.contractStatus.daysLeft != null && (
                    <Badge variant={profileSummary.contractStatus.daysLeft < 30 ? 'destructive' : 'default'}>
                      {profileSummary.contractStatus.daysLeft} days left
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract History */}
          <Card>
            <CardHeader><CardTitle>{t('contracts.history')}</CardTitle></CardHeader>
            <CardContent>
              {contracts === null ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{tc('labels.noData')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('contracts.contractNo')}</TableHead>
                      <TableHead>{t('contracts.type')}</TableHead>
                      <TableHead>{t('fields.startDate')}</TableHead>
                      <TableHead>{t('fields.endDate')}</TableHead>
                      <TableHead>{tc('labels.status')}</TableHead>
                      <TableHead className="text-right">{tc('labels.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.contractNo || '\u2014'}</TableCell>
                        <TableCell>{c.contractType || '\u2014'}</TableCell>
                        <TableCell>{formatDate(c.startDate)}</TableCell>
                        <TableCell>{c.endDate ? formatDate(c.endDate) : '\u2014'}</TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-right">
                          {c.status === 'DRAFT' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activateContract(c)}
                              disabled={contractActionId === c.id}
                            >
                              {contractActionId === c.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Activate
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => router.push(`/hr/contracts/${c.id}`)}>
                              <ExternalLink className="h-4 w-4 mr-1" />Open
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Tab 11: Timeline                                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="timeline" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle>{t('profile.tabs.timeline')}</CardTitle></CardHeader>
            <CardContent>
              {timeline === null ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{tc('labels.noData')}</p>
              ) : (
                <div className="relative border-l-2 border-muted ml-4 space-y-0">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-8 pb-8 last:pb-0">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                      <div className="text-xs text-muted-foreground mb-1">{formatDate(event.date)}</div>
                      <h4 className="text-sm font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{event.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
