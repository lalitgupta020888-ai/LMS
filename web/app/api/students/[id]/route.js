import { STAMP, query } from '@/lib/db'
import { fail, handler, ok, parseId, text } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLUMNS = `id, student_id, name, email, phone, course, year, ${STAMP('created_at')}`

export const GET = handler(async (_request, { params }) => {
  const id = parseId(params.id)
  if (!id) return fail('Student not found', 404)

  const { rows } = await query(`SELECT ${COLUMNS} FROM students WHERE id = $1`, [id])
  if (rows.length === 0) return fail('Student not found', 404)
  return ok(rows[0])
})

export const PUT = handler(async (request, { params }) => {
  const id = parseId(params.id)
  if (!id) return fail('Student not found', 404)

  const body = await request.json().catch(() => ({}))
  const name = text(body.name)
  const email = text(body.email)
  if (!name || !email) return fail('Name and email are required')

  const { rowCount } = await query(
    `UPDATE students
     SET student_id = $1, name = $2, email = $3, phone = $4, course = $5, year = $6
     WHERE id = $7`,
    [
      text(body.student_id),
      name,
      email,
      text(body.phone),
      text(body.course),
      text(body.year),
      id,
    ]
  )

  if (rowCount === 0) return fail('Student not found', 404)
  return ok({ message: 'Student updated successfully' })
})

export const DELETE = handler(async (_request, { params }) => {
  const id = parseId(params.id)
  if (!id) return fail('Student not found', 404)

  // Loan history references students by student_id, so refuse rather than
  // silently orphan it — the UI surfaces this message directly.
  const { rows } = await query('SELECT student_id FROM students WHERE id = $1', [id])
  if (rows.length === 0) return fail('Student not found', 404)

  const { rows: loans } = await query(
    `SELECT COUNT(*)::int AS count FROM transactions WHERE student_id = $1`,
    [rows[0].student_id]
  )
  if (loans[0].count > 0) {
    return fail(
      `This student has ${loans[0].count} transaction(s) on record. Delete the loan history first, or keep the student for an accurate audit trail.`,
      409
    )
  }

  await query('DELETE FROM students WHERE id = $1', [id])
  return ok({ message: 'Student deleted successfully' })
})
