const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// GET /api/boxsizes  — list all three box sizes
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM box_sizes ORDER BY FIELD(name,"Small","Medium","Large")');
    res.json(rows);
  } catch (e) { next(e); }
});

// PUT /api/boxsizes/:id  — edit description only (name is fixed per assignment)
// Administrator only. The assignment specifies exactly Small / Medium / Large — names
// cannot be changed and no new sizes may be created or deleted.
router.put('/:id', authenticate, authorize('Administrator'), async (req, res, next) => {
  try {
    const { description } = req.body;
    if (description === undefined) return res.status(400).json({ message: 'description is required' });
    const [result] = await pool.query(
      'UPDATE box_sizes SET description = ? WHERE id = ?',
      [description, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Box size not found' });
    res.json({ message: 'Box size updated successfully' });
  } catch (e) { next(e); }
});

module.exports = router;
