Batloung Fruits — deployment fix
=================================
Read DEPLOY-FIX.md first. It explains the root cause and the 5 deploy steps.

Changed/new files:
  backend/config/db.js            rewritten — DATABASE_URL support, SSL, URL-decoding
  backend/lib/sqlfiles.js         NEW — safe SQL splitter, strips DROP/CREATE DATABASE
  backend/lib/setupDb.js          NEW — idempotent table creation + seeding
  backend/server.js               rewritten — real /api/health, /api/admin/setup, CORS
  backend/scripts/setup-cli.js    NEW — npm run setup:db
  backend/scripts/diagnose.js     NEW — npm run diagnose
  backend/package.json            scripts + engines
  backend/.env.example            rewritten
  frontend/src/api/client.js      rewritten — VITE_API_URL normalisation + readable errors
  frontend/src/pages/Login.jsx    1 line — show readable network/db errors
  frontend/.env.example           rewritten
  frontend/vercel.json            NEW — SPA rewrites + asset caching
  render.yaml                     NEW — blueprint config
  DEPLOY-FIX.md                   NEW — the guide

Everything else (pages, routes, styles, database .sql files) is unchanged.
