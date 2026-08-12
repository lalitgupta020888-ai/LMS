import { withTransaction } from '@/lib/db'
import { fail, handler, ok } from '@/lib/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Matches the fine the UI projects on overdue rows. */
const FINE_PER_DAY = 10

export const POST = handler(async (request) => {
  const body = await request.json().catch(() => ({}))
  const transactionId = Number(body.transaction_id)

  if (!Number.isInteger(transactionId) || transactionId < 1) {
    return fail('Transaction ID is required')
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, book_id, GREATEST(CURRENT_DATE - due_date, 0) AS days_late
       FROM transactions
       WHERE id = $1 AND status = 'issued'
       FOR UPDATE`,
      [transactionId]
    )
    if (rows.length === 0) {
      return fail('Transaction not found or already returned', 404)
    }

    const fineAmount = Number(rows[0].days_late) * FINE_PER_DAY

    await client.query(
      `UPDATE transactions
       SET return_date = CURRENT_DATE, status = 'returned', fine_amount = $1
       WHERE id = $2`,
      [fineAmount, transactionId]
    )

    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [rows[0].book_id]
    )

    return ok({ message: 'Book returned successfully', fine_amount: fineAmount })
  })
})
