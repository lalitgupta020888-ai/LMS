# Athenaeum — Library Management System

A full-stack Next.js app: the UI *and* the API live here, backed by Postgres.
It replaces the Vite frontend in [`../frontend`](../frontend) and the Express +
SQLite server in [`../backend`](../backend), both of which are kept only for
reference.

## Why Postgres and not the old SQLite server

Vercel runs each request in a short-lived function with an ephemeral
filesystem. A SQLite file written there disappears between invocations and is
not shared across instances, so the Express backend could not be deployed as-is
without silently losing data. The API was therefore ported to Next.js Route
Handlers (`app/api/**`) talking to Postgres over a pooled connection.

## Running it

```bash
cd web
DATABASE_URL="postgres://…" npm run dev     # http://localhost:3000
```

Any Postgres works — Neon, Supabase, Vercel Postgres, or a local server. The
schema is created automatically on the first request, so an empty database is
all you need.

| Variable          | Purpose                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`    | **Required.** Postgres connection string. `POSTGRES_URL` is also accepted.  |
| `PGPOOL_MAX`      | Connections per instance. Default 3.                                        |
| `NEXT_PUBLIC_API_URL` | Points the browser at an external API instead of this app's own routes. Must end in `/api`. |

In serverless environments use a **pooled** connection string (for Neon, the
`-pooler` host) — many small instances each opening direct connections will
exhaust the server's limit.

## Migrating the old SQLite data

```bash
cd web
DATABASE_URL="postgres://…" node scripts/migrate-from-sqlite.mjs
```

Reads `../backend/library.db` by default (pass another path as the first
argument). Every insert is `ON CONFLICT DO NOTHING`, so it is safe to re-run;
id sequences are reset afterwards so new records do not collide.

## Pages

| Route           | What it does                                                     |
| --------------- | ---------------------------------------------------------------- |
| `/`             | Dashboard — stats, 14-day circulation chart, collection mix, overdue alerts |
| `/students`     | Member records with live loan counts, CRUD, CSV export           |
| `/books`        | Catalogue in grid or list view, availability meters, CRUD, CSV export |
| `/transactions` | Issue and return books, due-date tracking, fine projection       |
| `/reports`      | Leaderboards, most-borrowed chart, full book/student tables, CSV export |

## Interaction notes

- **Ctrl/⌘ K** opens a command palette for navigation and quick actions.
- The theme toggle persists to `localStorage` under `lms-theme`; an inline
  script in `app/layout.jsx` applies it before first paint so the page never
  flashes the wrong theme.
- The sidebar shows live API health, polled every 30s.
- Fines are projected client-side at ₹10/day to match the backend's calculation
  in `backend/server.js`, so an overdue row shows what will be charged before
  the return is actually recorded.

## Layout

```
web/
├── app/
│   ├── layout.jsx        # fonts, theme bootstrap, providers, shell
│   ├── globals.css       # design tokens, aurora background, component classes
│   ├── <route>/page.jsx  # one client component per page
│   └── api/**/route.js   # the API: students, books, transactions, reports
├── components/
│   ├── Shell.jsx         # sidebar, top bar, mobile drawer
│   ├── CommandPalette.jsx
│   ├── StatCard.jsx
│   ├── providers.jsx     # theme + toast context
│   └── ui.jsx            # modal, badge, table skeleton, form field, …
├── lib/
│   ├── api.js            # service wrappers the browser calls
│   ├── db.js             # pool, schema bootstrap, date formatting helpers
│   ├── route-helpers.js  # JSON responses and Postgres error mapping
│   └── format.js         # dates, currency, loan state, CSV export
└── scripts/
    └── migrate-from-sqlite.mjs
```

### A note on dates

node-postgres returns `DATE` columns as JavaScript `Date` objects, which
stringify as `"Sat Jan 17 2026 …"` rather than `"2026-01-17"`. The dashboard
buckets loans by day using those strings, so every query formats dates in SQL
via the `DATE()` / `STAMP()` helpers in `lib/db.js`. Keep using them when
adding queries, or day-level grouping will break in ways that only show up in
timezones ahead of UTC.

Colors are CSS variables on `:root` / `.dark` (see `globals.css`) surfaced to
Tailwind as `canvas`, `surface`, `ink`, `muted`, `faint` and `hairline`. Use
those names rather than raw slate/gray shades so both themes stay correct.
