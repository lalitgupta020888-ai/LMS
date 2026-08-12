# Athenaeum — LMS frontend

The Next.js frontend for the Library Management System. It replaces the older
Vite app in [`../frontend`](../frontend) and talks to the same Express + SQLite
backend in [`../backend`](../backend).

## Running it

The backend must be up first — it owns the database and every API route.

```bash
cd backend && npm start      # http://localhost:5000
cd web && npm run dev        # http://localhost:3000
```

`next.config.mjs` rewrites `/api/*` to `http://localhost:5000/api/*`, so the
browser only ever calls a same-origin path. No CORS hop, no API URL baked into
the bundle.

| Variable          | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `BACKEND_URL`     | Where the rewrite proxies to. Default `http://localhost:5000`.  |
| `NEXT_PUBLIC_API_URL` | Bypasses the rewrite and calls an absolute API URL from the browser. Must end in `/api`. |

For a hosted deployment where the API lives on another host, set `BACKEND_URL`
on the Next server and leave `NEXT_PUBLIC_API_URL` unset — the proxy keeps the
API same-origin and avoids CORS entirely.

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
│   └── <route>/page.jsx  # one client component per page
├── components/
│   ├── Shell.jsx         # sidebar, top bar, mobile drawer
│   ├── CommandPalette.jsx
│   ├── StatCard.jsx
│   ├── providers.jsx     # theme + toast context
│   └── ui.jsx            # modal, badge, table skeleton, form field, …
└── lib/
    ├── api.js            # typed-ish service wrappers over fetch
    └── format.js         # dates, currency, loan state, CSV export
```

Colors are CSS variables on `:root` / `.dark` (see `globals.css`) surfaced to
Tailwind as `canvas`, `surface`, `ink`, `muted`, `faint` and `hairline`. Use
those names rather than raw slate/gray shades so both themes stay correct.
