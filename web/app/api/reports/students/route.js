import { STAMP, query } from '@/lib/db'
import { handler, ok } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = handler(async () => {
  const { rows } = await query(`
    SELECT s.id, s.student_id, s.name, s.email, s.phone, s.course, s.year,
           ${STAMP('s.created_at')},
           COUNT(t.id)::int AS total_books_issued,
           COUNT(*) FILTER (WHERE t.status = 'issued')::int AS currently_issued
    FROM students s
    LEFT JOIN transactions t ON s.student_id = t.student_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `)

  return ok(rows)
})
