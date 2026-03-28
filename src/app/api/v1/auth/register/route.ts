import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signAccessToken, signRefreshToken, validatePassword } from '@/lib/auth'
import { apiCreated, apiBadRequest, apiConflict, handleRouteError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgName, orgSlug, fullName, email, password, phone } = body

    // 1. Validate required fields
    if (!orgName || !orgSlug || !fullName || !email || !password) {
      return apiBadRequest('Organization name, slug, full name, email, and password are required')
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return apiBadRequest('Password does not meet requirements', { password: passwordCheck.errors })
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/
    if (!slugRegex.test(orgSlug)) {
      return apiBadRequest('Slug must be 4-50 chars, lowercase alphanumeric and hyphens only')
    }

    // 2. Check slug uniqueness
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    })
    if (existingOrg) {
      return apiConflict('Organization slug already taken')
    }

    // 3. Get default plan (Starter with trial, or Free)
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true, trialDays: { gt: 0 } },
      orderBy: { sortOrder: 'asc' },
    })

    if (!defaultPlan) {
      return apiBadRequest('No subscription plans available. Contact support.')
    }

    // 4. Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
        },
      })

      // Create subscription (trial)
      const now = new Date()
      const trialEnd = new Date(now.getTime() + defaultPlan.trialDays * 24 * 60 * 60 * 1000)

      await tx.tenantSubscription.create({
        data: {
          organizationId: org.id,
          planId: defaultPlan.id,
          status: 'TRIAL',
          billingCycle: 'MONTHLY',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd,
        },
      })

      // Create ADMIN role for this org
      const adminRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: 'ADMIN',
          description: 'Organization Administrator — full access',
          isSystem: true,
        },
      })

      // Assign all permissions to ADMIN role
      const allPermissions = await tx.permission.findMany()
      await tx.rolePermission.createMany({
        data: allPermissions.map((p) => ({
          roleId: adminRole.id,
          permissionId: p.id,
        })),
      })

      // Create admin user
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: email.toLowerCase(),
          passwordHash: hashPassword(password),
          fullName,
          phone: phone || null,
          roleId: adminRole.id,
          status: 'ACTIVE',
          mustChangePassword: false,
        },
      })

      // Create default number sequences
      const sequences = [
        { entity: 'voucher_dv', prefix: 'DV' },
        { entity: 'voucher_rv', prefix: 'RV' },
        { entity: 'voucher_cv', prefix: 'CV' },
        { entity: 'voucher_bv', prefix: 'BV' },
        { entity: 'voucher_jv', prefix: 'JV' },
        { entity: 'journal_entry', prefix: 'JE' },
        { entity: 'purchase_requisition', prefix: 'PR' },
        { entity: 'purchase_order', prefix: 'PO' },
        { entity: 'goods_receipt', prefix: 'GRN' },
        { entity: 'tender', prefix: 'TND' },
        { entity: 'contract', prefix: 'CON' },
        { entity: 'asset', prefix: 'AST' },
        { entity: 'employee', prefix: 'EMP' },
        { entity: 'beneficiary', prefix: 'BEN' },
        { entity: 'enrollment', prefix: 'ENR' },
        { entity: 'grant', prefix: 'GR' },
        { entity: 'fund_receipt', prefix: 'FR' },
        { entity: 'fund_requisition', prefix: 'FRQ' },
        { entity: 'project', prefix: 'PRJ' },
        { entity: 'grievance', prefix: 'GRV' },
        { entity: 'loan_application', prefix: 'LA' },
        { entity: 'loan_account', prefix: 'LN' },
        { entity: 'disbursement', prefix: 'DSB' },
        { entity: 'collection', prefix: 'COL' },
        { entity: 'leave_application', prefix: 'LV' },
        { entity: 'payroll_run', prefix: 'PAY' },
        { entity: 'budget_revision', prefix: 'BR' },
        { entity: 'asset_transfer', prefix: 'AT' },
        { entity: 'asset_maintenance', prefix: 'AM' },
        { entity: 'asset_disposal', prefix: 'AD' },
        { entity: 'donor_report', prefix: 'DR' },
        { entity: 'training', prefix: 'TRN' },
        { entity: 'samity', prefix: 'SMT' },
        { entity: 'vendor', prefix: 'VND' },
      ]

      await tx.numberSequence.createMany({
        data: sequences.map((s) => ({
          organizationId: org.id,
          ...s,
        })),
      })

      return { org, user, adminRole }
    })

    // 5. Create refresh token and sign JWTs
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        token: crypto.randomUUID(),
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const accessToken = await signAccessToken({
      userId: result.user.id,
      organizationId: result.org.id,
      roleId: result.adminRole.id,
      roleName: 'ADMIN',
    })

    const refreshToken = await signRefreshToken({
      userId: result.user.id,
      organizationId: result.org.id,
      tokenId: refreshTokenRecord.id,
    })

    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    })

    // 6. Return with cookies
    const response = apiCreated({
      accessToken,
      refreshToken,
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: 'ADMIN',
      },
    })

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    // Set locale cookie (default to 'en' for new registrations)
    response.cookies.set('NEXT_LOCALE', 'en', {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
    })

    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
