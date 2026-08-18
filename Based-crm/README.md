# Based CRM

A simple, self-contained CRM with a dead-simple login, built with the stack you asked for:

- **Next.js 16.0.6** (App Router, React Server Components)
- **React 19.2.0**
- **TypeScript** + **Tailwind CSS v4**
- **PostgreSQL 16** (via Docker)
- Auth: plain `POST /api/auth/login` → signed httpOnly session cookie (JWT, HS256 via `jose`), passwords hashed with `bcryptjs`

## Features

- 🔐 Simple login API — one endpoint, email + password, 7-day session cookie
- 📊 Dashboard — contact/company/deal counts, pipeline value, pipeline-by-stage chart, top open deals, recent activity, top companies
- 👥 Contacts — full CRUD, search, status filter, company linking
- 🏢 Companies — full CRUD, search, contact counts
- 💼 Deals — full CRUD, search, stage filter, inline stage changes, pipeline value totals
- ✎ Activity feed (seeded) shown on the dashboard
- Fully seeded demo data: 1 user, 6 companies, 7 contacts, 8 deals, 5 activities

## Quick start

### 1. Start Postgres (Docker)

```bash
docker compose up -d
```

### 2. Install and init the database

```bash
npm install
node scripts/init-db.mjs     # creates schema + seed data (idempotent)
```

### 3. Run it

```bash
npm run dev
# open http://localhost:3000
```

### Demo login

| Field    | Value              |
| -------- | ------------------ |
| Email    | `admin@basedcrm.com` |
| Password | `based123`          |

## Configuration

Everything lives in `.env` / `.env.local`:

| Variable       | Default                                          |
| -------------- | ------------------------------------------------ |
| `DATABASE_URL` | `postgres://based:based@localhost:5432/basedcrm` |
| `AUTH_SECRET`  | dev fallback — **set a real secret in production** |

## The login API

`POST /api/auth/login` with JSON `{ "email": "...", "password": "..." }`:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@basedcrm.com","password":"based123"}'
```

- `200` → `{ "user": { id, name, email } }` + sets the `basedcrm_session` cookie
- `401` → `{ "error": "Invalid email or password" }`

Other auth routes: `POST /api/auth/logout`, `GET /api/auth/me`.

## API surface

| Method | Route                    | Description                |
| ------ | ------------------------ | -------------------------- |
| GET    | `/api/contacts`          | list contacts              |
| POST   | `/api/contacts`          | create contact             |
| GET    | `/api/contacts/:id`      | get one contact            |
| PATCH  | `/api/contacts/:id`      | update contact             |
| DELETE | `/api/contacts/:id`      | delete contact             |
| GET    | `/api/companies`         | list companies (+ counts)  |
| POST   | `/api/companies`         | create company             |
| PATCH  | `/api/companies/:id`     | update company             |
| DELETE | `/api/companies/:id`     | delete company             |
| GET    | `/api/deals`             | list deals                 |
| POST   | `/api/deals`             | create deal                |
| PATCH  | `/api/deals/:id`         | update deal (incl. stage)  |
| DELETE | `/api/deals/:id`         | delete deal                |
| GET    | `/api/activities`        | recent activity feed       |
| POST   | `/api/activities`        | log an activity            |

All routes except login/logout require the session cookie.

## Layout

```
src/
  app/              Next.js App Router (pages + API routes)
  components/       UI components (sidebar, tables, forms, ui kit)
  lib/              db pool, auth (session cookie), types, api helpers
scripts/
  init-db.mjs       schema + seed (idempotent)
docker-compose.yml  Postgres 16
```

## Production notes

- `npm run build && npm start`
- Set a strong `AUTH_SECRET` and a real `DATABASE_URL`.
- Passwords are bcrypt-hashed; sessions are signed JWTs in httpOnly cookies.
