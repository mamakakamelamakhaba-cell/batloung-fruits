const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const JOIN = `
  SELECT p.id, p.fruit_id, p.box_size_id, p.selling_price, p.is_active,
         f.name AS fruit_name, b.name AS box_size,
         (SELECT COALESCE(SUM(sm.change_qty),0)
            FROM stock_movements sm WHERE sm.product_id = p.id) AS stock_quantity
  FROM products p
  JOIN fruits f    ON f.id = p.fruit_id
  JOIN box_sizes b ON b.id = p.box_size_id`;

// GET /api/products  (search by fruit, filter by box size)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search = '', box_size_id } = req.query;
    let sql = `${JOIN} WHERE f.name LIKE ?`;
    const params = [`%${search}%`];
    if (box_size_id) { sql += ' AND p.box_size_id = ?'; params.push(box_size_id); }
    sql += ' ORDER BY f.name, FIELD(b.name,"Small","Medium","Large")';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/products/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${JOIN} WHERE p.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// POST /api/products  (Administrator) - set price for a Fruit+Box combination
// Any opening stock_quantity is recorded as an 'initial' movement (not a column).
router.post('/', authenticate, authorize('Administrator'), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { fruit_id, box_size_id, selling_price, stock_quantity = 0, is_active = 1 } = req.body;
    if (!fruit_id || !box_size_id) return res.status(400).json({ message: 'Fruit and box size are required' });
    if (!(selling_price > 0)) return res.status(400).json({ message: 'Selling price must be greater than zero' });
    const opening = Number(stock_quantity) || 0;
    if (opening < 0) return res.status(400).json({ message: 'Opening stock cannot be negative' });

    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO products (fruit_id, box_size_id, selling_price, is_active) VALUES (?, ?, ?, ?)',
      [fruit_id, box_size_id, selling_price, is_active ? 1 : 0]
    );
    if (opening > 0) {
      await conn.query(
        `INSERT INTO stock_movements (product_id, change_qty, movement_type, note, created_by)
         VALUES (?, ?, 'initial', 'Opening balance', ?)`,
        [result.insertId, opening, req.user?.id || null]
      );
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That fruit + box size product already exists' });
    next(e);
  } finally {
    conn.release();
  }
});

// PUT /api/products/:id  (Administrator)
// selling_price / is_active update the product row. If a stock_quantity is
// supplied, the difference vs the current derived stock is written as an
// 'adjustment' movement so the ledger stays the single source of truth.
router.put('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { selling_price, stock_quantity, is_active } = req.body;
    if (selling_price != null && !(selling_price > 0)) {
      return res.status(400).json({ message: 'Selling price must be greater than zero' });
    }

    await conn.beginTransaction();
    const [result] = await conn.query(
      'UPDATE products SET selling_price = ?, is_active = ? WHERE id = ?',
      [selling_price, is_active ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) { await conn.rollback(); return res.status(404).json({ message: 'Product not found' }); }

    if (stock_quantity != null && stock_quantity !== '') {
      const target = Number(stock_quantity);
      if (!(target >= 0)) { await conn.rollback(); return res.status(400).json({ message: 'Invalid stock quantity' }); }
      const [[{ current }]] = await conn.query(
        'SELECT COALESCE(SUM(change_qty),0) AS current FROM stock_movements WHERE product_id = ?',
        [req.params.id]
      );
      const delta = target - Number(current);
      if (delta !== 0) {
        await conn.query(
          `INSERT INTO stock_movements (product_id, change_qty, movement_type, note, created_by)
           VALUES (?, ?, 'adjustment', 'Manual stock set via product edit', ?)`,
          [req.params.id, delta, req.user?.id || null]
        );
      }
    }
    await conn.commit();
    res.json({ message: 'Product updated' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// DELETE /api/products/:id  (Administrator)
router.delete('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
