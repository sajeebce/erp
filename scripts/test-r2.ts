import 'dotenv/config'
import { prisma } from '../src/lib/db'
import { invalidateStorageCache, getRequiredUploadStorageAdapter } from '../src/lib/storage/storage-factory'

async function main() {
  invalidateStorageCache()
  const adapter = await getRequiredUploadStorageAdapter() as { testConnection: () => Promise<{ success: boolean; error?: string }> }
  const r = await adapter.testConnection()
  if (r.success) console.log('✅ R2 reachable — PUT + DELETE round-trip succeeded')
  else console.log('❌ R2 FAILED:', r.error)
  await prisma.$disconnect()
}

main().catch(e => { console.error('ERR', e.message); process.exit(1) })
