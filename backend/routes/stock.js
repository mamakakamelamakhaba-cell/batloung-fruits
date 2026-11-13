const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/stock  -> current available stock per product (derived from ledger)
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id AS product_id, f.name AS fruit_name, b.name AS box_size,
             p.selling_price, p.is_active,
             (SELECT COALESCE(SUM(sm.change_qty),0)
                FROM stock_movements sm WHERE sm.product_id = p.id) AS stock_quantity
      FROM products p
      JOIN fruits f    ON f.id = p.fruit_id
      JOIN box_sizes b ON b.id = p.box_size_id
      ORDER BY f.name, FIELD(b.name,'Small','Medium','Large')`);
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/stock  -> record incoming stock (a purchase)
// Records the purchase AND a 'purchase' IN movement in the ledger (which is
// what actually raises available stock).
router.post('/', authenticate, authorize('Administrator'), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { supplier_id, product_id, quantity, unit_cost = 0, purchase_date } = req.body;
    if (!supplier_id || !product_id) return res.status(400).json({ message: 'Supplier and product are required' });
    if (!(quantity > 0)) return res.status(400).json({ message: 'Quantity must be greater than zero' });

    await conn.beginTransaction();
    const [pur] = await conn.query(
      'INSERT INTO purchases (supplier_id, product_id, quantity, unit_cost, purchase_date) VALUES (?,?,?,?,?)',
      [supplier_id, product_id, quantity, unit_cost, purchase_date || new Date().toISOString().slice(0,10)]
    );
    await conn.query(
      `INSERT INTO stock_movements (product_id, change_qty, movement_type, reference_id, note, created_by)
       VALUES (?, ?, 'purchase', ?, 'Incoming stock purchase', ?)`,
      [product_id, quantity, pur.insertId, req.user?.id || null]
    );
    await conn.commit();
    res.status(201).json({ message: 'Stock recorded and updated' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// GET /api/stock/purchases  -> purchase history
router.get('/purchases', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT pu.id, pu.quantity, pu.unit_cost, pu.purchase_date,
             s.name AS supplier_name, s.province,
             f.name AS fruit_name, b.name AS box_size
      FROM purchases pu
      JOIN suppliers s ON s.id = pu.supplier_id
      JOIN products  p ON p.id = pu.product_id
      JOIN fruits    f ON f.id = p.fruit_id
      JOIN box_sizes b ON b.id = p.box_size_id
      ORDER BY pu.purchase_date DESC, pu.id DESC`);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/stock/movements  -> full stock movement ledger (newest first)
router.get('/movements', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT sm.id, sm.change_qty, sm.movement_type, sm.reference_id, sm.note,
             sm.created_at, u.full_name AS created_by_name,
             f.name AS fruit_name, b.name AS box_size
      FROM stock_movements sm
      JOIN products  p ON p.id = sm.product_id
      JOIN fruits    f ON f.id = p.fruit_id
      JOIN box_sizes b ON b.id = p.box_size_id
      LEFT JOIN users u ON u.id = sm.created_by
      ORDER BY sm.created_at DESC, sm.id DESC`);
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/stock/adjust  -> record a manual stock adjustment (Administrator)
// body: { product_id, change_qty (signed, non-zero), note }
router.post('/adjust', authenticate, authorize('Administrator'), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { product_id, change_qty, note } = req.body;
    const delta = Number(change_qty);
    if (!product_id) return res.status(400).json({ message: 'Product is required' });
    if (!delta) return res.status(400).json({ message: 'Adjustment quantity must be a non-zero number' });

    await conn.beginTransaction();
    const [[{ current }]] = await conn.query(
      'SELECT COALESCE(SUM(change_qty),0) AS current FROM stock_movements WHERE product_id = ?',
      [product_id]
    );
    if (Number(current) + delta < 0) {
      await conn.rollback();
      return res.status(400).json({ message: `Adjustment would make stock negative (available: ${current})` });
    }
    await conn.query(
      `INSERT INTO stock_movements (product_id, change_qty, movement_type, note, created_by)
       VALUES (?, ?, 'adjustment', ?, ?)`,
      [product_id, delta, note || 'Manual adjustment', req.user?.id || null]
    );
    await conn.commit();
    res.status(201).json({ message: 'Stock adjustment recorded' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// PUT /api/stock/:productId  -> set a product's stock to an absolute value.
// Implemented as an 'adjustment' movement equal to (target - current) so the
// ledger remains the single source of truth.
router.put('/:productId', authenticate, authorize('Administrator'), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { stock_quantity } = req.body;
    if (stock_quantity == null || stock_quantity < 0) return res.status(400).json({ message: 'Invalid stock quantity' });
    const target = Number(stock_quantity);

    await conn.beginTransaction();
    const [[prod]] = await conn.query('SELECT id FROM products WHERE id = ?', [req.params.productId]);
    if (!prod) { await conn.rollback(); return res.status(404).json({ message: 'Product not found' }); }
    const [[{ current }]] = await conn.query(
      'SELECT COALESCE(SUM(change_qty),0) AS current FROM stock_movements WHERE product_id = ?',
      [req.params.productId]
    );
    const delta = target - Number(current);
    if (delta !== 0) {
      await conn.query(
        `INSERT INTO stock_movements (product_id, change_qty, movement_type, note, created_by)
         VALUES (?, ?, 'adjustment', 'Stock set to absolute value', ?)`,
        [req.params.productId, delta, req.user?.id || null]
      );
    }
    await conn.commit();
    res.json({ message: 'Stock updated' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

module.exports = router;
