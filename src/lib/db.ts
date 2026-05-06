import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  _prismaVersion: number | undefined
}

// Bump this version to force PrismaClient re-creation after schema changes
const PRISMA_CLIENT_VERSION = 10

function createPrismaClient() {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Re-create the client if the version has changed (e.g. after prisma generate)
if (globalForPrisma._prismaVersion !== PRISMA_CLIENT_VERSION) {
  globalForPrisma.prisma = undefined
  globalForPrisma._prismaVersion = PRISMA_CLIENT_VERSION
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
