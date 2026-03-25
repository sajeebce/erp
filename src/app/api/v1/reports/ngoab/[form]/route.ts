import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

// ─── Types ───

const VALID_FORMS = ['fd-1', 'fd-2', 'fd-3', 'fd-4', 'fd-5', 'fd-6'] as const

type NgoabForm = typeof VALID_FORMS[number]

// ─── Main Handler ───

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ form: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { form } = await params
    const orgId = auth.organizationId

    if (!VALID_FORMS.includes(form as NgoabForm)) {
      return apiBadRequest('Unknown NGOAB form')
    }

    switch (form as NgoabForm) {
      case 'fd-1':
        return apiSuccess(await generateFD1(orgId))
      case 'fd-2':
        return apiSuccess(await generateFD2(orgId))
      case 'fd-3':
        return apiSuccess(await generateFD3(orgId))
      case 'fd-4':
        return apiSuccess(await generateFD4(orgId))
      case 'fd-5':
        return apiSuccess(await generateFD5(orgId))
      case 'fd-6':
        return apiSuccess(await generateFD6(orgId))
      default:
        return apiBadRequest('Unknown NGOAB form')
    }
  } catch (error) {
    return handleRouteError(error)
  }
}

// ─── FD-1: Project Registration ───

async function generateFD1(organizationId: string) {
  const grants = await prisma.grant.findMany({
    where: {
      donor: { organizationId },
      deletedAt: null,
    },
    select: {
      id: true,
      grantNo: true,
      title: true,
      awardAmount: true,
      startDate: true,
      endDate: true,
      ngoabFdNo: true,
      status: true,
      donor: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    reportType: 'ngoab-fd-1',
    title: 'FD-1: Project Registration',
    generatedAt: new Date(),
    grants: grants.map((g) => ({
      grantId: g.id,
      grantNo: g.grantNo,
      title: g.title,
      donor: g.donor.name,
      donorType: g.donor.type,
      donorCountry: g.donor.country,
      amount: Number(g.awardAmount),
      startDate: g.startDate,
      endDate: g.endDate,
      ngoabFdNo: g.ngoabFdNo,
      status: g.status,
    })),
    totalGrants: grants.length,
    totalAmount: grants.reduce((sum, g) => sum + Number(g.awardAmount), 0),
  }
}

// ─── FD-2: Fund Release ───

async function generateFD2(organizationId: string) {
  const [fundReceipts, fundRequisitions] = await Promise.all([
    prisma.fundReceipt.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        receiptNo: true,
        date: true,
        amount: true,
        currencyCode: true,
        amountInBDT: true,
        bankReference: true,
        status: true,
        grant: {
          select: {
            grantNo: true,
            title: true,
            donor: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.fundRequisition.findMany({
      where: {
        grant: {
          donor: { organizationId },
        },
      },
      select: {
        id: true,
        requisitionNo: true,
        date: true,
        amount: true,
        purpose: true,
        status: true,
        disbursedAt: true,
        grant: {
          select: {
            grantNo: true,
            title: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    }),
  ])

  return {
    reportType: 'ngoab-fd-2',
    title: 'FD-2: Fund Release',
    generatedAt: new Date(),
    fundReceipts: fundReceipts.map((r) => ({
      receiptId: r.id,
      receiptNo: r.receiptNo,
      date: r.date,
      grantNo: r.grant.grantNo,
      grantTitle: r.grant.title,
      donor: r.grant.donor.name,
      amount: Number(r.amount),
      currencyCode: r.currencyCode,
      amountInBDT: Number(r.amountInBDT),
      bankReference: r.bankReference,
      status: r.status,
    })),
    fundRequisitions: fundRequisitions.map((rq) => ({
      requisitionId: rq.id,
      requisitionNo: rq.requisitionNo,
      date: rq.date,
      grantNo: rq.grant.grantNo,
      grantTitle: rq.grant.title,
      amount: Number(rq.amount),
      purpose: rq.purpose,
      status: rq.status,
      disbursedAt: rq.disbursedAt,
    })),
    summary: {
      totalReceipts: fundReceipts.length,
      totalReceiptAmount: fundReceipts.reduce((sum, r) => sum + Number(r.amountInBDT), 0),
      totalRequisitions: fundRequisitions.length,
      totalRequisitionAmount: fundRequisitions.reduce((sum, r) => sum + Number(r.amount), 0),
    },
  }
}

// ─── FD-3: Quarterly Progress ───

async function generateFD3(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: {
      id: true,
      projectNo: true,
      name: true,
      totalBudget: true,
      amountSpent: true,
      progress: true,
      donorId: true,
      activities: {
        select: {
          id: true,
          status: true,
        },
      },
      milestones: {
        select: {
          id: true,
          status: true,
        },
      },
      grants: {
        select: {
          donor: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return {
    reportType: 'ngoab-fd-3',
    title: 'FD-3: Quarterly Progress Report',
    generatedAt: new Date(),
    projects: projects.map((p) => {
      const activitiesCompleted = p.activities.filter((a) => a.status === 'COMPLETED').length
      const milestonesAchieved = p.milestones.filter((m) => m.status === 'ACHIEVED').length

      return {
        projectId: p.id,
        projectNo: p.projectNo,
        name: p.name,
        donor: p.grants[0]?.donor?.name ?? null,
        budget: Number(p.totalBudget),
        spent: Number(p.amountSpent),
        budgetUtilization: Number(p.totalBudget) > 0
          ? (Number(p.amountSpent) / Number(p.totalBudget)) * 100
          : 0,
        progress: p.progress,
        activities: {
          completed: activitiesCompleted,
          total: p.activities.length,
        },
        milestones: {
          achieved: milestonesAchieved,
          total: p.milestones.length,
        },
      }
    }),
    totalProjects: projects.length,
  }
}

// ─── FD-4: Personnel Details ───

async function generateFD4(organizationId: string) {
  const employees = await prisma.employee.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      employeeNo: true,
      fullName: true,
      joiningDate: true,
      employmentType: true,
      status: true,
      department: {
        select: { name: true },
      },
      designation: {
        select: { title: true },
      },
      projectTeams: {
        where: { isActive: true },
        select: {
          role: true,
          project: {
            select: {
              projectNo: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { fullName: 'asc' },
  })

  return {
    reportType: 'ngoab-fd-4',
    title: 'FD-4: Personnel Details',
    generatedAt: new Date(),
    employees: employees.map((e) => ({
      employeeId: e.id,
      employeeNo: e.employeeNo,
      name: e.fullName,
      designation: e.designation.title,
      department: e.department.name,
      joiningDate: e.joiningDate,
      employmentType: e.employmentType,
      status: e.status,
      projectAssignment: e.projectTeams.map((pt) => ({
        projectNo: pt.project.projectNo,
        projectName: pt.project.name,
        role: pt.role,
      })),
    })),
    totalEmployees: employees.length,
  }
}

// ─── FD-5: Asset Register ───

async function generateFD5(organizationId: string) {
  const assets = await prisma.asset.findMany({
    where: {
      category: { organizationId },
      deletedAt: null,
    },
    select: {
      id: true,
      assetNo: true,
      name: true,
      purchaseDate: true,
      purchasePrice: true,
      netBookValue: true,
      condition: true,
      donorId: true,
      category: {
        select: {
          code: true,
          name: true,
        },
      },
      warehouse: {
        select: {
          name: true,
          location: true,
        },
      },
      project: {
        select: {
          projectNo: true,
          name: true,
        },
      },
    },
    orderBy: { assetNo: 'asc' },
  })

  return {
    reportType: 'ngoab-fd-5',
    title: 'FD-5: Asset Register',
    generatedAt: new Date(),
    assets: assets.map((a) => ({
      assetId: a.id,
      assetNo: a.assetNo,
      name: a.name,
      category: a.category.name,
      categoryCode: a.category.code,
      purchaseDate: a.purchaseDate,
      purchasePrice: Number(a.purchasePrice),
      netBookValue: Number(a.netBookValue),
      location: a.warehouse?.name ?? null,
      warehouseLocation: a.warehouse?.location ?? null,
      donorId: a.donorId,
      project: a.project
        ? { projectNo: a.project.projectNo, name: a.project.name }
        : null,
      condition: a.condition,
    })),
    totalAssets: assets.length,
    totalPurchaseValue: assets.reduce((sum, a) => sum + Number(a.purchasePrice), 0),
    totalNetBookValue: assets.reduce((sum, a) => sum + Number(a.netBookValue), 0),
  }
}

// ─── FD-6: Annual Audit Data ───

async function generateFD6(organizationId: string) {
  const [
    incomeAccounts,
    expenseAccounts,
    assetAccounts,
    liabilityAccounts,
    bankAccounts,
    projectCount,
    staffCount,
  ] = await Promise.all([
    // Total income from journal entries (INCOME account lines in approved entries)
    prisma.journalEntryLine.aggregate({
      where: {
        account: { organizationId, type: 'INCOME' },
        journalEntry: { status: 'APPROVED', deletedAt: null },
      },
      _sum: { debit: true, credit: true },
    }),
    // Total expenses
    prisma.journalEntryLine.aggregate({
      where: {
        account: { organizationId, type: 'EXPENSE' },
        journalEntry: { status: 'APPROVED', deletedAt: null },
      },
      _sum: { debit: true, credit: true },
    }),
    // Total assets
    prisma.journalEntryLine.aggregate({
      where: {
        account: { organizationId, type: 'ASSET' },
        journalEntry: { status: 'APPROVED', deletedAt: null },
      },
      _sum: { debit: true, credit: true },
    }),
    // Total liabilities
    prisma.journalEntryLine.aggregate({
      where: {
        account: { organizationId, type: 'LIABILITY' },
        journalEntry: { status: 'APPROVED', deletedAt: null },
      },
      _sum: { debit: true, credit: true },
    }),
    // Bank account balances
    prisma.bankAccount.findMany({
      where: { organizationId, isActive: true },
      select: {
        accountName: true,
        bankName: true,
        currentBalance: true,
        type: true,
      },
    }),
    // Active project count
    prisma.project.count({
      where: { organizationId, status: 'ACTIVE', deletedAt: null },
    }),
    // Active staff count
    prisma.employee.count({
      where: { organizationId, status: 'ACTIVE', deletedAt: null },
    }),
  ])

  const totalIncome = Number(incomeAccounts._sum.credit ?? 0) - Number(incomeAccounts._sum.debit ?? 0)
  const totalExpenses = Number(expenseAccounts._sum.debit ?? 0) - Number(expenseAccounts._sum.credit ?? 0)
  const totalAssets = Number(assetAccounts._sum.debit ?? 0) - Number(assetAccounts._sum.credit ?? 0)
  const totalLiabilities = Number(liabilityAccounts._sum.credit ?? 0) - Number(liabilityAccounts._sum.debit ?? 0)
  const cashPosition = bankAccounts.reduce((sum, b) => sum + Number(b.currentBalance), 0)

  return {
    reportType: 'ngoab-fd-6',
    title: 'FD-6: Annual Audit Data Summary',
    generatedAt: new Date(),
    summary: {
      totalIncome,
      totalExpenses,
      netSurplusDeficit: totalIncome - totalExpenses,
      totalAssets,
      totalLiabilities,
      netAssets: totalAssets - totalLiabilities,
      cashPosition,
      projectCount,
      staffCount,
    },
    bankAccounts: bankAccounts.map((b) => ({
      accountName: b.accountName,
      bankName: b.bankName,
      type: b.type,
      balance: Number(b.currentBalance),
    })),
  }
}
