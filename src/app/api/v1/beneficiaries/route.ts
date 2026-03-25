import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { beneficiaryNo: { contains: search, mode: 'insensitive' } },
        { nidNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const district = url.searchParams.get('district')
    if (district) {
      where.district = district
    }

    const upazila = url.searchParams.get('upazila')
    if (upazila) {
      where.upazila = upazila
    }

    const gender = url.searchParams.get('gender')
    if (gender) {
      where.gender = gender
    }

    const [beneficiaries, total] = await Promise.all([
      prisma.beneficiary.findMany({
        where,
        select: {
          id: true,
          beneficiaryNo: true,
          name: true,
          fatherSpouseName: true,
          dateOfBirth: true,
          age: true,
          gender: true,
          nidNumber: true,
          phone: true,
          division: true,
          district: true,
          upazila: true,
          union: true,
          village: true,
          address: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.beneficiary.count({ where }),
    ])

    return apiPaginated(beneficiaries, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      name,
      fatherSpouseName,
      dateOfBirth,
      age,
      gender,
      nidNumber,
      phone,
      division,
      district,
      upazila,
      union,
      village,
      address,
      notes,
    } = body

    if (!name) {
      return apiBadRequest('name is required')
    }

    // Check NID uniqueness within org if provided
    if (nidNumber) {
      const existingNid = await prisma.beneficiary.findFirst({
        where: {
          organizationId: auth.organizationId,
          nidNumber,
          deletedAt: null,
        },
      })
      if (existingNid) {
        return apiConflict('A beneficiary with this NID number already exists in this organization')
      }
    }

    const beneficiaryNo = await generateNextNumber(auth.organizationId, 'beneficiary')

    const beneficiary = await prisma.beneficiary.create({
      data: {
        organizationId: auth.organizationId,
        beneficiaryNo,
        name: name.trim(),
        fatherSpouseName: fatherSpouseName || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: age ?? null,
        gender: gender || null,
        nidNumber: nidNumber || null,
        phone: phone || null,
        division: division || null,
        district: district || null,
        upazila: upazila || null,
        union: union || null,
        village: village || null,
        address: address || null,
        notes: notes || null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        beneficiaryNo: true,
        name: true,
        fatherSpouseName: true,
        dateOfBirth: true,
        age: true,
        gender: true,
        nidNumber: true,
        phone: true,
        division: true,
        district: true,
        upazila: true,
        union: true,
        village: true,
        address: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiCreated(beneficiary)
  } catch (error) {
    return handleRouteError(error)
  }
}
