import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
  apiPaginated,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [funds, total] = await Promise.all([
      prisma.pettyCashFund.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          imprestAmount: true,
          currentBalance: true,
          currencyCode: true,
          custodianId: true,
          alternateCustodianId: true,
          bankAccountId: true,
          projectId: true,
          grantId: true,
          location: true,
          maxTransactionLimit: true,
          reconciliationFrequency: true,
          effectiveDate: true,
          isActive: true,
          lastReconciledAt: true,
          notes: true,
          bankAccount: {
            select: { id: true, accountCode: true, accountName: true },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.pettyCashFund.count({ where }),
    ])

    // Resolve custodian names from Employee table
    const custodianIds = [...new Set(funds.map((f: Record<string, unknown>) => f.custodianId as string).filter(Boolean))]
    const employees = custodianIds.length > 0
      ? await prisma.employee.findMany({
          where: { id: { in: custodianIds }, organizationId: auth.organizationId },
          select: { id: true, fullName: true, employeeNo: true },
        })
      : []
    const empMap = Object.fromEntries(employees.map(e => [e.id, e]))

    const enriched = funds.map((f: Record<string, unknown>) => ({
      ...f,
      custodianName: empMap[f.custodianId as string]?.fullName || null,
      custodianEmployeeNo: empMap[f.custodianId as string]?.employeeNo || null,
    }))

    return apiPaginated(enriched, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      name,
      code,
      imprestAmount,
      custodianId,
      alternateCustodianId,
      projectId,
      grantId,
      location,
      notes,
      currencyCode,
      maxTransactionLimit,
      reconciliationFrequency,
      effectiveDate,
    } = body

    if (!name || !code || imprestAmount === undefined || !custodianId) {
      return apiBadRequest('name, code, imprestAmount, and custodianId are required')
    }

    if (typeof imprestAmount !== 'number' || imprestAmount <= 0) {
      return apiBadRequest('imprestAmount must be a positive number')
    }

    if (maxTransactionLimit !== undefined && maxTransactionLimit !== null) {
      if (typeof maxTransactionLimit !== 'number' || maxTransactionLimit <= 0) {
        return apiBadRequest('maxTransactionLimit must be a positive number')
      }
      if (maxTransactionLimit > imprestAmount) {
        return apiBadRequest('maxTransactionLimit cannot exceed imprestAmount')
      }
    }

    const validFrequencies = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']
    if (reconciliationFrequency && !validFrequencies.includes(reconciliationFrequency)) {
      return apiBadRequest(`reconciliationFrequency must be one of: ${validFrequencies.join(', ')}`)
    }

    // Validate custodian is a valid Employee in this org
    const custodian = await prisma.employee.findFirst({
      where: { id: custodianId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!custodian) {
      return apiBadRequest('Custodian must be a valid employee in this organization')
    }

    if (alternateCustodianId) {
      const altCustodian = await prisma.employee.findFirst({
        where: { id: alternateCustodianId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true },
      })
      if (!altCustodian) {
        return apiBadRequest('Alternate custodian must be a valid employee in this organization')
      }
    }

    // Check code uniqueness within org
    const existing = await prisma.pettyCashFund.findUnique({
      where: {
        organizationId_code: {
          organizationId: auth.organizationId,
          code: code.trim(),
        },
      },
    })

    if (existing) {
      return apiConflict(`A petty cash fund with code "${code}" already exists in this organization`)
    }

    // Get org's base currency
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { baseCurrency: true },
    })
    const orgCurrency = org?.baseCurrency ?? 'BDT'

    // Find the GL account for petty cash (code 1102)
    const pettyCashGlAccount = await prisma.account.findFirst({
      where: {
        organizationId: auth.organizationId,
        code: '1102',
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    })

    const fund = await prisma.$transaction(async (tx) => {
      // Auto-create a BankAccount record for this petty cash fund
      const bankAccount = await tx.bankAccount.create({
        data: {
          organizationId: auth.organizationId,
          accountCode: `PC-${code.trim()}`,
          accountName: name.trim(),
          type: 'CASH',
          currencyCode: currencyCode || orgCurrency,
          currentBalance: imprestAmount,
          glAccountId: pettyCashGlAccount?.id || null,
        },
      })

      // Create the petty cash fund
      const newFund = await tx.pettyCashFund.create({
        data: {
          organizationId: auth.organizationId,
          name: name.trim(),
          code: code.trim(),
          imprestAmount,
          currentBalance: imprestAmount,
          currencyCode: currencyCode || orgCurrency,
          custodianId,
          alternateCustodianId: alternateCustodianId || null,
          bankAccountId: bankAccount.id,
          projectId: projectId || null,
          grantId: grantId || null,
          location: location || null,
          maxTransactionLimit: maxTransactionLimit || null,
          reconciliationFrequency: reconciliationFrequency || 'MONTHLY',
          effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
          notes: notes || null,
        },
        select: {
          id: true,
          name: true,
          code: true,
          imprestAmount: true,
          currentBalance: true,
          currencyCode: true,
          custodianId: true,
          alternateCustodianId: true,
          bankAccountId: true,
          projectId: true,
          grantId: true,
          location: true,
          maxTransactionLimit: true,
          reconciliationFrequency: true,
          effectiveDate: true,
          isActive: true,
          notes: true,
          bankAccount: {
            select: { id: true, accountCode: true, accountName: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      })

      return newFund
    })

    return apiCreated(fund)
  } catch (error) {
    return handleRouteError(error)
  }
}
