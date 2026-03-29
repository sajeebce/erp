import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(dateStr: string): Date | null {
  const str = dateStr.trim()
  if (!str) return null

  // Try YYYY-MM-DD
  if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(str)) {
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  const parts = str.split(/[/-]/)
  if (parts.length !== 3) return null

  const a = Number(parts[0])
  const b = Number(parts[1])
  const c = Number(parts[2])

  let year: number, month: number, day: number

  if (c > 100) {
    // DD/MM/YYYY or MM/DD/YYYY
    year = c
    if (a > 12) {
      // DD/MM/YYYY (day > 12, must be day)
      day = a; month = b
    } else if (b > 12) {
      // MM/DD/YYYY (second > 12, must be day)
      month = a; day = b
    } else {
      // Ambiguous — assume DD/MM/YYYY (international standard)
      day = a; month = b
    }
  } else {
    // YY/MM/DD or similar — unlikely, try as-is
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  if (year < 100) year += 2000
  const d = new Date(year, month - 1, day)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: { id, bankAccount: { organizationId: auth.organizationId } },
    })
    if (!reconciliation) return apiNotFound('Reconciliation not found')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const dateCol = Number(formData.get('dateCol') ?? 0)
    const descCol = Number(formData.get('descCol') ?? 1)
    const refCol = formData.get('refCol') as string || ''
    const debitCol = Number(formData.get('debitCol') ?? 2)
    const creditCol = Number(formData.get('creditCol') ?? 3)
    const skipHeader = formData.get('skipHeader') !== 'false'

    if (!file) return apiBadRequest('CSV file is required')

    const text = await file.text()
    const rawLines = text.split(/\r?\n/).filter(l => l.trim())
    const dataLines = skipHeader ? rawLines.slice(1) : rawLines

    const items: Array<{
      date: Date
      description: string
      reference: string | null
      bankAmount: number
      type: string
    }> = []

    for (const line of dataLines) {
      const cols = parseCSVLine(line)

      const dateStr = cols[dateCol] || ''
      const desc = cols[descCol] || ''
      const ref = refCol ? (cols[Number(refCol)] || null) : null

      const debitStr = (cols[debitCol] || '').replace(/[^0-9.-]/g, '')
      const creditStr = (cols[creditCol] || '').replace(/[^0-9.-]/g, '')
      const debit = parseFloat(debitStr) || 0
      const credit = parseFloat(creditStr) || 0

      if (!desc) continue

      const date = parseDate(dateStr)
      if (!date) continue

      // Skip rows where both debit and credit are 0
      if (debit === 0 && credit === 0) continue

      const amount = debit > 0 ? debit : credit
      const type = debit > 0 ? 'WITHDRAWAL' : 'DEPOSIT'

      items.push({ date, description: desc, reference: ref, bankAmount: amount, type })
    }

    if (items.length === 0) return apiBadRequest('No valid rows found in CSV')

    const created = await prisma.$transaction(
      items.map(item =>
        prisma.bankReconciliationItem.create({
          data: {
            reconciliationId: id,
            date: item.date,
            description: item.description,
            reference: item.reference,
            bookAmount: null,
            bankAmount: item.bankAmount,
            type: item.type,
            isMatched: false,
          },
        })
      )
    )

    return apiSuccess({ imported: created.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
