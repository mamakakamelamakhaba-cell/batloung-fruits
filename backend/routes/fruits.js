const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/fruits  (search + active filter)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search = '', active } = req.query;
    let sql = 'SELECT * FROM fruits WHERE name LIKE ?';
    const params = [`%${search}%`];
    if (active === 'true')  { sql += ' AND is_active = 1'; }
    if (active === 'false') { sql += ' AND is_active = 0'; }
    sql += ' ORDER BY name';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/fruits/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM fruits WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Fruit not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// POST /api/fruits  (Administrator)
router.post('/', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const { name, description, is_active = 1 } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Fruit name is required' });
    const [result] = await pool.query(
      'INSERT INTO fruits (name, description, is_active) VALUES (?, ?, ?)',
      [name.trim(), description || null, is_active ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, name, description, is_active });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A fruit with that name already exists' });
    next(e);
  }
});

// PUT /api/fruits/:id  (Administrator)
router.put('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const { name, description, is_active } = req.body;
    const [result] = await pool.query(
      'UPDATE fruits SET name = ?, description = ?, is_active = ? WHERE id = ?',
      [name, description || null, is_active ? 1 : 0, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Fruit not found' });
    res.json({ message: 'Fruit updated' });
  } catch (e) { next(e); }
});

// DELETE /api/fruits/:id  (Administrator)
router.delete('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM fruits WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Fruit not found' });
    res.json({ message: 'Fruit deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
