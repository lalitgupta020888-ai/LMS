import { STAMP, query, withTransaction } from '@/lib/db'
import { fail, handler, ok, parseId, text } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLUMNS = `id, isbn, title, author, category, publisher,
                 total_copies, available_copies, ${STAMP('created_at')}`

export const GET = handler(async (_request, { params }) => {
  const id = parseId(params.id)
  if (!id) return fail('Book not found', 404)

  const { rows } = await query(`SELECT ${COLUMNS} FROM books WHERE id = $1`, [id])
  if (rows.length === 0) return fail('Book not found', 404)
  return ok(rows[0])
})

export const PUT = handler(async (request, { params }) => {
  const id = parseId(params.id)
  if (!id) return fail('Book not found', 404)

  const body = await request.json().catch(() => ({}))
  const title = text(body.title)
  const author = text(body.author)
  if (!title || !author) return fail('Title and author are required')

  return withTransaction(async (client) => {
    // Lock the row: available_copies is derived from it and a concurrent
    // issue/return would otherwise race with this recalculation.
    const { rows } = await client.query(
      'SELECT total_copies, available_copies FROM books WHERE id = $1 FOR UPDATE',
      [id]
    )
    if (rows.length === 0) return fail('Book not found', 404)

    const book = rows[0]
    const requested = Number(body.total_copies)
    const newTotal =
      Number.isInteger(requested) && requested > 0 ? requested : book.total_copies
    const issued = book.total_copies - book.available_copies

    if (newTotal < issued) {
      return fail(
        `${issued} copy(ies) are currently on loan, so the total cannot drop below ${issued}.`
      )
    }

    await client.query(
      `UPDATE books
       SET isbn = $1, title = $2, author = $3, category = $4,
           publisher = $5, total_copies = $6, available_copies = $7
       WHERE id = $8`,
      [
        text(body.isbn),
        title,
        author,
        text(body.category),
        text(body.publisher),
        newTotal,
        newTotal - issued,
        id,
      ]
    )

    return ok({ message: 'Book updated successfully' })
  })
})

export const DELETE = handler(async (_request, { params }) => {
  const id = parseId(params.id)
  if (!id) return fail('Book not found', 404)

  const { rows: onLoan } = await query(
    `SELECT COUNT(*)::int AS count FROM transactions
     WHERE book_id = $1 AND status = 'issued'`,
    [id]
  )
  if (onLoan[0].count > 0) {
    return fail(
      `${onLoan[0].count} copy(ies) of this book are still on loan. Take them back before deleting it.`,
      409
    )
  }

  const { rowCount } = await query('DELETE FROM books WHERE id = $1', [id])
  if (rowCount === 0) return fail('Book not found', 404)
  return ok({ message: 'Book deleted successfully' })
})
