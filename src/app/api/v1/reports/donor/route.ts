import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

// ─── Main Handler ───

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const url = new URL(request.url)
    const donorId = url.searchParams.get('donorId')
    const grantId = url.searchParams.get('grantId')

    if (donorId && grantId) {
      return apiBadRequest('Provide either donorId or grantId, not both')
    }

    if (donorId) {
      return apiSuccess(await generateDonorReport(orgId, donorId))
    }

    if (grantId) {
      return apiSuccess(await generateGrantReport(orgId, grantId))
    }

    return apiSuccess(await generateDonorSummary(orgId))
  } catch (error) {
    return handleRouteError(error)
  }
}

// ─── Donor Detail Report ───

async function generateDonorReport(organizationId: string, donorId: string) {
  const donor = await prisma.donor.findFirst({
    where: {
      id: donorId,
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      type: true,
      country: true,
      email: true,
      phone: true,
      website: true,
      relationshipStatus: true,
      totalFunded: true,
      grants: {
        where: { deletedAt: null },
        select: {
          id: true,
          grantNo: true,
          title: true,
          awardAmount: true,
          disbursedAmount: true,
          currencyCode: true,
          startDate: true,
          endDate: true,
          status: true,
          ngoabFdNo: true,
          project: {
            select: {
              projectNo: true,
              name: true,
              status: true,
            },
          },
          fundReceipts: {
            where: { deletedAt: null },
            select: {
              amount: true,
              amountInBDT: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!donor) {
    throw new Error('Not found: Donor not found in this organization')
  }

  const totalAwarded = donor.grants.reduce((sum, g) => sum + Number(g.awardAmount), 0)
  const totalDisbursed = donor.grants.reduce((sum, g) => sum + Number(g.disbursedAmount), 0)
  const totalReceived = donor.grants.reduce(
    (sum, g) => sum + g.fundReceipts
      .filter((r) => r.status === 'CONFIRMED')
      .reduce((s, r) => s + Number(r.amountInBDT), 0),
    0
  )
  const activeGrants = donor.grants.filter((g) => g.status === 'ACTIVE')

  return {
    reportType: 'donor-detail',
    generatedAt: new Date(),
    donor: {
      id: donor.id,
      name: donor.name,
      type: donor.type,
      country: donor.country,
      email: donor.email,
      phone: donor.phone,
      website: donor.website,
      relationshipStatus: donor.relationshipStatus,
    },
    summary: {
      totalAwarded,
      totalDisbursed,
      totalReceived,
      utilizationRate: totalDisbursed > 0 ? (totalReceived / totalDisbursed) * 100 : 0,
      totalGrants: donor.grants.length,
      activeGrants: activeGrants.length,
    },
    grants: donor.grants.map((g) => ({
      grantId: g.id,
      grantNo: g.grantNo,
      title: g.title,
      awardAmount: Number(g.awardAmount),
      disbursedAmount: Number(g.disbursedAmount),
      currencyCode: g.currencyCode,
      startDate: g.startDate,
      endDate: g.endDate,
      status: g.status,
      ngoabFdNo: g.ngoabFdNo,
      project: g.project
        ? { projectNo: g.project.projectNo, name: g.project.name, status: g.project.status }
        : null,
      fundReceiptsSummary: {
        totalReceipts: g.fundReceipts.length,
        totalAmount: g.fundReceipts.reduce((s, r) => s + Number(r.amountInBDT), 0),
        confirmedAmount: g.fundReceipts
          .filter((r) => r.status === 'CONFIRMED')
          .reduce((s, r) => s + Number(r.amountInBDT), 0),
      },
    })),
    activeProjects: activeGrants
      .filter((g) => g.project)
      .map((g) => ({
        projectNo: g.project!.projectNo,
        projectName: g.project!.name,
        projectStatus: g.project!.status,
        grantNo: g.grantNo,
      })),
  }
}

// ─── Grant Detail Report ───

async function generateGrantReport(organizationId: string, grantId: string) {
  const grant = await prisma.grant.findFirst({
    where: {
      id: grantId,
      donor: { organizationId },
      deletedAt: null,
    },
    select: {
      id: true,
      grantNo: true,
      title: true,
      awardAmount: true,
      disbursedAmount: true,
      currencyCode: true,
      startDate: true,
      endDate: true,
      status: true,
      ngoabFdNo: true,
      donor: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      fundReceipts: {
        where: { deletedAt: null },
        select: {
          id: true,
          receiptNo: true,
          date: true,
          amount: true,
          currencyCode: true,
          amountInBDT: true,
          bankReference: true,
          status: true,
        },
        orderBy: { date: 'desc' },
      },
      fundRequisitions: {
        select: {
          id: true,
          requisitionNo: true,
          date: true,
          amount: true,
          purpose: true,
          status: true,
          disbursedAt: true,
        },
        orderBy: { date: 'desc' },
      },
      budgets: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          totalAmount: true,
          status: true,
          lines: {
            select: {
              category: true,
              description: true,
              totalAmount: true,
            },
          },
        },
      },
      journalEntries: {
        where: {
          status: 'APPROVED',
          deletedAt: null,
        },
        select: {
          lines: {
            select: {
              account: {
                select: {
                  type: true,
                  name: true,
                },
              },
              debit: true,
              credit: true,
            },
          },
        },
      },
    },
  })

  if (!grant) {
    throw new Error('Not found: Grant not found in this organization')
  }

  // Compute expenditure by account type from journal entries
  const expenditureByCategory: Record<string, number> = {}
  for (const je of grant.journalEntries) {
    for (const line of je.lines) {
      if (line.account.type === 'EXPENSE') {
        const accountName = line.account.name
        expenditureByCategory[accountName] =
          (expenditureByCategory[accountName] ?? 0) + Number(line.debit) - Number(line.credit)
      }
    }
  }

  return {
    reportType: 'grant-detail',
    generatedAt: new Date(),
    grant: {
      grantId: grant.id,
      grantNo: grant.grantNo,
      title: grant.title,
      awardAmount: Number(grant.awardAmount),
      disbursedAmount: Number(grant.disbursedAmount),
      currencyCode: grant.currencyCode,
      startDate: grant.startDate,
      endDate: grant.endDate,
      status: grant.status,
      ngoabFdNo: grant.ngoabFdNo,
      donor: grant.donor,
    },
    fundReceipts: grant.fundReceipts.map((r) => ({
      receiptId: r.id,
      receiptNo: r.receiptNo,
      date: r.date,
      amount: Number(r.amount),
      currencyCode: r.currencyCode,
      amountInBDT: Number(r.amountInBDT),
      bankReference: r.bankReference,
      status: r.status,
    })),
    fundRequisitions: grant.fundRequisitions.map((rq) => ({
      requisitionId: rq.id,
      requisitionNo: rq.requisitionNo,
      date: rq.date,
      amount: Number(rq.amount),
      purpose: rq.purpose,
      status: rq.status,
      disbursedAt: rq.disbursedAt,
    })),
    budgetLines: grant.budgets.flatMap((b) =>
      b.lines.map((l) => ({
        budgetName: b.name,
        budgetStatus: b.status,
        category: l.category,
        description: l.description,
        amount: Number(l.totalAmount),
      }))
    ),
    expenditureByCategory: Object.entries(expenditureByCategory).map(
      ([category, amount]) => ({ category, amount })
    ),
    summary: {
      totalReceived: grant.fundReceipts
        .filter((r) => r.status === 'CONFIRMED')
        .reduce((s, r) => s + Number(r.amountInBDT), 0),
      totalRequisitioned: grant.fundRequisitions.reduce((s, r) => s + Number(r.amount), 0),
      totalBudgeted: grant.budgets.reduce((s, b) => s + Number(b.totalAmount), 0),
      totalExpenditure: Object.values(expenditureByCategory).reduce(
        (sum, v) => sum + v,
        0
      ),
    },
  }
}

// ─── Donor Summary (all donors) ───

async function generateDonorSummary(organizationId: string) {
  const donors = await prisma.donor.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      type: true,
      country: true,
      totalFunded: true,
      relationshipStatus: true,
      grants: {
        where: { deletedAt: null },
        select: {
          id: true,
          awardAmount: true,
          disbursedAmount: true,
          status: true,
          fundReceipts: {
            where: {
              deletedAt: null,
              status: 'CONFIRMED',
            },
            select: {
              amountInBDT: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return {
    reportType: 'donor-summary',
    generatedAt: new Date(),
    donors: donors.map((d) => {
      const totalFunded = d.grants.reduce((s, g) => s + Number(g.awardAmount), 0)
      const totalDisbursed = d.grants.reduce((s, g) => s + Number(g.disbursedAmount), 0)
      const totalUtilized = d.grants.reduce(
        (s, g) => s + g.fundReceipts.reduce((rs, r) => rs + Number(r.amountInBDT), 0),
        0
      )
      const activeGrants = d.grants.filter((g) => g.status === 'ACTIVE').length

      return {
        donorId: d.id,
        name: d.name,
        type: d.type,
        country: d.country,
        relationshipStatus: d.relationshipStatus,
        totalFunded,
        totalDisbursed,
        totalUtilized,
        activeGrants,
        totalGrants: d.grants.length,
        utilizationRate: totalDisbursed > 0 ? (totalUtilized / totalDisbursed) * 100 : 0,
      }
    }),
    totalDonors: donors.length,
    overallSummary: {
      totalFunded: donors.reduce(
        (s, d) => s + d.grants.reduce((gs, g) => gs + Number(g.awardAmount), 0),
        0
      ),
      totalActiveDonors: donors.filter(
        (d) => d.grants.some((g) => g.status === 'ACTIVE')
      ).length,
    },
  }
}
