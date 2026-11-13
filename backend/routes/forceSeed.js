const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

router.get('/:key', async (req, res) => {
  if (req.params.key !== process.env.SETUP_KEY) return res.status(403).send('Unauthorized');

  try {
    // 1. Run the Seed Files
    let seed1 = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
    let seed2 = fs.readFileSync(path.join(__dirname, '../../database/seed_extra.sql'), 'utf8');

    const cleanSql = (sql) => sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').split(';').map(s => s.trim()).filter(s => s.length > 0);
    const allStatements = [...cleanSql(seed1), ...cleanSql(seed2)];

    for (let stmt of allStatements) {
      try { await pool.query(stmt); } catch (err) { /* ignore duplicates */ }
    }

    // 2. Delete ONLY the extra fruits (keep Apples, Bananas, Oranges, Mangoes, Grapes)
    const allowedFruits = ['Apples', 'Bananas', 'Oranges', 'Mangoes', 'Grapes'];
    
    // Get the IDs of the allowed fruits
    const [fruitRows] = await pool.query(`SELECT id FROM fruits WHERE name IN (?)`, [allowedFruits]);
    const allowedIds = fruitRows.map(r => r.id);

    // Delete products that don't belong to the allowed fruits
    await pool.query(`DELETE FROM products WHERE fruit_id NOT IN (?)`, [allowedIds]);
    
    // Delete order_items that point to deleted products
    await pool.query(`DELETE FROM order_items WHERE product_id NOT IN (SELECT id FROM products)`);
    
    // Delete stock movements that point to deleted products
    await pool.query(`DELETE FROM stock_movements WHERE product_id NOT IN (SELECT id FROM products)`);
    
    // Finally, delete the extra fruits
    await pool.query(`DELETE FROM fruits WHERE name NOT IN (?)`, [allowedFruits]);

    res.send('Success! Data re-seeded and database limited to exactly 5 fruits.');
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

module.exports = router;
