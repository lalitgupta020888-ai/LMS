# Deployment

The app is deployed from [`web/`](web) as a single Vercel project — UI and API
together. There is no separate backend to host.

- **Live:** https://lms-nu-sandy.vercel.app
- **Repository:** https://github.com/lalitgupta020888-ai/LMS
- **Vercel project:** `lms` (root directory `web`, production branch `main`)

Pushing to `main` triggers a production build automatically.

> `QUICK_FIX.md` and `FIX_INSTRUCTIONS.md` describe the retired Vite frontend
> and its `VITE_API_URL` problem. That setup no longer exists — the browser
> calls this app's own `/api` routes, so there is no API URL to configure and
> no CORS hop. Both files are kept only for history.

## The one thing you must set: `DATABASE_URL`

The API needs Postgres. Vercel's filesystem is ephemeral, so the old
SQLite file cannot be used in production — writes would vanish between
requests. Until `DATABASE_URL` is set, every endpoint returns:

```json
{ "error": "The database is not configured. Set DATABASE_URL in the environment." }
```

### Create the database

1. Open the [project's Storage tab](https://vercel.com/lalit-kumar-guptas-projects-7503c351/lms/stores).
2. **Create Database → Neon (Serverless Postgres) → Free plan.**
3. Connect it to the `lms` project for **Production, Preview and Development**.

Vercel injects `DATABASE_URL` (and `POSTGRES_URL`) automatically and redeploys.
The schema creates itself on the first request — no migration step needed for a
fresh database.

Any other Postgres works too. To use one, add the variable by hand:

```bash
vercel env add DATABASE_URL production
```

Use a **pooled** connection string in serverless environments (for Neon, the
host containing `-pooler`). Many short-lived function instances each opening
direct connections will exhaust the server's connection limit.

### Move the old SQLite data across

Only needed if you want the records from `backend/library.db`:

```bash
cd web
vercel env pull .env.local          # fetches DATABASE_URL
DATABASE_URL="…" node scripts/migrate-from-sqlite.mjs
```

Safe to re-run — existing rows are left untouched and id sequences are reset
afterwards.

## Environment variables

| Variable              | Where    | Purpose                                                        |
| --------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`        | Server   | **Required.** Postgres connection string.                       |
| `PGPOOL_MAX`          | Server   | Connections per instance. Default 3.                            |
| `NEXT_PUBLIC_API_URL` | Browser  | Only if you want the UI to call an API other than its own routes. |

## Verifying a deployment

```bash
curl https://lms-nu-sandy.vercel.app/api/health
# {"status":"OK","message":"Library Management System API is running"}
```

`/api/health` runs a real query, so `OK` means the database is reachable, not
just that the function booted.

## Deploying by hand

```bash
vercel deploy --prod        # from the repository root, not from web/
```

Run it from the root: the project's root directory is `web`, and Vercel applies
that to whatever is uploaded. Deploying from inside `web/` makes it look for
`web/web` and fail.

## A note on access

The project has Deployment Protection disabled, so the URL is public. The LMS
itself has no login — anyone with the link can read and change the records.
Add authentication before putting real student data in it.
