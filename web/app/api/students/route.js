import { STAMP, query } from '@/lib/db'
import { fail, handler, ok, text } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLUMNS = `id, student_id, name, email, phone, course, year, ${STAMP('created_at')}`

export const GET = handler(async (request) => {
  const search = request.nextUrl.searchParams.get('search')

  if (search) {
    const term = `%${search}%`
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM students
       WHERE name ILIKE $1 OR student_id ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC`,
      [term]
    )
    return ok(rows)
  }

  const { rows } = await query(
    `SELECT ${COLUMNS} FROM students ORDER BY created_at DESC`
  )
  return ok(rows)
})

export const POST = handler(async (request) => {
  const body = await request.json().catch(() => ({}))
  const student_id = text(body.student_id)
  const name = text(body.name)
  const email = text(body.email)

  if (!student_id || !name || !email) {
    return fail('Student ID, name, and email are required')
  }

  const { rows } = await query(
    `INSERT INTO students (student_id, name, email, phone, course, year)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [student_id, name, email, text(body.phone), text(body.course), text(body.year)]
  )

  return ok({ id: rows[0].id, message: 'Student added successfully' }, 201)
})
