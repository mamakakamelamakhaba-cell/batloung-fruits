// One-shot, idempotent database builder.
// Creates any missing tables inside the EXISTING hosted database, then seeds
// whatever data is missing. Safe to run twice: it never duplicates rows and
// never drops a table that already holds data.
//
// Every step is wrapped so a failure reports WHICH statement broke and WHY,
// instead of surfacing as a bare "Internal server error".
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { statementsFor } = require('./sqlfiles');

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

// Turn a raw statement into something short enough to include in an error.
function brief(stmt, max = 220) {
  const one = stmt.replace(/\s+/g, ' ').trim();
  return one.length > max ? `${one.slice(0, max)}…` : one;
}

function explain(e) {
  const map = {
    ER_TABLE_EXISTS_ERROR: 'table already exists (safe to ignore)',
    ER_DUP_ENTRY: 'duplicate row (already seeded)',
    ER_DUP_KEYNAME: 'index already exists (safe to ignore)',
    ER_NO_SUCH_TABLE: 'referenced table does not exist yet — creation order issue',
    ER_BAD_FIELD_ERROR: 'column not found — schema and seed files disagree',
    ER_PARSE_ERROR: 'SQL syntax error',
    ER_TRUNCATED_WRONG_VALUE: 'bad value for a column (date/number format)',
    ER_DATA_TOO_LONG: 'string longer than the column allows',
    ER_NO_REFERENCED_ROW_2: 'foreign key violation — referenced id does not exist',
    ER_ROW_IS_REFERENCED_2: 'row is referenced by another table',
    ER_LOCK_WAIT_TIMEOUT: 'deadlock/timeout — retry',
  };
  return map[e.code] || 'unexpected database error';
}

async function ensureTables(log) {
  const missing = await missingTables();
  if (missing.length === 0) {
    log('All 10 tables already exist — skipping schema.');
    return { created: 0 };
  }

  // CREATE TABLE in dependency order. Foreign keys mean users/fruits/etc must
  // come before products/orders/order_items/stock_movements.
  const stmts = statementsFor('schema.sql');
  const created = [];

  for (const stmt of stmts) {
    const isTable = /^CREATE\s+TABLE/i.test(stmt);
    const isIndex = /^CREATE\s+(UNIQUE\s+)?INDEX/i.test(stmt);
    if (!isTable && !isIndex) continue;

    const tableName = isTable
      ? (stmt.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i) || [])[1]
      : null;

    if (tableName && !missing.includes(tableName)) continue;

    const sql = stmt.replace(/^CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i, 'CREATE TABLE IF NOT EXISTS ');

    try {
      await pool.query(sql);
      if (tableName) { created.push(tableName); log(`created table ${tableName}`); }
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_TABLE_EXISTS_ERROR') continue;
      const err = new Error(
        `Failed creating ${tableName || 'index'}: ${e.code || ''} ${e.message} (${explain(e)})`
      );
      err.detail = { step: 'schema', statement: brief(stmt), code: e.code };
      throw err;
    }
  }

  return { created: created.length };
}

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows[0].n > 0;
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

async function ensureUsers(log) {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users');
  const existing = Number(rows[0] && rows[0].n) || 0;
  if (existing > 0) {
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

async function runSeedFile(file, log) {
  const stmts = statementsFor(file);
  let ran = 0;
  let skipped = 0;

  for (let i = 0; i < stmts.length; i += 1) {
    const stmt = stmts[i];

    // The placeholder-hash user inserts are replaced by ensureUsers().
    if (/^INSERT\s+INTO\s+users/i.test(stmt)) continue;

    try {
      await pool.query(stmt);
      ran += 1;
    } catch (e) {
      // Benign, expected collisions when re-running over existing data.
      if (e.code === 'ER_DUP_ENTRY' || e.code === 'ER_DUP_KEYNAME') { skipped += 1; continue; }

      const err = new Error(
        `${file} statement ${i + 1}/${stmts.length} failed: ${e.code || ''} ${e.message} (${explain(e)})`
      );
      err.code = e.code || 'SEED_FAILED';
      err.detail = {
        step: file,
        statementIndex: i + 1,
        statement: brief(stmt),
        code: e.code,
        sqlMessage: e.sqlMessage,
        sqlState: e.sqlState,
      };
      throw err;
    }
  }

  log(`${file}: ${ran} statement(s) applied${skipped ? `, ${skipped} already present` : ''}.`);
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

// If orders/purchases exist but the ledger is empty, rebuild opening stock so
// dashboards and reports have numbers to show.
async function ensureStockLedger(log) {
  const [[c]] = await pool.query('SELECT COUNT(*) AS n FROM stock_movements');
  if (Number(c.n) > 0) return;

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

  try {
    await ensureTables(rec);
  } catch (e) {
    e.steps = steps;
    throw e;
  }

  try {
    await ensureData(rec);
    await ensureStockLedger(rec);
  } catch (e) {
    e.steps = steps;
    throw e;
  }

  const counts = await tableCounts();
  return { steps, counts, database: info.database };
}

module.exports = { setup, tableCounts, missingTables, EXPECTED_TABLES, columnExists };
