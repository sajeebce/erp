import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { uploadFile, deleteFile } from '@/lib/storage/storage-service'
import { getStorageAdapter } from '@/lib/storage/storage-factory'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; docId: string }>
}

async function getOwnedDocument(request: NextRequest, params: RouteParams['params']) {
  const auth = await requireAuthFromRequest(request)
  const { id: employeeId, docId } = await params

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    select: { id: true },
  })
  if (!employee) {
    return { auth, employeeId, docId, document: null }
  }

  const document = await prisma.employeeDocument.findFirst({
    where: { id: docId, employeeId },
  })

  return { auth, employeeId, docId, document }
}

async function deleteStoredFile(storageKey: string, organizationId: string) {
  const attachment = await prisma.attachment.findFirst({
    where: { storageKey },
    select: { id: true },
  })

  if (attachment) {
    await deleteFile(attachment.id, organizationId)
    return
  }

  const adapter = await getStorageAdapter()
  await adapter.delete(storageKey)
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { document } = await getOwnedDocument(request, params)
    if (!document) {
      return apiNotFound('Document not found')
    }

    const adapter = await getStorageAdapter()
    const buffer = await adapter.download(document.filePath)
    const attachment = await prisma.attachment.findFirst({
      where: { storageKey: document.filePath },
      select: { originalName: true, mimeType: true },
    })
    const fileName = (attachment?.originalName || document.name || 'document').replace(/"/g, '')

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': attachment?.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { auth, employeeId, docId, document } = await getOwnedDocument(request, params)
    if (!document) {
      return apiNotFound('Document not found')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string | null) || document.type
    const name = (formData.get('name') as string | null) || document.name
    const documentNumber = formData.get('documentNumber') as string | null
    const issuedDate = formData.get('issuedDate') as string | null
    const expiryDate = formData.get('expiryDate') as string | null
    const issuingAuthority = formData.get('issuingAuthority') as string | null
    const notes = formData.get('notes') as string | null

    const data: Record<string, unknown> = { type, name }

    if (file && file.size > 0) {
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
      data.filePath = uploaded.storageKey
      await deleteStoredFile(document.filePath, auth.organizationId)
    }

    if (documentNumber !== null) data.documentNumber = documentNumber || null
    if (issuedDate !== null) data.issuedDate = issuedDate ? new Date(issuedDate) : null
    if (expiryDate !== null) data.expiryDate = expiryDate ? new Date(expiryDate) : null
    if (issuingAuthority !== null) data.issuingAuthority = issuingAuthority || null
    if (notes !== null) data.notes = notes || null

    const updated = await prisma.employeeDocument.update({
      where: { id: docId },
      data,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { docId, document } = await getOwnedDocument(request, params)
    if (!document) {
      return apiNotFound('Document not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.documentNumber !== undefined) data.documentNumber = body.documentNumber || null
    if (body.issuedDate !== undefined) data.issuedDate = body.issuedDate ? new Date(body.issuedDate) : null
    if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
    if (body.issuingAuthority !== undefined) data.issuingAuthority = body.issuingAuthority || null
    if (body.notes !== undefined) data.notes = body.notes || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.employeeDocument.update({
      where: { id: docId },
      data,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { auth, docId, document } = await getOwnedDocument(request, params)
    if (!document) {
      return apiNotFound('Document not found')
    }

    await deleteStoredFile(document.filePath, auth.organizationId)

    await prisma.employeeDocument.delete({
      where: { id: docId },
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
