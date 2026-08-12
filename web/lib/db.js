import { Pool } from 'pg'
import { SCHEMA } from '@/lib/schema.mjs'

/**
 * Postgres access for the API route handlers.
 *
 * Two drivers sit behind one interface:
 *
 *   DATABASE_URL set  → node-postgres against a real server (any Postgres:
 *                       Neon, Supabase, Vercel Postgres, self-hosted).
 *   not set, dev      → PGlite, a full Postgres compiled to WebAssembly that
 *                       runs in-process and persists to web/.pglite. This
 *                       exists so `npm run dev` works with no setup at all.
 *   not set, prod     → DatabaseNotConfiguredError. Never fall back silently
 *                       in production; a local file is not a real database.
 *
 * Serverless functions are recycled constantly, so the driver and the schema
 * bootstrap are cached on globalThis — otherwise every cold start would open a
 * new pool and re-run the DDL.
 */

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'No database configured. Set DATABASE_URL to a Postgres connection string.'
    )
    this.name = 'DatabaseNotConfiguredError'
  }
}

/* ------------------------------------------------------------ pg driver */

function createPostgresDriver() {
  const pool = new Pool({
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

  return {
    name: 'postgres',
    query: (text, params) => pool.query(text, params),
    // Multi-statement DDL. node-postgres allows it whenever no parameters are
    // bound, because that uses the simple query protocol.
    exec: (sql) => pool.query(sql),
    async transaction(fn) {
      const client = await pool.connect()
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
    },
  }
}

/* -------------------------------------------------------- PGlite driver */

async function createEmbeddedDriver() {
  let PGlite
  try {
    ;({ PGlite } = await import('@electric-sql/pglite'))
  } catch {
    throw new DatabaseNotConfiguredError()
  }

  const db = await PGlite.create({ dataDir: process.env.PGLITE_DIR || '.pglite' })
  console.log(
    '\n  ▲ No DATABASE_URL — using the embedded PGlite database in web/.pglite.' +
      '\n    Set DATABASE_URL to point at a real Postgres instead.\n'
  )

  // PGlite reports affected rows under a different name and has no pooling,
  // so normalise its result to the shape node-postgres returns.
  const adapt = (target) => ({
    query: async (text, params) => {
      const result = await target.query(text, params)
      return {
        rows: result.rows ?? [],
        rowCount: result.affectedRows ?? result.rows?.length ?? 0,
      }
    },
  })

  const client = adapt(db)

  return {
    name: 'pglite',
    query: (text, params) => client.query(text, params),
    // query() goes through the extended protocol, which permits exactly one
    // statement; exec() is the multi-statement path.
    exec: (sql) => db.exec(sql),
    // PGlite drives BEGIN/COMMIT itself; handing the callback a raw client
    // would let it issue a second BEGIN and error.
    transaction: (fn) => db.transaction((tx) => fn(adapt(tx))),
  }
}

function createDriver() {
  if (CONNECTION_STRING) return Promise.resolve(createPostgresDriver())
  if (IS_PRODUCTION) return Promise.reject(new DatabaseNotConfiguredError())
  return createEmbeddedDriver()
}

function getDriver() {
  if (!globalThis.__lmsDriver) {
    globalThis.__lmsDriver = createDriver().catch((error) => {
      globalThis.__lmsDriver = undefined
      throw error
    })
  }
  return globalThis.__lmsDriver
}


/** Idempotent; the first caller in a process runs it and the rest await it. */
export function ensureSchema() {
  if (!globalThis.__lmsSchemaReady) {
    globalThis.__lmsSchemaReady = getDriver()
      .then((driver) => driver.exec(SCHEMA))
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
  const driver = await getDriver()
  return driver.query(text, params)
}

/** Runs `fn` inside a transaction, rolling back on any throw. */
export async function withTransaction(fn) {
  await ensureSchema()
  const driver = await getDriver()
  return driver.transaction(fn)
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
