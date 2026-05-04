'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  // General
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',

  // Project
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PIPELINE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  ON_HOLD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',

  // Activity/Milestone
  PLANNED: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELAYED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ON_TRACK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ACHIEVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  AT_RISK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',

  // Beneficiary
  GRADUATED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  DROPPED_OUT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  WAITLISTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',

  // Grievance
  OPEN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  UNDER_INVESTIGATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',

  // Procurement
  ISSUED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PO_CREATED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  AWARDED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',

  // Inventory
  IN_STOCK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  LOW_STOCK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OUT_OF_STOCK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',

  // Subscription
  TRIAL: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  PAST_DUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EXPIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',

  // Leave
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',

  // Loan
  REGULAR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  WATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SUBSTANDARD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DOUBTFUL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  BAD: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',

  // Fund Receipt
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  RECEIVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

  // Grant Lifecycle
  PROPOSAL: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  NEGOTIATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  AGREEMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IMPLEMENTATION: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLOSEOUT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  IDENTIFICATION: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',

  // Severity
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',

  // Attendance
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HALF_DAY: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  ON_LEAVE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',

  // Asset
  NEW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  GOOD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FAIR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  POOR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DAMAGED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DISPOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',

  // Recruitment — Job Posting
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',

  // Recruitment — Application Pipeline
  APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SCREENED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  SHORTLISTED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  TECHNICAL_TEST: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  REFERENCE_CHECK: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  OFFER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  INTERVIEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  HIRED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  WITHDRAWN: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

  // Pension / PF / Gratuity
  VESTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  NOT_VESTED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  FROZEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CALCULATED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DEFAULTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MATURED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ENCASHED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',

  // OKR
  PLANNING: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  SCORING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BEHIND: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  NOT_STARTED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',

  // Contracts
  EXPIRING_SOON: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RENEWED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',

  // Vendor Invoices & Payments
  MATCHED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',

  // Expense Claims & Advances
  SUPERVISOR_APPROVED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  FINANCE_APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REQUESTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DISBURSED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  SETTLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PARTIALLY_SETTLED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',

  // Offboarding / Grievances / Disciplinary
  INITIATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INVESTIGATING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ESCALATED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  VERBAL_WARNING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  WRITTEN_WARNING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  FINAL_WARNING: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUSPENSION: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations('common')
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700'
  const label = !status ? '—' : t.has(`status.${status}`) ? t(`status.${status}`) : status.replace(/_/g, ' ')
  return (
    <Badge variant="secondary" className={cn('font-medium text-[11px] px-2 py-0.5', style, className)}>
      {label}
    </Badge>
  )
}
