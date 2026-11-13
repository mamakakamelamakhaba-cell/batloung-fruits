// One-shot, idempotent database builder.
// Creates any missing tables inside the EXISTING hosted database, then seeds
// whatever data is missing. Safe to run twice: it never duplicates rows and
// never drops a table that already holds data.
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { statementsFor, FILES } = require('./sqlfiles');

const EXPECTED_TABLES = [
  'users', 'suppliers', 'fruits', 'box_sizes', 'products',
  'street_vendors', 'purchases', 'orders', 'order_items', 'stock_movements',
];

const SEED_ORDER = ['fruits', 'suppliers', 'box_sizes', 'street_vendors', 'products'];

async function tableCounts() {
  const counts = {};
  for (const t of EXPECTED_TABLES) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
      counts[t] = rows[0].n;
    } catch (e) {
      counts[t] = null; // table missing
    }
  }
  return counts;
}

async function missingTables() {
  const c = await tableCounts();
  return EXPECTED_TABLES.filter((t) => c[t] === null);
}

async function ensureTables(log) {
  const missing = await missingTables();
  if (missing.length === 0) {
    log('All 10 tables already exist — skipping schema.');
    return { created: 0 };
  }

  const stmts = statementsFor('schema.sql');
  let created = 0;
  for (const stmt of stmts) {
    // Only CREATE TABLE / CREATE INDEX statements matter here.
    if (!/^CREATE\s+(TABLE|INDEX|UNIQUE)/i.test(stmt)) continue;
    const tableMatch = stmt.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
    if (tableMatch && !missing.includes(tableMatch[1])) continue;

    // MySQL has no CREATE INDEX IF NOT EXISTS — swallow duplicates.
    try {
      await pool.query(stmt.replace(/^CREATE\s+TABLE\s+(?!IF)/i, 'CREATE TABLE IF NOT EXISTS '));
      if (tableMatch) { created += 1; log(`created table ${tableMatch[1]}`); }
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_TABLE_EXISTS_ERROR') continue;
      throw new Error(`schema step failed: ${e.message}\n>> ${stmt.slice(0, 120)}`);
    }
  }
  return { created };
}

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].n > 0;
}

async function ensureUsers(log) {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users');
  const existing = Number(rows[0] && rows[0].n) || 0;
  if (existing > 0) {
    // Accounts may exist from the seed file with a placeholder hash that can
    // never match. Rewrite the two demo logins with real bcrypt hashes.
    await repairDemoPasswords(log);
    return;
  }
  const adminHash = await bcrypt.hash('admin123', 10);
  const salesHash = await bcrypt.hash('sales123', 10);
  await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)',
    ['System Administrator', 'admin@batloung.co.ls', adminHash, 'Administrator']
  );
  await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)',
    ['Sales Clerk', 'sales@batloung.co.ls', salesHash, 'Sales']
  );
  log('created login accounts.');
}

async function repairDemoPasswords(log) {
  const demos = [
    ['admin@batloung.co.ls', 'admin123'],
    ['sales@batloung.co.ls', 'sales123'],
  ];
  let repaired = 0;
  for (const [email, password] of demos) {
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) continue;
    // bcrypt hashes are 60 chars and start with $2a$/$2b$. Placeholder text in
    // the seed file is not a valid hash, so bcrypt.compare would always throw.
    const looksValid = typeof user.password_hash === 'string'
      && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash);
    if (looksValid) continue;
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    repaired += 1;
  }
  if (repaired) log(`repaired ${repaired} demo password(s) that could not be used to log in.`);
  else log('users already populated with valid passwords.');
}

async function runSeedFile(file, log) {
  const stmts = statementsFor(file);
  let ran = 0;
  for (const stmt of stmts) {
    // Skip the placeholder-hash user inserts; ensureUsers() writes real bcrypt hashes.
    if (/^INSERT\s+INTO\s+users/i.test(stmt)) continue;
    try {
      await pool.query(stmt);
      ran += 1;
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') continue;
      throw new Error(`${file} failed: ${e.message}\n>> ${stmt.slice(0, 140)}`);
    }
  }
  log(`${file}: ${ran} statement(s) applied.`);
}

async function ensureData(log) {
  const counts = await tableCounts();

  // If the catalogue is already there, only fill genuinely empty tables.
  if (counts.fruits > 0 && counts.products > 0) {
    log('Catalogue already seeded — leaving data untouched.');
    await ensureUsers(log);
    return;
  }

  const emptyCatalogue = SEED_ORDER.some((t) => !counts[t] || counts[t] === 0);
  if (!emptyCatalogue) {
    log('Seed data already present.');
  } else {
    await runSeedFile('seed.sql', log);
    await runSeedFile('seed_extra.sql', log);
  }
  await ensureUsers(log);
}

// The seed files reference each other with SELECT ... WHERE name='X' subqueries.
// If orders/purchases exist but stock_movements is empty, rebuild the ledger so
// dashboards and reports have numbers to show.
async function ensureStockLedger(log) {
  const [[c]] = await pool.query('SELECT COUNT(*) AS n FROM stock_movements');
  if (c.n > 0) return;

  const [products] = await pool.query('SELECT id FROM products');
  if (products.length === 0) return;

  let inserted = 0;
  for (const p of products) {
    await pool.query(
      `INSERT INTO stock_movements (product_id, change_qty, movement_type, note)
       VALUES (?, ?, 'initial', 'Opening stock')`,
      [p.id, 60]
    );
    inserted += 1;
  }
  log(`opening stock ledger rebuilt for ${inserted} products.`);
}

async function setup({ log = () => {} } = {}) {
  const steps = [];
  const rec = (m) => { steps.push(m); log(m); };

  await pool.query('SELECT 1');
  const info = pool.describe();
  rec(`Connected to MySQL at ${info.host}:${info.port} → database "${info.database}"`);

  await ensureTables(rec);
  await ensureData(rec);
  await ensureStockLedger(rec);

  const counts = await tableCounts();
  return { steps, counts, database: info.database };
}

module.exports = { setup, tableCounts, missingTables, EXPECTED_TABLES, columnExists };
