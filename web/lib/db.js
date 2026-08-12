import { Pool } from 'pg'

/**
 * Postgres access for the API route handlers.
 *
 * Serverless functions are recycled constantly, so both the pool and the
 * schema bootstrap are cached on globalThis — otherwise every cold start
 * would open a new pool and re-run the DDL.
 *
 * Any Postgres works (Neon, Supabase, Vercel Postgres, self-hosted). Point
 * DATABASE_URL at a *pooled* connection string in serverless environments.
 */

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'No database configured. Set DATABASE_URL to a Postgres connection string.'
    )
    this.name = 'DatabaseNotConfiguredError'
  }
}

function createPool() {
  if (!CONNECTION_STRING) throw new DatabaseNotConfiguredError()

  return new Pool({
    connectionString: CONNECTION_STRING,
    // Hosted Postgres uses TLS with certificates we do not pin locally.
    ssl: /\blocalhost\b|\b127\.0\.0\.1\b/.test(CONNECTION_STRING)
      ? false
      : { rejectUnauthorized: false },
    // Serverless instances are numerous and short-lived, so each one should
    // hold very few connections. Override with PGPOOL_MAX when running against
    // a database that accepts only one connection at a time.
    max: Number(process.env.PGPOOL_MAX) || 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  })
}

export function getPool() {
  if (!globalThis.__lmsPool) {
    globalThis.__lmsPool = createPool()
  }
  return globalThis.__lmsPool
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS students (
    id           SERIAL PRIMARY KEY,
    student_id   TEXT UNIQUE NOT NULL,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT,
    course       TEXT,
    year         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS books (
    id               SERIAL PRIMARY KEY,
    isbn             TEXT UNIQUE NOT NULL,
    title            TEXT NOT NULL,
    author           TEXT NOT NULL,
    category         TEXT,
    publisher        TEXT,
    total_copies     INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          SERIAL PRIMARY KEY,
    student_id  TEXT NOT NULL REFERENCES students(student_id) ON UPDATE CASCADE,
    book_id     INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    issue_date  DATE NOT NULL,
    return_date DATE,
    due_date    DATE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'issued',
    fine_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS transactions_student_idx ON transactions (student_id);
  CREATE INDEX IF NOT EXISTS transactions_book_idx ON transactions (book_id);
  CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions (status);
`

/** Idempotent; the first caller in a process runs it and the rest await it. */
export function ensureSchema() {
  if (!globalThis.__lmsSchemaReady) {
    globalThis.__lmsSchemaReady = getPool()
      .query(SCHEMA)
      .catch((error) => {
        // Let the next request retry rather than caching a failure forever.
        globalThis.__lmsSchemaReady = undefined
        throw error
      })
  }
  return globalThis.__lmsSchemaReady
}

export async function query(text, params = []) {
  await ensureSchema()
  return getPool().query(text, params)
}

/** Runs `fn` inside BEGIN/COMMIT, rolling back on any throw. */
export async function withTransaction(fn) {
  await ensureSchema()
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

/* --------------------------------------------------------------- formatting */

/*
 * The frontend was written against the SQLite backend, which handed back dates
 * as plain strings. node-postgres hands back Date objects, and stringifying
 * those produces "Sat Jan 17 2026 …" instead of "2026-01-17" — which silently
 * breaks the dashboard's day bucketing. Every query below therefore formats
 * dates in SQL so the JSON shape stays byte-for-byte what the UI expects.
 */
/** `t.issue_date` -> `issue_date`, so the alias is never table-qualified. */
const aliasOf = (column) => column.split('.').pop()

export const DATE = (column) =>
  `to_char(${column}, 'YYYY-MM-DD') AS ${aliasOf(column)}`

export const STAMP = (column) =>
  `to_char(${column}, 'YYYY-MM-DD HH24:MI:SS') AS ${aliasOf(column)}`
