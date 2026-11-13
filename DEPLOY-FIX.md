# 🍊 Batloung Fruits — Deployment Fix (Vercel + Render + Aiven MySQL)

## The actual bug

Your live site was failing with:

```
Table 'defaultdb.users' doesn't exist
```

Three separate problems stacked on top of each other, and each one hid the next:

| # | Problem | Effect |
|---|---------|--------|
| 1 | The backend connected to the database named **`defaultdb`** instead of `batloung_fruits` | Every query hit an empty database |
| 2 | **No tables or data were ever created on the cloud DB** — `schema.sql` / `seed.sql` were only ever run on your laptop | Login, orders, reports all failed |
| 3 | `/api/run-seed` could never fix it: it shells out to `seed.js`, which only writes passwords and assumes tables already exist. Its `VALUES(password_hash)` syntax also fails on MySQL 8 strict mode | Your repair attempt silently did nothing |
| 4 | `/api/health` returned `"ok"` even while every real query failed | The problem was invisible |

**Important:** on Aiven, `defaultdb` **is** the database you get. Using it is fine — it just has to actually contain the tables. This build creates everything inside whatever database your `DATABASE_URL` points to, so the name no longer matters.

---

## What changed in the code

### `backend/config/db.js`
- Reads a single **`DATABASE_URL`** (what Aiven gives you) *or* the old `DB_*` variables.
- **Strips `?ssl-mode=REQUIRED`** — that suffix is a Java/Postgres convention and makes the `mysql2` driver fail.
- URL-decodes the password, so `@`, `#`, `%` in an Aiven password no longer break the connection.
- Turns **SSL on automatically** for `DATABASE_URL` (Aiven rejects unencrypted connections).
- Exposes a password-free `describe()` used by diagnostics.

### `backend/lib/sqlfiles.js` *(new)*
- A real SQL tokenizer (not a regex) that splits your `.sql` files correctly — semicolons inside strings, comments and `BEGIN…END` triggers can't break it.
- **Silently skips `DROP DATABASE` / `CREATE DATABASE` / `USE`.** Your `schema.sql` began with `DROP DATABASE IF EXISTS batloung_fruits` — on a hosted server that either errors out or destroys data. Now it's never executed.

### `backend/lib/setupDb.js` *(new)*
- Creates all 10 tables **inside the existing database**, so no `CREATE DATABASE` rights are needed.
- Seeds `seed.sql` → `seed_extra.sql` (12 fruits, 12 suppliers, 16 vendors, 36 products, 42 orders, purchases, stock ledger).
- **Idempotent** — running it twice inserts nothing the second time and never wipes data.
- Writes **real bcrypt hashes** for the demo logins, and **repairs** placeholder hashes left by the old seed file (those could never authenticate).
- Rebuilds opening stock if the ledger is empty, so dashboards and reports show numbers.

### `backend/server.js`
- **`GET /api/health`** now really tests the DB and lists which tables are missing, instead of always answering `ok`.
- **`POST /api/admin/setup?key=…`** replaces the broken `/api/run-seed`. Protected by `SETUP_KEY`. Returns a step-by-step log plus the table row counts.
- **CORS** allows your exact Vercel domain, any `*.vercel.app` preview, and requests with no origin. Blocked origins are logged.
- Friendly 503 messages for "tables missing", "DB unreachable", "bad credentials".

### `frontend/src/api/client.js`
- `VITE_API_URL` is normalised: a bare `https://host.onrender.com` automatically becomes `…/api`, trailing slashes are removed, and `http://` is upgraded to `https://` on an HTTPS page.
- Network/CORS/503 failures now surface a readable message on the login screen instead of a generic "Invalid credentials".

### New helper scripts
- `npm run diagnose` — prints host, port, SSL, login result, and a row count for each of the 10 tables with ✓/✗.
- `npm run setup:db` — the same database build, from a terminal.

---

## Deploy it — step by step

### Step 1 · Push this code to GitHub

Replace the contents of your repo's `backend/` and `frontend/` folders with the ones here, then commit and push. Render and Vercel redeploy automatically.

### Step 2 · Backend on Render

