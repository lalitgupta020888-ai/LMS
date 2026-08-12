import { DATE, STAMP, query } from '@/lib/db'
import { handler, ok } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = handler(async (request) => {
  const status = request.nextUrl.searchParams.get('status')
  const studentId = request.nextUrl.searchParams.get('student_id')

  const conditions = []
  const params = []

  if (status) {
    params.push(status)
    conditions.push(`t.status = $${params.length}`)
  }
  if (studentId) {
    params.push(studentId)
    conditions.push(`t.student_id = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await query(
    `SELECT t.id, t.student_id, t.book_id, t.status, t.fine_amount,
            ${DATE('t.issue_date')}, ${DATE('t.due_date')}, ${DATE('t.return_date')},
            ${STAMP('t.created_at')},
            s.name AS student_name, s.email AS student_email,
            b.title AS book_title, b.author AS book_author, b.isbn
     FROM transactions t
     JOIN students s ON t.student_id = s.student_id
     JOIN books b ON t.book_id = b.id
     ${where}
     ORDER BY t.created_at DESC`,
    params
  )

  return ok(rows)
})
