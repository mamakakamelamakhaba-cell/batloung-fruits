const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

router.get('/:key', async (req, res) => {
  if (req.params.key !== process.env.SETUP_KEY) return res.status(403).send('Unauthorized');

  try {
    const allowedFruits = ['Apples', 'Bananas', 'Oranges', 'Mangoes', 'Grapes'];
    
    // 1. NUKE the old data that got corrupted or deleted
    await pool.query(`DELETE FROM order_items`);
    await pool.query(`DELETE FROM orders`);
    await pool.query(`DELETE FROM purchases`);
    await pool.query(`DELETE FROM stock_movements WHERE movement_type = 'purchase'`);
    await pool.query(`DELETE FROM street_vendors`);
    await pool.query(`DELETE FROM suppliers`);

    // 2. Read the seed files
    let seed1 = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
    
    // 3. Remove comments and USE statements
    const cleanSql = (sql) => sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/USE [^;]+;/gi, '').split(';').map(s => s.trim()).filter(s => s.length > 0);
    const allStatements = cleanSql(seed1);

    let successCount = 0;
    for (let stmt of allStatements) {
      try {
        await pool.query(stmt);
        successCount++;
      } catch (err) {
        // Ignore duplicate errors for users/products/fruits
        if (err.code !== 'ER_DUP_ENTRY') {
          console.log("Skipped:", err.message.substring(0, 50));
        }
      }
    }

    res.send(`Success! Factory reset complete. Re-inserted ${successCount} records.`);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

module.exports = router;