**Environment variables** (Render → your service → *Environment*):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | The full URI from your MySQL host, e.g. `mysql://avnadmin:PASSWORD@mysql-xxxx.aivencloud.com:12345/defaultdb` |
| `JWT_SECRET` | any long random string |
| `CLIENT_ORIGIN` | `https://batloung-fruits-frontend.vercel.app` |
| `SETUP_KEY` | a long random string you invent (e.g. `bf-setup-9f3k2m`) |

> **Where to find `DATABASE_URL`:** Aiven Console → your MySQL service → *Overview* → **Service URI**. It looks like `mysql://avnadmin:PASSWORD@host:port/defaultdb`. Copy it whole. If the password contains `%`, leave it as-is — the code decodes it correctly.

> **Nothing extra needed:** do **not** set `DB_HOST`/`DB_USER`/`DB_PASSWORD` separately, and do **not** force SSL — both are handled automatically.

Settings: **Root Directory** `backend`, **Build Command** `npm install`, **Start Command** `npm start`, **Health Check Path** `/api/health`. (The included `render.yaml` sets these if you deploy as a Blueprint.)

### Step 3 · Build the database — once

First confirm the connection is healthy. Open in a browser:

```
https://YOUR-SERVICE.onrender.com/api/health
```

You should see `"database": {"connected": true …}` with a database name. If it says `db-error`, the message tells you exactly which field is wrong.

Then run the setup **once** (POST, so it can't be triggered by a stray page visit):

```bash
curl -X POST "https://YOUR-SERVICE.onrender.com/api/admin/setup?key=YOUR_SETUP_KEY"
```

You'll get back a log and a row count for every table:

```json
{
  "message": "Database setup complete.",
  "log": ["Connected to MySQL …", "created table users", …, "created login accounts."],
  "counts": { "users": 2, "fruits": 12, "suppliers": 12, "products": 36, "orders": 42, … }
}
```

Re-run it any time — it will report that everything already exists and insert nothing.

### Step 4 · Frontend on Vercel

**Settings → Environment Variables** (add for Production *and* Preview):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com/api` |

> Vite bakes this in at **build time** — after changing it you must **Redeploy** (Deployments → ⋯ → Redeploy). Editing the variable alone changes nothing.

`frontend/vercel.json` is included: it fixes client-side routing so refreshing `/orders` doesn't give a 404, and caches hashed assets.

### Step 5 · Log in

| Email | Password | Role |
|-------|----------|------|
| `admin@batloung.co.ls` | `admin123` | Administrator |
| `sales@batloung.co.ls` | `sales123` | Sales |

Change these before showing the system to anyone real.

---

## Troubleshooting table

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Table 'defaultdb.users' doesn't exist` | Tables never created on the cloud DB | Run Step 3 |
| `ER_ACCESS_DENIED_ERROR` | Wrong password, or `#`/`@` mishandled | Re-copy `DATABASE_URL` from Aiven |
| `ER_BAD_DB_ERROR` | Database name in the URL doesn't exist | Aiven's default is `defaultdb` — use it |
| Hangs ~30 s then fails | Free Render service asleep | Reload; first request wakes it |
| Browser console: CORS error | `CLIENT_ORIGIN` doesn't match exactly | Set it to `https://batloung-fruits-frontend.vercel.app` (no trailing slash) |
| Login says "Cannot reach the server" | `VITE_API_URL` missing/typo'd | Fix it on Vercel, then **Redeploy** |
| Login says "database is not ready" (503) | Backend up, tables missing | Run Step 3 |
| 404 after refreshing a page | No SPA rewrite | Keep the included `vercel.json` |
| Data loads but charts are empty | Ledger empty | Setup rebuilds opening stock |
| `Cannot find module` on Render | Root Directory not set to `backend` | Set it in service settings |

---

## Security notes

- Never commit `.env` — only `.env.example` (both included).
- `SETUP_KEY` is the only thing protecting the setup endpoint. Use a long random value and rotate it once setup is done.
- The demo passwords in this seed are for marking/demo use — change them for real data.
- `JWT_SECRET` must be long and random on Render; `generateValue: true` in `render.yaml` does this for you.

---

## Local development is unchanged

```bash
# terminal 1
cd backend && npm install && npm start      # :5000

# terminal 2
cd frontend && npm install && npm run dev   # :5173, /api proxied to :5000
```

With no `VITE_API_URL` set, the frontend uses the Vite proxy, so your local MySQL setup keeps working exactly as before.
