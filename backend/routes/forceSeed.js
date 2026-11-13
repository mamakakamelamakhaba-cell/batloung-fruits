const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

router.get('/:key', async (req, res) => {
  if (req.params.key !== process.env.SETUP_KEY) return res.status(403).send('Unauthorized');

  try {
    let seed1 = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
    let seed2 = fs.readFileSync(path.join(__dirname, '../../database/seed_extra.sql'), 'utf8');

    const cleanSql = (sql) => sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').split(';').map(s => s.trim()).filter(s => s.length > 0);
    const allStatements = [...cleanSql(seed1), ...cleanSql(seed2)];

    let successCount = 0;
    let skipCount = 0;

    for (let stmt of allStatements) {
      try {
        await pool.query(stmt);
        successCount++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') skipCount++;
        else throw err;
      }
    }
    res.send(`Success! Executed ${successCount} statements. Skipped ${skipCount} duplicates.`);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

module.exports = router;
