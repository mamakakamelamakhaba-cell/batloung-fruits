const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

router.get('/:key', async (req, res) => {
  if (req.params.key !== process.env.SETUP_KEY) return res.status(403).send('Unauthorized');

  try {
    // 1. Run the Seed Files (with comments stripped out)
    let seed1 = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
    let seed2 = fs.readFileSync(path.join(__dirname, '../../database/seed_extra.sql'), 'utf8');

    const cleanSql = (sql) => sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').split(';').map(s => s.trim()).filter(s => s.length > 0);
    const allStatements = [...cleanSql(seed1), ...cleanSql(seed2)];

    let successCount = 0;
    for (let stmt of allStatements) {
      try {
        await pool.query(stmt);
        successCount++;
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') console.log("Skipped:", err.message); 
      }
    }

    // 2. Clean up the extra fruits (Keep only the 5 required)
    const allowedFruits = ['Apples', 'Bananas', 'Oranges', 'Mangoes', 'Grapes'];
    
    await pool.query(`DELETE p FROM products p JOIN fruits f ON p.fruit_id = f.id WHERE f.name NOT IN (?)`, [allowedFruits]);
    await pool.query(`DELETE FROM order_items WHERE product_id NOT IN (SELECT id FROM products)`);
    await pool.query(`DELETE FROM stock_movements WHERE product_id NOT IN (SELECT id FROM products)`);
    await pool.query(`DELETE FROM fruits WHERE name NOT IN (?)`, [allowedFruits]);

    res.send(`Success! Seeded ${successCount} records. Database cleaned to only 5 fruits.`);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

module.exports = router;
