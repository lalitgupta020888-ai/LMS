/**
 * One-shot migration: copies the legacy SQLite database into Postgres.
 *
 *   cd web
 *   DATABASE_URL="postgres://…" node scripts/migrate-from-sqlite.mjs
 *
 * Safe to re-run — every insert is ON CONFLICT DO NOTHING, so existing rows
 * are left exactly as they are. Sequences are reset afterwards so new records
 * do not collide with the migrated ids.
 */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const SQLITE_PATH =
  process.argv[2] || path.resolve(here, '..', '..', 'backend', 'library.db')

const CONNECTION = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!CONNECTION) {
  console.error('✗ Set DATABASE_URL to your Postgres connection string first.')
  process.exit(1)
}
if (!existsSync(SQLITE_PATH)) {
  console.error(`✗ No SQLite database at ${SQLITE_PATH}`)
  process.exit(1)
}

// sqlite3 lives in the backend package, not this one.
const sqlite3 = require(path.resolve(here, '..', '..', 'backend', 'node_modules', 'sqlite3'))

const readAll = (db, sql) =>
  new Promise((resolve, reject) =>
    db.all(sql, [], (error, rows) => (error ? reject(error) : resolve(rows)))
  )

const client = new pg.Client({
  connectionString: CONNECTION,
  ssl: /\blocalhost\b|\b127\.0\.0\.1\b/.test(CONNECTION)
    ? false
    : { rejectUnauthorized: false },
})

const db = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY)

try {
  await client.connect()
  console.log(`→ Reading ${SQLITE_PATH}`)

  const students = await readAll(db, 'SELECT * FROM students')
  const books = await readAll(db, 'SELECT * FROM books')
  const transactions = await readAll(db, 'SELECT * FROM transactions')

  console.log(
    `→ Found ${students.length} student(s), ${books.length} book(s), ${transactions.length} transaction(s)`
  )

  await client.query('BEGIN')

  for (const s of students) {
    await client.query(
      `INSERT INTO students (id, student_id, name, email, phone, course, year, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::timestamptz, NOW()))
       ON CONFLICT DO NOTHING`,
      [s.id, s.student_id, s.name, s.email, s.phone, s.course, s.year, s.created_at]
    )
  }

  for (const b of books) {
    await client.query(
      `INSERT INTO books (id, isbn, title, author, category, publisher,
                          total_copies, available_copies, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, COALESCE($9::timestamptz, NOW()))
       ON CONFLICT DO NOTHING`,
      [
        b.id, b.isbn, b.title, b.author, b.category, b.publisher,
        b.total_copies, b.available_copies, b.created_at,
      ]
    )
  }

  for (const t of transactions) {
    await client.query(
      `INSERT INTO transactions (id, student_id, book_id, issue_date, return_date,
                                 due_date, status, fine_amount, created_at)
       VALUES ($1,$2,$3,$4::date,$5::date,$6::date,$7,$8, COALESCE($9::timestamptz, NOW()))
       ON CONFLICT DO NOTHING`,
      [
        t.id, t.student_id, t.book_id, t.issue_date, t.return_date,
        t.due_date, t.status, t.fine_amount ?? 0, t.created_at,
      ]
    )
  }

  // Explicit ids were supplied above, so the sequences never advanced.
  for (const table of ['students', 'books', 'transactions']) {
    await client.query(
      `SELECT setval(pg_get_serial_sequence($1, 'id'),
                     COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`,
      [table]
    )
  }

  await client.query('COMMIT')

  const { rows } = await client.query(`
    SELECT (SELECT COUNT(*)::int FROM students) AS students,
           (SELECT COUNT(*)::int FROM books) AS books,
           (SELECT COUNT(*)::int FROM transactions) AS transactions
  `)
  console.log('✓ Migration complete. Postgres now holds:', rows[0])
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('✗ Migration failed:', error.message)
  process.exitCode = 1
} finally {
  db.close()
  await client.end()
}
