'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  // General
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },

  // Project
  ACTIVE: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  PIPELINE: { label: 'Pipeline', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  ON_HOLD: { label: 'On Hold', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CLOSED: { label: 'Closed', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },

  // Activity/Milestone
  PLANNED: { label: 'Planned', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  DELAYED: { label: 'Delayed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  ON_TRACK: { label: 'On Track', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ACHIEVED: { label: 'Achieved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  AT_RISK: { label: 'At Risk', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  OVERDUE: { label: 'Overdue', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },

  // Beneficiary
  GRADUATED: { label: 'Graduated', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  DROPPED_OUT: { label: 'Dropped Out', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  WAITLISTED: { label: 'Waitlisted', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },

  // Grievance
  OPEN: { label: 'Open', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  UNDER_INVESTIGATION: { label: 'Investigating', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  RESOLVED: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },

  // Procurement
  ISSUED: { label: 'Issued', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PARTIALLY_RECEIVED: { label: 'Partial', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PO_CREATED: { label: 'PO Created', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  AWARDED: { label: 'Awarded', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },

  // Inventory
  IN_STOCK: { label: 'In Stock', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  LOW_STOCK: { label: 'Low Stock', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  OUT_OF_STOCK: { label: 'Out of Stock', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },

  // Subscription
  TRIAL: { label: 'Trial', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  PAST_DUE: { label: 'Past Due', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  PAUSED: { label: 'Paused', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },

  // Leave
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },

  // Loan
  REGULAR: { label: 'Regular', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  WATCH: { label: 'Watch', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  SUBSTANDARD: { label: 'Substandard', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  DOUBTFUL: { label: 'Doubtful', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  BAD: { label: 'Bad', className: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' },

  // Fund Receipt
  CONFIRMED: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  RECEIVED: { label: 'Received', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },

  // Grant Lifecycle
  PROPOSAL: { label: 'Proposal', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  NEGOTIATION: { label: 'Negotiation', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  AGREEMENT: { label: 'Agreement', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  IMPLEMENTATION: { label: 'Implementation', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CLOSEOUT: { label: 'Closeout', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  IDENTIFICATION: { label: 'Identification', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },

  // Severity
  HIGH: { label: 'High', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  MEDIUM: { label: 'Medium', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  LOW: { label: 'Low', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },

  // Attendance
  PRESENT: { label: 'Present', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ABSENT: { label: 'Absent', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  LATE: { label: 'Late', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  HALF_DAY: { label: 'Half Day', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  ON_LEAVE: { label: 'On Leave', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },

  // Asset
  NEW: { label: 'New', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  GOOD: { label: 'Good', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  FAIR: { label: 'Fair', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  POOR: { label: 'Poor', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  DAMAGED: { label: 'Damaged', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  DISPOSED: { label: 'Disposed', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status.replace(/_/g, ' '), className: 'bg-gray-100 text-gray-700' }
  return (
    <Badge variant="secondary" className={cn('font-medium text-[11px] px-2 py-0.5', config.className, className)}>
      {config.label}
    </Badge>
  )
}
