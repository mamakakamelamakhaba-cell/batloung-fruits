const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/reports/dashboard  -> summary cards
router.get('/dashboard', authenticate, async (_req, res, next) => {
  try {
    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM fruits WHERE is_active=1)                       AS total_fruits,
        (SELECT COUNT(*) FROM suppliers)                                     AS total_suppliers,
        (SELECT COUNT(*) FROM street_vendors WHERE status='Active')          AS total_vendors,
        (SELECT COALESCE(SUM(sm.change_qty),0) FROM stock_movements sm)     AS available_stock,
        (SELECT COUNT(*) FROM orders)                                        AS total_orders,
        (SELECT COUNT(*) FROM orders WHERE status='Pending')                 AS pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status='Completed')               AS completed_orders,
        (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status='Completed') AS sales_value`);
    res.json(counts);
  } catch (e) { next(e); }
});

// Sales by fruit (completed orders) — optional ?box_size=Small|Medium|Large filter
router.get('/sales-by-fruit', authenticate, async (req, res, next) => {
  try {
    const { box_size } = req.query;
    const VALID_SIZES = ['Small', 'Medium', 'Large'];
    const useFilter = box_size && VALID_SIZES.includes(box_size);
    const params = useFilter ? [box_size] : [];
    const [rows] = await pool.query(`
      SELECT f.name AS fruit, SUM(oi.quantity) AS boxes_sold, SUM(oi.subtotal) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id AND o.status='Completed'
      JOIN products p ON p.id = oi.product_id
      JOIN fruits f ON f.id = p.fruit_id
      JOIN box_sizes b ON b.id = p.box_size_id
      ${useFilter ? 'WHERE b.name = ?' : ''}
      GROUP BY f.name ORDER BY revenue DESC`, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// Sales by box size (completed orders)
router.get('/sales-by-box', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.name AS box_size, SUM(oi.quantity) AS boxes_sold, SUM(oi.subtotal) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id AND o.status='Completed'
      JOIN products p ON p.id = oi.product_id
      JOIN box_sizes b ON b.id = p.box_size_id
      GROUP BY b.name ORDER BY FIELD(b.name,'Small','Medium','Large')`);
    res.json(rows);
  } catch (e) { next(e); }
});

// Sales by vendor (completed orders)
router.get('/sales-by-vendor', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.name AS vendor, v.business_name, COUNT(DISTINCT o.id) AS orders, SUM(o.total_amount) AS revenue
      FROM orders o JOIN street_vendors v ON v.id = o.vendor_id
      WHERE o.status='Completed'
      GROUP BY v.id ORDER BY revenue DESC`);
    res.json(rows);
  } catch (e) { next(e); }
});

// Purchases by South African province
router.get('/purchases-by-province', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.province, SUM(pu.quantity) AS boxes_purchased, SUM(pu.quantity*pu.unit_cost) AS cost
      FROM purchases pu JOIN suppliers s ON s.id = pu.supplier_id
      GROUP BY s.province ORDER BY cost DESC`);
    res.json(rows);
  } catch (e) { next(e); }
});

// Available stock report
router.get('/available-stock', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.name AS fruit, b.name AS box_size, p.selling_price,
             (SELECT COALESCE(SUM(sm.change_qty),0)
                FROM stock_movements sm WHERE sm.product_id = p.id) AS stock_quantity
      FROM products p JOIN fruits f ON f.id=p.fruit_id JOIN box_sizes b ON b.id=p.box_size_id
      ORDER BY f.name, FIELD(b.name,'Small','Medium','Large')`);
    res.json(rows);
  } catch (e) { next(e); }
});

// Total sales by date (completed)
router.get('/sales-by-date', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT order_date, SUM(total_amount) AS revenue, COUNT(*) AS orders
      FROM orders WHERE status='Completed'
      GROUP BY order_date ORDER BY order_date`);
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
