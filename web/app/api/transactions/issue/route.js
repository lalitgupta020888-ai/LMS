import { withTransaction } from '@/lib/db'
import { fail, handler, ok, text } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_DUE_DAYS = 14
const MAX_DUE_DAYS = 90

export const POST = handler(async (request) => {
  const body = await request.json().catch(() => ({}))
  const studentId = text(body.student_id)
  const bookId = Number(body.book_id)

  if (!studentId || !Number.isInteger(bookId) || bookId < 1) {
    return fail('Student ID and Book ID are required')
  }

  const requestedDays = Number(body.due_days)
  const days =
    Number.isInteger(requestedDays) && requestedDays > 0
      ? Math.min(requestedDays, MAX_DUE_DAYS)
      : DEFAULT_DUE_DAYS

  return withTransaction(async (client) => {
    const { rows: students } = await client.query(
      'SELECT student_id FROM students WHERE student_id = $1',
      [studentId]
    )
    if (students.length === 0) return fail('Student not found', 404)

    // FOR UPDATE so two simultaneous issues cannot both see the last copy.
    const { rows: books } = await client.query(
      'SELECT id, available_copies FROM books WHERE id = $1 FOR UPDATE',
      [bookId]
    )
    if (books.length === 0) return fail('Book not found', 404)
    if (books[0].available_copies <= 0) return fail('Book is not available')

    const { rows } = await client.query(
      `INSERT INTO transactions (student_id, book_id, issue_date, due_date, status)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + $3::int, 'issued')
       RETURNING id`,
      [studentId, bookId, days]
    )

    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [bookId]
    )

    return ok({ id: rows[0].id, message: 'Book issued successfully' }, 201)
  })
})
