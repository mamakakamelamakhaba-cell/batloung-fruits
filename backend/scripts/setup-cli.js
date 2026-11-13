#!/usr/bin/env node
// Same work as POST /api/admin/setup, but from a terminal.
//   cd backend && npm run setup:db
require('dotenv').config();
const { setup } = require('../lib/setupDb');
const pool = require('../config/db');

(async () => {
  try {
    const r = await setup({ log: (m) => console.log(`  ${m}`) });
    console.log('\nTables:');
    for (const [t, n] of Object.entries(r.counts)) {
      console.log(`  ${t.padEnd(16)} ${n === null ? 'MISSING' : `${n} rows`}`);
    }
    console.log('\nLogin: admin@batloung.co.ls / admin123');
    console.log('       sales@batloung.co.ls / sales123\n');
  } catch (e) {
    console.error('\nSetup failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
