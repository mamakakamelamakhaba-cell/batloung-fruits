// Writes real bcrypt password hashes for the default users.
// Run after importing schema.sql + seed.sql:  npm run seed
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

(async () => {
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const salesHash = await bcrypt.hash('sales123', 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'Administrator')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['System Administrator', 'admin@batloung.co.ls', adminHash]
    );
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'Sales')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['Sales Clerk', 'sales@batloung.co.ls', salesHash]
    );

    console.log('Seeded users:');
    console.log('  admin@batloung.co.ls / admin123  (Administrator)');
    console.log('  sales@batloung.co.ls / sales123  (Sales)');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
