// MySQL connection pool — supports BOTH a single DATABASE_URL (cloud hosts:
// Aiven, Railway, Clever Cloud, PlanetScale...) and the classic DB_* variables.
const mysql = require('mysql2/promise');
require('dotenv').config();

function buildConfig() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL || '';

  if (url.trim()) {
    // Some providers append '?ssl-mode=REQUIRED' which is a Java-ism and
    // breaks the mysql2 driver. Strip the query string and hard-enable SSL.
    const clean = url.trim().replace(/\?.*$/, '');
    const parsed = new URL(clean);

    const cfg = {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: (parsed.pathname || '/defaultdb').replace(/^\//, '') || 'defaultdb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      connectTimeout: 20000,
    };

    // Cloud MySQL virtually always requires TLS. Set DB_SSL=false to disable.
    if (process.env.DB_SSL !== 'false') {
      cfg.ssl = { rejectUnauthorized: false };
    }
    return cfg;
  }

  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'batloung_fruits',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    connectTimeout: 20000,
  };

  if (process.env.DB_SSL === 'true') {
    cfg.ssl = { rejectUnauthorized: false };
  }
  return cfg;
}

const config = buildConfig();
const pool = mysql.createPool(config);

// Expose a safe, password-free description for diagnostics.
pool.describe = () => ({
  mode: process.env.DATABASE_URL || process.env.MYSQL_URL ? 'DATABASE_URL' : 'DB_* variables',
  host: config.host,
  port: config.port,
  user: config.user,
  database: config.database,
  ssl: Boolean(config.ssl),
});

module.exports = pool;
module.exports.buildConfig = buildConfig;
