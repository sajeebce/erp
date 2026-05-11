import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { uploadFile } from '@/lib/storage/storage-service'
import {
  apiCreated,
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Upload a new document for employee
// Accepts multipart/form-data with:
//   file: the uploaded file
//   type: document type (NID_COPY, PHOTO, EDUCATIONAL_CERT, TIN_CERTIFICATE, etc.)
//   name: document name/label
// Optional: documentNumber, issuedDate, expiryDate, issuingAuthority, notes
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string
    const name = (formData.get('name') as string) || type
    const documentNumber = formData.get('documentNumber') as string | null
    const issuedDate = formData.get('issuedDate') as string | null
    const expiryDate = formData.get('expiryDate') as string | null
    const issuingAuthority = formData.get('issuingAuthority') as string | null
    const notes = formData.get('notes') as string | null

    if (!type) {
      return apiBadRequest('Document type is required')
    }

    if (!file || file.size === 0) {
      return apiBadRequest('Document file is required')
    }

    const uploaded = await uploadFile({
      organizationId: auth.organizationId,
      module: 'hr',
      entityType: 'employee_document',
      entityId: employeeId,
      fileName: file.name,
      fileBuffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type || 'application/octet-stream',
      uploadedById: auth.userId,
    })

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        name: name || type,
        type,
        filePath: uploaded.storageKey,
        documentNumber: documentNumber || undefined,
        issuedDate: issuedDate ? new Date(issuedDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        issuingAuthority: issuingAuthority || undefined,
        notes: notes || undefined,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'employee-document',
      resourceId: document.id,
      description: `Uploaded document "${name}" (${type}) for employee "${employee.fullName}"`,
      ...auditCtx,
    })

    return apiCreated(document)
  } catch (error) {
    return handleRouteError(error)
  }
}

// GET - List all documents for an employee
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' },
    })

    return apiSuccess(documents)
  } catch (error) {
    return handleRouteError(error)
  }
}
