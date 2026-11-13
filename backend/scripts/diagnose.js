#!/usr/bin/env node
/*
 * Stand-alone database diagnostic. Runs against whatever DATABASE_URL /
 * DB_* variables are in this folder's .env file.
 *
 *   cd backend
 *   npm run diagnose
 *
 * It answers, in order:
 *   1. Can we open a TCP connection to the host?
 *   2. Do the credentials work?
 *   3. Does the database in the URL exist, and is it the right one?
 *   4. Are the 10 tables there, and how many rows does each hold?
 */
require('dotenv').config();
const net = require('net');
const pool = require('../config/db');
const { EXPECTED_TABLES } = require('../lib/setupDb');

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const info = (m) => console.log(`    ${m}`);

function portOpen(host, port, timeout = 8000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (v) => { socket.destroy(); resolve(v); };
    socket.setTimeout(timeout);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', (e) => done(e.code));
  });
}

(async () => {
  console.log('\nBatloung Fruits — database diagnostic\n');
  const d = pool.describe();
  console.log(`Mode:     ${d.mode}`);
  console.log(`Host:     ${d.host}:${d.port}`);
  console.log(`User:     ${d.user}`);
  console.log(`Database: ${d.database}`);
  console.log(`SSL:      ${d.ssl}\n`);

  console.log('1) Network reachability');
  const reach = await portOpen(d.host, d.port);
  if (reach === true) ok(`port ${d.port} is open`);
  else {
    bad(`cannot reach ${d.host}:${d.port} (${reach})`);
    info('On a free Render service, outbound traffic is allowed — but Aiven');
    info('requires the connection to be encrypted and the service to be running.');
  }

  console.log('\n2) Login + database name');
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS db, VERSION() AS v');
    ok(`connected to MySQL ${rows.v}`);
    ok(`current database is \`${rows.db}\``);
    if (rows.db !== d.database) info(`note: expected \`${d.database}\``);
  } catch (e) {
    bad(`${e.code || ''} ${e.message}`);
    if (e.code === 'ER_ACCESS_DENIED_ERROR') info('Re-copy the password from your host; % characters must be URL-encoded as %25');
    if (e.code === 'ER_BAD_DB_ERROR') info(`The server has no database named \`${d.database}\`. Aiven's default is \`defaultdb\`.`);
    if (/HANDSHAKE|SSL|self.signed/i.test(e.message)) info('TLS problem — keep DB_SSL unset/true for cloud hosts.');
    process.exit(1);
  }

  console.log('\n3) Tables');
  let missing = 0;
  for (const t of EXPECTED_TABLES) {
    try {
      const [[r]] = await pool.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
      ok(`${t.padEnd(16)} ${String(r.n).padStart(5)} rows`);
    } catch (e) {
      missing += 1;
      bad(`${t.padEnd(16)} MISSING`);
    }
  }

  if (missing) {
    console.log(`\n${missing} table(s) missing. Fix with one request:\n`);
    info(`curl -X POST "https://YOUR-API.onrender.com/api/admin/setup?key=YOUR_SETUP_KEY"`);
  } else {
    console.log('\nEverything checks out. The API should serve data correctly.');
  }

  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
