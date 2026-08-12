import { STAMP, query } from '@/lib/db'
import { fail, handler, ok, text } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLUMNS = `id, isbn, title, author, category, publisher,
                 total_copies, available_copies, ${STAMP('created_at')}`

export const GET = handler(async (request) => {
  const search = request.nextUrl.searchParams.get('search')

  if (search) {
    const term = `%${search}%`
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM books
       WHERE title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1 OR category ILIKE $1
       ORDER BY created_at DESC`,
      [term]
    )
    return ok(rows)
  }

  const { rows } = await query(
    `SELECT ${COLUMNS} FROM books ORDER BY created_at DESC`
  )
  return ok(rows)
})

export const POST = handler(async (request) => {
  const body = await request.json().catch(() => ({}))
  const isbn = text(body.isbn)
  const title = text(body.title)
  const author = text(body.author)

  if (!isbn || !title || !author) {
    return fail('ISBN, title, and author are required')
  }

  const copies = Number(body.total_copies) || 1
  if (!Number.isInteger(copies) || copies < 1) {
    return fail('Total copies must be a whole number of at least 1')
  }

  const { rows } = await query(
    `INSERT INTO books (isbn, title, author, category, publisher, total_copies, available_copies)
     VALUES ($1, $2, $3, $4, $5, $6, $6)
     RETURNING id`,
    [isbn, title, author, text(body.category), text(body.publisher), copies]
  )

  return ok({ id: rows[0].id, message: 'Book added successfully' }, 201)
})
