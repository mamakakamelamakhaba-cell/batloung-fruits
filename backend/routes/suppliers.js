const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo',
                   'Mpumalanga','Northern Cape','North West','Western Cape'];

// GET /api/suppliers  (search + filter by province)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search = '', province } = req.query;
    let sql = 'SELECT * FROM suppliers WHERE (name LIKE ? OR contact_person LIKE ?)';
    const params = [`%${search}%`, `%${search}%`];
    if (province) { sql += ' AND province = ?'; params.push(province); }
    sql += ' ORDER BY name';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/suppliers/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Supplier not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// POST /api/suppliers  (Administrator)
router.post('/', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const { name, province, contact_person, telephone, email, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Supplier name is required' });
    if (!PROVINCES.includes(province)) return res.status(400).json({ message: 'A valid South African province is required' });
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, province, contact_person, telephone, email, address) VALUES (?,?,?,?,?,?)',
      [name.trim(), province, contact_person || null, telephone || null, email || null, address || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) { next(e); }
});

// PUT /api/suppliers/:id  (Administrator)
router.put('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const { name, province, contact_person, telephone, email, address } = req.body;
    if (province && !PROVINCES.includes(province)) return res.status(400).json({ message: 'Invalid province' });
    const [result] = await pool.query(
      'UPDATE suppliers SET name=?, province=?, contact_person=?, telephone=?, email=?, address=? WHERE id=?',
      [name, province, contact_person || null, telephone || null, email || null, address || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier updated' });
  } catch (e) { next(e); }
});

// DELETE /api/suppliers/:id  (Administrator)
router.delete('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
