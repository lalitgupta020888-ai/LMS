import { STAMP, query } from '@/lib/db'
import { handler, ok } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = handler(async () => {
  const { rows } = await query(`
    SELECT b.id, b.isbn, b.title, b.author, b.category, b.publisher,
           b.total_copies, b.available_copies, ${STAMP('b.created_at')},
           COUNT(t.id)::int AS total_issues,
           COUNT(*) FILTER (WHERE t.status = 'issued')::int AS currently_issued
    FROM books b
    LEFT JOIN transactions t ON b.id = t.book_id
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `)

  return ok(rows)
})
