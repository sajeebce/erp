/**
 * Reusable helpers for validating multi-concern accounting dimensions.
 *
 * All helpers accept a Prisma client instance (via prisma from @/lib/db)
 * so callers don't need to import prisma separately.
 */

import { prisma } from '@/lib/db'
import { apiBadRequest, apiNotFound } from '@/lib/api-response'
import type { NextResponse } from 'next/server'

export interface DimensionInput {
  businessUnitId?: string | null
  costCenterId?: string | null
  fundClassId?: string | null
  projectId?: string | null
  grantId?: string | null
}

/**
 * Validates that all provided dimension IDs belong to the given organization
 * and satisfy relational rules (e.g. costCenter must belong to businessUnit).
 *
 * Returns an error NextResponse on failure, or null on success.
 */
export async function validateDimensions(
  organizationId: string,
  dims: DimensionInput
): Promise<NextResponse | null> {
  const { businessUnitId, costCenterId, fundClassId, projectId, grantId } = dims

  // Rule: if costCenterId is provided, businessUnitId must be provided
  if (costCenterId && !businessUnitId) {
    return apiBadRequest('businessUnitId is required when costCenterId is provided')
  }

  // Validate businessUnit
  if (businessUnitId) {
    const bu = await prisma.businessUnit.findFirst({
      where: { id: businessUnitId, organizationId, isActive: true },
    })
    if (!bu) return apiNotFound(`Business unit not found or inactive`)
  }

  // Validate costCenter (and ensure it belongs to the provided businessUnit)
  if (costCenterId) {
    const cc = await prisma.costCenter.findFirst({
      where: {
        id: costCenterId,
        organizationId,
        isActive: true,
        ...(businessUnitId ? { businessUnitId } : {}),
      },
    })
    if (!cc) {
      return apiNotFound(
        businessUnitId
          ? `Cost center not found, inactive, or does not belong to the selected business unit`
          : `Cost center not found or inactive`
      )
    }
  }

  // Validate fundClass
  if (fundClassId) {
    const fc = await prisma.fundClass.findFirst({
      where: { id: fundClassId, organizationId, isActive: true },
    })
    if (!fc) return apiNotFound(`Fund class not found or inactive`)
  }

  // Validate projectId (Project belongs to organization)
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    })
    if (!project) return apiNotFound(`Project not found`)
  }

  // Validate grantId (Grant's donor belongs to organization)
  if (grantId) {
    const grant = await prisma.grant.findFirst({
      where: { id: grantId, donor: { organizationId } },
    })
    if (!grant) return apiNotFound(`Grant not found`)
  }

  return null
}

/**
 * Extracts dimension fields from a parsed request body into a typed object.
 * Only includes fields that are explicitly present in the body (not undefined).
 */
export function extractDimensions(body: Record<string, unknown>): DimensionInput {
  const dims: DimensionInput = {}
  if ('businessUnitId' in body) dims.businessUnitId = (body.businessUnitId as string) ?? null
  if ('costCenterId' in body) dims.costCenterId = (body.costCenterId as string) ?? null
  if ('fundClassId' in body) dims.fundClassId = (body.fundClassId as string) ?? null
  if ('projectId' in body) dims.projectId = (body.projectId as string) ?? null
  if ('grantId' in body) dims.grantId = (body.grantId as string) ?? null
  return dims
}
