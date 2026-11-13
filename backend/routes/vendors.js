const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/vendors  (search + status filter)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search = '', status } = req.query;
    let sql = 'SELECT * FROM street_vendors WHERE (name LIKE ? OR business_name LIKE ? OR location LIKE ?)';
    const params = [`%${search}%`, `%${search}%`, `%${search}%`];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY name';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/vendors/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM street_vendors WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Vendor not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// POST /api/vendors  (Administrator + Sales can register)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, business_name, telephone, location, registration_date, status = 'Active' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Vendor name is required' });
    const [result] = await pool.query(
      'INSERT INTO street_vendors (name, business_name, telephone, location, registration_date, status) VALUES (?,?,?,?,?,?)',
      [name.trim(), business_name || null, telephone || null, location || null,
       registration_date || new Date().toISOString().slice(0,10), status]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) { next(e); }
});

// PUT /api/vendors/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, business_name, telephone, location, status } = req.body;
    const [result] = await pool.query(
      'UPDATE street_vendors SET name=?, business_name=?, telephone=?, location=?, status=? WHERE id=?',
      [name, business_name || null, telephone || null, location || null, status, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: 'Vendor updated' });
  } catch (e) { next(e); }
});

// DELETE /api/vendors/:id  (Administrator)
router.delete('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM street_vendors WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: 'Vendor deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
