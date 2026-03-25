import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

// ─── Main Handler ───

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const [poSummary, vendorPerformance, contractStatus, inventoryValuation] =
      await Promise.all([
        generatePOSummary(orgId),
        generateVendorPerformance(orgId),
        generateContractStatus(orgId),
        generateInventoryValuation(orgId),
      ])

    return apiSuccess({
      reportType: 'procurement-analytics',
      generatedAt: new Date(),
      poSummary,
      vendorPerformance,
      contractStatus,
      inventoryValuation,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

// ─── PO Summary ───

async function generatePOSummary(organizationId: string) {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      vendor: { organizationId },
      deletedAt: null,
    },
    select: {
      id: true,
      totalAmount: true,
      status: true,
    },
  })

  const totalValue = purchaseOrders.reduce((s, po) => s + Number(po.totalAmount), 0)

  const byStatus = {
    DRAFT: { count: 0, value: 0 },
    ISSUED: { count: 0, value: 0 },
    PARTIALLY_RECEIVED: { count: 0, value: 0 },
    COMPLETED: { count: 0, value: 0 },
    CANCELLED: { count: 0, value: 0 },
  }

  for (const po of purchaseOrders) {
    const status = po.status as keyof typeof byStatus
    if (byStatus[status]) {
      byStatus[status].count++
      byStatus[status].value += Number(po.totalAmount)
    }
  }

  return {
    totalPOs: purchaseOrders.length,
    totalValue,
    byStatus,
  }
}

// ─── Vendor Performance ───

async function generateVendorPerformance(organizationId: string) {
  const vendors = await prisma.vendor.findMany({
    where: {
      organizationId,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      vendorNo: true,
      companyName: true,
      category: true,
      rating: true,
      totalOrders: true,
      isApproved: true,
    },
    orderBy: [
      { rating: 'desc' },
      { totalOrders: 'desc' },
    ],
    take: 20,
  })

  return {
    topVendors: vendors.map((v) => ({
      vendorId: v.id,
      vendorNo: v.vendorNo,
      companyName: v.companyName,
      category: v.category,
      rating: Number(v.rating),
      totalOrders: v.totalOrders,
      isApproved: v.isApproved,
    })),
    totalActiveVendors: vendors.length,
  }
}

// ─── Contract Status ───

async function generateContractStatus(organizationId: string) {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const contracts = await prisma.contract.findMany({
    where: {
      vendor: { organizationId },
      deletedAt: null,
    },
    select: {
      id: true,
      contractNo: true,
      title: true,
      value: true,
      status: true,
      startDate: true,
      endDate: true,
      vendor: {
        select: {
          companyName: true,
        },
      },
    },
  })

  const active = contracts.filter((c) => c.status === 'ACTIVE')
  const expired = contracts.filter((c) => c.status === 'EXPIRED')
  const expiringIn30Days = contracts.filter(
    (c) => c.status === 'ACTIVE' && c.endDate <= thirtyDaysFromNow && c.endDate >= now
  )

  return {
    active: {
      count: active.length,
      totalValue: active.reduce((s, c) => s + Number(c.value), 0),
    },
    expired: {
      count: expired.length,
      totalValue: expired.reduce((s, c) => s + Number(c.value), 0),
    },
    expiringIn30Days: {
      count: expiringIn30Days.length,
      contracts: expiringIn30Days.map((c) => ({
        contractNo: c.contractNo,
        title: c.title,
        vendor: c.vendor.companyName,
        endDate: c.endDate,
        value: Number(c.value),
      })),
    },
    totalContracts: contracts.length,
  }
}

// ─── Inventory Valuation ───

async function generateInventoryValuation(organizationId: string) {
  const items = await prisma.inventoryItem.findMany({
    where: {
      warehouse: { organizationId },
      isActive: true,
    },
    select: {
      id: true,
      totalValue: true,
      status: true,
      stockInHand: true,
      reorderLevel: true,
    },
  })

  const totalStockValue = items.reduce((s, i) => s + Number(i.totalValue), 0)
  const lowStockCount = items.filter((i) => i.status === 'LOW_STOCK').length
  const outOfStockCount = items.filter((i) => i.status === 'OUT_OF_STOCK').length
  const inStockCount = items.filter((i) => i.status === 'IN_STOCK').length

  return {
    totalStockValue,
    totalItems: items.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
  }
}
