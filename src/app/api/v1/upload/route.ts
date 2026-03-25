import { NextRequest } from 'next/server'
import { requireAuthFromRequest } from '@/lib/auth'
import { uploadFile } from '@/lib/storage/storage-service'
import { apiCreated, apiBadRequest, handleRouteError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const module = formData.get('module') as string | null
    const entityType = formData.get('entityType') as string | null
    const entityId = formData.get('entityId') as string | null

    if (!file || !module || !entityType || !entityId) {
      return apiBadRequest('file, module, entityType, and entityId are required')
    }

    // Validate file size (50MB max default)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return apiBadRequest(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum 50MB`)
    }

    // Validate MIME type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedTypes.includes(file.type)) {
      return apiBadRequest(`File type ${file.type} is not allowed`)
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await uploadFile({
      organizationId: auth.organizationId,
      module,
      entityType,
      entityId,
      fileName: file.name,
      fileBuffer: buffer,
      mimeType: file.type,
      uploadedById: auth.userId,
    })

    return apiCreated(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
