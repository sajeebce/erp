import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify reconciliation belongs to this org through bankAccount
    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id,
        bankAccount: {
          organizationId: auth.organizationId,
        },
      },
    })

    if (!reconciliation) {
      return apiNotFound('Bank reconciliation not found')
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiBadRequest('items must be a non-empty array')
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.date) {
        return apiBadRequest(`items[${i}].date is required`)
      }
      if (!item.description) {
        return apiBadRequest(`items[${i}].description is required`)
      }
      if (!item.type) {
        return apiBadRequest(`items[${i}].type is required`)
      }
    }

    // Create all reconciliation items in a transaction
    const createdItems = await prisma.$transaction(
      items.map((item: {
        date: string
        description: string
        reference?: string
        bookAmount?: number
        bankAmount?: number
        type: string
        isMatched?: boolean
        matchedJournalId?: string
      }) =>
        prisma.bankReconciliationItem.create({
          data: {
            reconciliationId: id,
            date: new Date(item.date),
            description: item.description,
            reference: item.reference || null,
            bookAmount: item.bookAmount ?? null,
            bankAmount: item.bankAmount ?? null,
            type: item.type,
            isMatched: item.isMatched ?? false,
            matchedJournalId: item.matchedJournalId || null,
          },
          select: {
            id: true,
            date: true,
            description: true,
            reference: true,
            bookAmount: true,
            bankAmount: true,
            isMatched: true,
            matchedJournalId: true,
            type: true,
          },
        })
      )
    )

    return apiCreated({
      reconciliationId: id,
      itemsCreated: createdItems.length,
      items: createdItems,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
