const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const STATUSES = ['Pending','Confirmed','Processing','Ready for Collection/Delivery','Completed','Cancelled'];

// GET /api/orders  (filter by status / vendor)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, vendor_id } = req.query;
    let sql = `
      SELECT o.id, o.order_date, o.total_amount, o.status,
             v.name AS vendor_name, v.business_name
      FROM orders o JOIN street_vendors v ON v.id = o.vendor_id WHERE 1=1`;
    const params = [];
    if (status)    { sql += ' AND o.status = ?';    params.push(status); }
    if (vendor_id) { sql += ' AND o.vendor_id = ?'; params.push(vendor_id); }
    sql += ' ORDER BY o.order_date DESC, o.id DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/orders/:id  (with items)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [[order]] = await pool.query(`
      SELECT o.*, v.name AS vendor_name, v.business_name, v.location
      FROM orders o JOIN street_vendors v ON v.id = o.vendor_id WHERE o.id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const [items] = await pool.query(`
      SELECT oi.*, f.name AS fruit_name, b.name AS box_size
      FROM order_items oi
      JOIN products p  ON p.id = oi.product_id
      JOIN fruits f    ON f.id = p.fruit_id
      JOIN box_sizes b ON b.id = p.box_size_id
      WHERE oi.order_id = ?`, [req.params.id]);
    order.items = items;
    res.json(order);
  } catch (e) { next(e); }
});

// POST /api/orders  -> place a new order (Administrator or Sales)
// body: { vendor_id, order_date, items: [{ product_id, quantity }] }
router.post('/', authenticate, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { vendor_id, order_date, items } = req.body;

    // Business rule: order must belong to a registered vendor
    const [[vendor]] = await conn.query('SELECT id FROM street_vendors WHERE id = ?', [vendor_id]);
    if (!vendor) return res.status(400).json({ message: 'Order must belong to a registered street vendor' });

    // Business rule: must contain at least one item
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'An order must contain at least one order item' });
    }

    await conn.beginTransaction();

    let total = 0;
    const prepared = [];
    for (const it of items) {
      if (!(it.quantity > 0)) throw httpError(400, 'Quantity ordered must be greater than zero');
      const [[prod]] = await conn.query(
        `SELECT p.id, p.selling_price,
                (SELECT COALESCE(SUM(sm.change_qty),0)
                   FROM stock_movements sm WHERE sm.product_id = p.id) AS stock_quantity
         FROM products p WHERE p.id = ? FOR UPDATE`, [it.product_id]);
      if (!prod) throw httpError(400, `Product ${it.product_id} does not exist`);
      // Business rule: cannot order more boxes than are available in stock
      if (it.quantity > prod.stock_quantity) {
        throw httpError(400, `Insufficient stock for product ${it.product_id} (available: ${prod.stock_quantity})`);
      }
      const subtotal = Number(prod.selling_price) * it.quantity;
      total += subtotal;
      prepared.push({ product_id: prod.id, quantity: it.quantity, unit_price: prod.selling_price, subtotal });
    }

    const [ins] = await conn.query(
      'INSERT INTO orders (vendor_id, order_date, total_amount, status) VALUES (?,?,?,"Pending")',
      [vendor_id, order_date || new Date().toISOString().slice(0,10), total]
    );
    for (const p of prepared) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)',
        [ins.insertId, p.product_id, p.quantity, p.unit_price, p.subtotal]
      );
    }
    await conn.commit();
    res.status(201).json({ id: ins.insertId, total_amount: total });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// PUT /api/orders/:id/status  -> update order status, apply stock rules
router.put('/:id/status', authenticate, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid order status' });

    await conn.beginTransaction();
    const [[order]] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!order) { await conn.rollback(); return res.status(404).json({ message: 'Order not found' }); }

    const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);

    const wasCompleted = order.status === 'Completed';
    const willComplete = status === 'Completed';

    // When an order becomes Completed -> reduce stock (rule). Validate availability first.
    if (!wasCompleted && willComplete) {
      for (const it of items) {
        const [[prod]] = await conn.query(
          `SELECT (SELECT COALESCE(SUM(sm.change_qty),0)
                     FROM stock_movements sm WHERE sm.product_id = p.id) AS stock_quantity
           FROM products p WHERE p.id = ? FOR UPDATE`, [it.product_id]);
        if (it.quantity > prod.stock_quantity) {
          throw httpError(400, `Cannot complete: insufficient stock for product ${it.product_id} (available: ${prod.stock_quantity})`);
        }
      }
      for (const it of items) {
        await conn.query(
          `INSERT INTO stock_movements (product_id, change_qty, movement_type, reference_id, note, created_by)
           VALUES (?, ?, 'sale', ?, 'Sold on completed order', ?)`,
          [it.product_id, -it.quantity, order.id, req.user?.id || null]);
      }
    }
    // If reverting from Completed to something else -> restore stock (reverse the sale)
    if (wasCompleted && !willComplete) {
      for (const it of items) {
        await conn.query(
          `INSERT INTO stock_movements (product_id, change_qty, movement_type, reference_id, note, created_by)
           VALUES (?, ?, 'adjustment', ?, 'Reversal: order reverted from Completed', ?)`,
          [it.product_id, it.quantity, order.id, req.user?.id || null]);
      }
    }
    // Cancelled orders never reduce stock (handled implicitly - no deduction).

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    await conn.commit();
    res.json({ message: `Order status updated to ${status}` });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// DELETE /api/orders/:id  (Administrator)
router.delete('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (e) { next(e); }
});

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

module.exports = router;
