// Batloung Fruits Distribution Management System - Express server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const { tableCounts } = require('./lib/setupDb');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

function isAllowed(origin) {
  if (!origin) return true;
  const clean = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(clean)) return true;
  if (allowedOrigins.includes('*')) return true;
  if (process.env.ALLOW_VERCEL_PREVIEWS !== 'false' && /\.vercel\.app$/.test(new URL(clean).hostname)) {
    return true;
  }
  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowed(origin)) return callback(null, true);
    console.warn(`[cors] blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));
app.set('trust proxy', 1);

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', async (_req, res) => {
  const info = pool.describe();
  const payload = {
    status: 'ok',
    service: 'Batloung Fruits API',
    env: process.env.NODE_ENV || 'development',
    database: {
      connected: false,
      ...info,
      ssl: info.ssl,
    },
    tables: {},
    hint: null,
  };

  try {
    await pool.query('SELECT 1');
    payload.database.connected = true;
    payload.tables = await tableCounts();
    const missing = Object.entries(payload.tables)
      .filter(([, n]) => n === null)
      .map(([t]) => t);
    if (missing.length) {
      payload.status = 'needs-setup';
      payload.hint = `Missing tables: ${missing.join(', ')}. POST to /api/admin/setup?key=SETUP_KEY`;
    }
  } catch (e) {
    payload.status = 'db-error';
    payload.database.connected = false;
    payload.database.error = e.code || e.message;
    if (e.code === 'ER_TOO_LONG_IDENT' || e.code === 'ER_PARSE_ERROR') {
      payload.hint = 'The database name in DATABASE_URL is malformed. Paste ONLY the Aiven Service URI once.';
    } else if (e.code === 'ER_BAD_DB_ERROR') {
      payload.hint = `Database "${info.database}" does not exist on this server — check DATABASE_URL.`;
    } else if (e.code === 'ER_ACCESS_DENIED_ERROR') {
      payload.hint = 'Wrong database username/password — re-copy DATABASE_URL from your host.';
    } else {
      payload.hint = 'Check that the host allows connections from your Render service and SSL is on.';
    }
  }

  res.status(payload.database.connected ? 200 : 503).json(payload);
});

app.post('/api/admin/setup', async (req, res, next) => {
  try {
    const expected = process.env.SETUP_KEY;
    const given = req.query.key || req.body?.key || req.get('x-setup-key');

    if (!expected) {
      return res.status(503).json({
        message: 'SETUP_KEY is not configured on this service. Add it in Render → Environment, then redeploy.',
      });
    }
    if (given !== expected) {
      return res.status(403).json({ message: 'Invalid setup key.' });
    }

    const lines = [];
    const result = await require('./lib/setupDb').setup({ log: (m) => lines.push(m) });

    res.json({
      message: 'Database setup complete.',
      database: result.database,
      log: result.steps,
      counts: result.counts,
      login: [
        { email: 'admin@batloung.co.ls', password: 'admin123', role: 'Administrator' },
        { email: 'sales@batloung.co.ls', password: 'sales123', role: 'Sales' },
      ],
    });
  } catch (e) {
    console.error('[setup] failed:', e.code || '', e.message);
    if (e.detail) console.error('[setup] statement:', e.detail.statement);
    return res.status(500).json({
      message: e.message || 'Setup failed.',
      code: e.code || null,
      detail: e.detail || null,
      steps: e.steps || [],
      hint: 'Copy this response and the Render log line — it names the exact statement that failed.',
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fruits', require('./routes/fruits'));
app.use('/api/boxsizes', require('./routes/boxsizes'));
app.use('/api/products', require('./routes/products'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));

// Custom Seeder & Cleanup Routes
app.use('/api/force-seed', require('./routes/forceSeed'));
app.use('/api/fix-fruits', require('./routes/forceSeed'));

app.get('/api/run-seed', (_req, res) => {
  res.status(410).json({ message: 'This endpoint was removed. Use POST /api/admin/setup?key=YOUR_SETUP_KEY instead.' });
});

app.use((_req, res) => res.status(404).json({ message: 'Endpoint not found' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.message === 'Not allowed by CORS') return res.status(403).json({ message: 'Origin not allowed by CORS' });
  if (err.code === 'ER_NO_SUCH_TABLE') return res.status(503).json({ message: 'Database tables are missing. Open /api/health for details.' });
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') return res.status(503).json({ message: `Cannot reach the database (${err.code}).` });
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

if (require.main === module) {
  app.listen(PORT, HOST, async () => {
    console.log(`Batloung Fruits API running on http://${HOST}:${PORT}`);
    const info = pool.describe();
    console.log(`DB target: ${info.user}@${info.host}:${info.port}/${info.database} (ssl=${info.ssl}, via ${info.mode})`);
    (info.warnings || []).forEach((w) => console.warn(`DB warning: ${w}`));
    try {
      await pool.query('SELECT 1');
      const t = await tableCounts();
      const missing = Object.entries(t).filter(([, n]) => n === null).map(([k]) => k);
      console.log(missing.length ? `WARNING: missing tables → ${missing.join(', ')}` : 'Database OK: all tables present.');
    } catch (e) {
      console.error(`WARNING: database not reachable (${e.code || e.message}).`);
    }
  });
}

module.exports = app;
