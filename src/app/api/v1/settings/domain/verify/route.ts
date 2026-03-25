import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const organization = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        customDomain: true,
        domainVerified: true,
      },
    })

    if (!organization) {
      return apiNotFound('Organization not found')
    }

    if (!organization.customDomain) {
      return apiBadRequest('No custom domain has been configured. Set a custom domain first.')
    }

    // TODO: Implement actual DNS verification (CNAME lookup)
    // For now, return instructions for manual setup
    return apiSuccess({
      domain: organization.customDomain,
      verified: organization.domainVerified,
      instructions: `Add a CNAME record for "${organization.customDomain}" pointing to "cname.ngoerp.com"`,
      records: [
        {
          type: 'CNAME',
          name: organization.customDomain,
          value: 'cname.ngoerp.com',
        },
      ],
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
