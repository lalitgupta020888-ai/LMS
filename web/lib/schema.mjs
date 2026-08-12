/**
 * The database schema, in one place.
 *
 * Deliberately `.mjs`: web/package.json has no `"type": "module"`, so plain
 * Node treats a `.js` file here as CommonJS and cannot import it. The `.mjs`
 * extension lets both the Next app (via webpack) and the standalone migration
 * script (via `node`) load exactly the same definition.
 *
 * Every statement is idempotent, so this runs on each cold start.
 */
export const SCHEMA = `
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
