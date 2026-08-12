/**
 * One-shot migration: copies the legacy SQLite database into Postgres.
 *
 *   cd web
 *   node scripts/migrate-from-sqlite.mjs                 # embedded dev database
 *   DATABASE_URL="postgres://…" node scripts/…           # a real Postgres
 *
 * The target is chosen the same way lib/db.js chooses it, so this always writes
 * where the app reads. With no DATABASE_URL that is the embedded PGlite
 * database — stop the dev server first, because PGlite holds an exclusive lock
 * on its data directory.
 *
 * Safe to re-run: every insert is ON CONFLICT DO NOTHING, so existing rows are
 * left exactly as they are. Sequences are reset afterwards so new records do
 * not collide with the migrated ids.
 */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SCHEMA } from '../lib/schema.mjs'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const SQLITE_PATH =
  process.argv[2] || path.resolve(here, '..', '..', 'backend', 'library.db')

if (!existsSync(SQLITE_PATH)) {
  console.error(`✗ No SQLite database at ${SQLITE_PATH}`)
  process.exit(1)
}

// sqlite3 lives in the backend package, not this one.
const sqlite3 = require(
  path.resolve(here, '..', '..', 'backend', 'node_modules', 'sqlite3')
)

const readAll = (db, sql) =>
  new Promise((resolve, reject) =>
    db.all(sql, [], (error, rows) => (error ? reject(error) : resolve(rows)))
  )

const CONNECTION = process.env.DATABASE_URL || process.env.POSTGRES_URL

/** Mirrors the driver choice in lib/db.js, which this script cannot import
 *  directly: web/package.json is CommonJS, so plain Node rejects that file. */
async function connect() {
  if (CONNECTION) {
    const { default: pg } = await import('pg')
    const client = new pg.Client({
      connectionString: CONNECTION,
      ssl: /\blocalhost\b|\b127\.0\.0\.1\b/.test(CONNECTION)
        ? false
        : { rejectUnauthorized: false },
    })
    await client.connect()
    return {
      label: 'Postgres',
      exec: (sql) => client.query(sql),
      query: (text, params) => client.query(text, params),
      transaction: async (fn) => {
        try {
          await client.query('BEGIN')
          const result = await fn(client)
          await client.query('COMMIT')
          return result
        } catch (error) {
          await client.query('ROLLBACK').catch(() => {})
          throw error
        }
      },
      close: () => client.end(),
    }
  }

  const { PGlite } = await import('@electric-sql/pglite')
  const dataDir = path.resolve(here, '..', process.env.PGLITE_DIR || '.pglite')
  let db
  try {
    db = await PGlite.create({ dataDir })
  } catch (error) {
    console.error(
      `✗ Could not open the embedded database at ${dataDir}.\n` +
        '  Stop the dev server first — it holds an exclusive lock on it.\n' +
        `  (${error.message})`
    )
    process.exit(1)
  }
  const adapt = (target) => ({
    query: async (text, params) => ({
      rows: (await target.query(text, params)).rows ?? [],
    }),
  })
  return {
    label: `embedded PGlite (${dataDir})`,
    exec: (sql) => db.exec(sql),
    query: (text, params) => adapt(db).query(text, params),
    transaction: (fn) => db.transaction((tx) => fn(adapt(tx))),
    close: () => db.close(),
  }
}

const client = await connect()
const sqlite = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY)

try {
  console.log(`→ Target: ${client.label}`)
  // Creates the tables if this is a fresh database.
  await client.exec(SCHEMA)

  console.log(`→ Reading ${SQLITE_PATH}`)
  const students = await readAll(sqlite, 'SELECT * FROM students')
  const books = await readAll(sqlite, 'SELECT * FROM books')
  const transactions = await readAll(sqlite, 'SELECT * FROM transactions')
  console.log(
    `→ Found ${students.length} student(s), ${books.length} book(s), ${transactions.length} transaction(s)`
  )

  await client.transaction(async (tx) => {
    for (const s of students) {
      await tx.query(
        `INSERT INTO students (id, student_id, name, email, phone, course, year, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::timestamptz, NOW()))
         ON CONFLICT DO NOTHING`,
        [s.id, s.student_id, s.name, s.email, s.phone, s.course, s.year, s.created_at]
      )
    }

    for (const b of books) {
      await tx.query(
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
      await tx.query(
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
      await tx.query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'),
                       COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`,
        [table]
      )
    }
  })

  const { rows } = await client.query(`
    SELECT (SELECT COUNT(*)::int FROM students) AS students,
           (SELECT COUNT(*)::int FROM books) AS books,
           (SELECT COUNT(*)::int FROM transactions) AS transactions
  `)
  console.log('✓ Migration complete. The database now holds:', rows[0])
} catch (error) {
  console.error('✗ Migration failed:', error.message)
  if (/lock|EBUSY|in use/i.test(error.message)) {
    console.error('  Stop the dev server first — it holds the database open.')
  }
  process.exitCode = 1
} finally {
  sqlite.close()
}

// The pg pool and PGlite both keep the event loop alive.
process.exit(process.exitCode ?? 0)
