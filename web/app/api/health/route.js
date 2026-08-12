import { query } from '@/lib/db'
import { handler, ok } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = handler(async () => {
  // Touch the database so "OK" means the whole path works, not just the route.
  await query('SELECT 1')
  return ok({
    status: 'OK',
    message: 'Library Management System API is running',
  })
})
