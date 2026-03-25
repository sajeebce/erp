import { NextResponse } from 'next/server'

interface SuccessResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
  message?: string
}

interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Success Responses ───

export function apiSuccess<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({ success: true, data } as SuccessResponse<T>, { status })
}

export function apiCreated<T>(data: T): NextResponse<SuccessResponse<T>> {
  return apiSuccess(data, 201)
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<SuccessResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    } as SuccessResponse<T[]>,
    { status: 200 }
  )
}

export function apiMessage(message: string, status = 200): NextResponse<SuccessResponse<null>> {
  return NextResponse.json({ success: true, data: null, message } as SuccessResponse<null>, { status })
}

// ─── Error Responses ───

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, string[]>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details && { details }) },
    } as ErrorResponse,
    { status }
  )
}

export function apiBadRequest(message: string, details?: Record<string, string[]>) {
  return apiError('BAD_REQUEST', message, 400, details)
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError('UNAUTHORIZED', message, 401)
}

export function apiForbidden(message = 'Forbidden') {
  return apiError('FORBIDDEN', message, 403)
}

export function apiNotFound(message = 'Resource not found') {
  return apiError('NOT_FOUND', message, 404)
}

export function apiConflict(message: string) {
  return apiError('CONFLICT', message, 409)
}

export function apiInternalError(message = 'Internal server error') {
  return apiError('INTERNAL_ERROR', message, 500)
}

// ─── Parse common query params ───

export function parsePaginationParams(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
  const skip = (page - 1) * limit
  const search = url.searchParams.get('search') || undefined
  const sort = url.searchParams.get('sort') || 'createdAt'
  const order = (url.searchParams.get('order') || 'desc') as 'asc' | 'desc'

  return { page, limit, skip, search, sort, order }
}

// ─── Handle route errors ───

export function handleRouteError(error: unknown): NextResponse<ErrorResponse> {
  if (error instanceof Error) {
    if (error.message.startsWith('Unauthorized')) {
      return apiUnauthorized(error.message)
    }
    if (error.message.startsWith('Forbidden')) {
      return apiForbidden(error.message)
    }
    if (error.message.startsWith('Not found') || error.message.startsWith('NOT_FOUND')) {
      return apiNotFound(error.message)
    }
    if (error.message.startsWith('Access denied')) {
      return apiForbidden(error.message)
    }
    console.error('Route error:', error.message)
    return apiBadRequest(error.message)
  }
  console.error('Unknown route error:', error)
  return apiInternalError()
}
