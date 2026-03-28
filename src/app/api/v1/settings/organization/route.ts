import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const organization = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        localizedName: true,
        defaultLanguage: true,
        supportedLanguages: true,
        registrationNo: true,
        ngoabLicenseNo: true,
        mraLicenseNo: true,
        vatRegistrationNo: true,
        tin: true,
        address: true,
        district: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        baseCurrency: true,
        fiscalYearStartMonth: true,
        dateFormat: true,
        numberFormat: true,
        timezone: true,
        customDomain: true,
        domainVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!organization) {
      return apiNotFound('Organization not found')
    }

    return apiSuccess(organization)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const body = await request.json()

    const allowedFields = [
      'name',
      'registrationNo',
      'ngoabLicenseNo',
      'mraLicenseNo',
      'vatRegistrationNo',
      'tin',
      'address',
      'district',
      'phone',
      'email',
      'website',
      'baseCurrency',
      'fiscalYearStartMonth',
      'dateFormat',
      'numberFormat',
      'timezone',
      'localizedName',
      'defaultLanguage',
      'supportedLanguages',
    ] as const

    const data: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 2) {
        return apiBadRequest('Name must be at least 2 characters')
      }
      data.name = (data.name as string).trim()
    }

    // Validate email format if provided
    if (data.email !== undefined && data.email !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (typeof data.email !== 'string' || !emailRegex.test(data.email)) {
        return apiBadRequest('Invalid email format')
      }
    }

    // Validate fiscalYearStartMonth if provided
    if (data.fiscalYearStartMonth !== undefined) {
      const month = Number(data.fiscalYearStartMonth)
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return apiBadRequest('Fiscal year start month must be between 1 and 12')
      }
      data.fiscalYearStartMonth = month
    }

    const organization = await prisma.organization.update({
      where: { id: auth.organizationId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        localizedName: true,
        defaultLanguage: true,
        supportedLanguages: true,
        registrationNo: true,
        ngoabLicenseNo: true,
        mraLicenseNo: true,
        vatRegistrationNo: true,
        tin: true,
        address: true,
        district: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        baseCurrency: true,
        fiscalYearStartMonth: true,
        dateFormat: true,
        numberFormat: true,
        timezone: true,
        customDomain: true,
        domainVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(organization)
  } catch (error) {
    return handleRouteError(error)
  }
}
