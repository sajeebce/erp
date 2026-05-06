import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'
import { getStorageAdapter } from '@/lib/storage/storage-factory'

interface RouteParams {
  params: Promise<{ id: string; document: string }>
}

function getContentType(filePath: string) {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.doc')) return 'application/msword'
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return 'application/octet-stream'
}

function getFileName(filePath: string, fallback: string) {
  const name = filePath.split('/').pop() || fallback
  return name.replace(/"/g, '')
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, document } = await params

    if (document !== 'cv' && document !== 'cover-letter') {
      return apiBadRequest('document must be cv or cover-letter')
    }

    const application = await prisma.jobApplication.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: {
        applicantName: true,
        cvFilePath: true,
        coverLetterPath: true,
      },
    })

    if (!application) {
      return apiNotFound('Application not found')
    }

    const filePath = document === 'cv' ? application.cvFilePath : application.coverLetterPath
    if (!filePath) {
      return apiNotFound('Document not found')
    }

    const adapter = await getStorageAdapter()
    const file = await adapter.download(filePath)
    const fileName = getFileName(filePath, `${application.applicantName}-${document}`)

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': getContentType(filePath),
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
