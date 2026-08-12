import { query } from '@/lib/db'
import { handler, ok } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = handler(async () => {
  // COUNT and SUM come back as bigint/numeric, which node-postgres hands over
  // as strings — cast so the JSON carries real numbers like the old API did.
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM students) AS total_students,
      (SELECT COUNT(*)::int FROM books) AS total_books,
      (SELECT COUNT(*)::int FROM transactions WHERE status = 'issued') AS total_issued,
      (SELECT COUNT(*)::int FROM transactions WHERE status = 'returned') AS total_returned,
      (SELECT COALESCE(SUM(fine_amount), 0)::float8
         FROM transactions WHERE status = 'returned') AS total_fine
  `)

  return ok(rows[0])
})
