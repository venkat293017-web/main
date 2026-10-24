const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/gifts - Public: get all active guaranteed gifts
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, category, tagline, description, image_url, market_value, options, is_active, stock, display_order, created_at
       FROM gifts
       WHERE is_active = true
       ORDER BY display_order ASC, id ASC`
    );
    res.json({ success: true, gifts: result.rows });
  } catch (err) {
    console.error('Fetch gifts error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch gifts' });
  }
});

// GET /api/gifts/admin/all - Admin/Manager: get all gifts including inactive with optional filters
router.get('/admin/all', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { category, is_active, search, timeframe, startDate, endDate } = req.query;
    const params = [];
    let query = `SELECT * FROM gifts WHERE 1=1`;

    if (category && category !== 'All' && category !== 'ALL') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (is_active !== undefined && is_active !== 'ALL') {
      params.push(is_active === 'true' || is_active === true);
      query += ` AND is_active = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(category) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
    }

    if (timeframe === 'week') {
      query += ` AND created_at >= NOW() - INTERVAL '7 days'`;
    } else if (timeframe === 'month') {
      query += ` AND created_at >= NOW() - INTERVAL '30 days'`;
    } else {
      if (startDate) {
        params.push(startDate);
        query += ` AND created_at >= $${params.length}::timestamptz`;
      }
      if (endDate) {
        params.push(endDate);
        query += ` AND created_at <= ($${params.length}::date + INTERVAL '1 day')::timestamptz`;
      }
    }

    query += ` ORDER BY display_order ASC, id ASC`;

    const result = await db.query(query, params);
    res.json({ success: true, gifts: result.rows });
  } catch (err) {
    console.error('Fetch all gifts admin error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch gifts' });
  }
});

// GET /api/gifts/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM gifts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Gift not found' });
    }
    res.json({ success: true, gift: result.rows[0] });
  } catch (err) {
    console.error('Fetch gift error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch gift' });
  }
});

// POST /api/gifts - Admin/Manager creates a new gift
router.post('/', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { name, category, tagline, description, image_url, market_value, options, stock, display_order, is_active } = req.body;

    if (!name || !category || !image_url) {
      return res.status(400).json({ success: false, error: 'Name, category, and image URL are required' });
    }

    const result = await db.query(
      `INSERT INTO gifts (name, category, tagline, description, image_url, market_value, options, stock, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        category,
        tagline || '',
        description || '',
        image_url,
        parseFloat(market_value) || 1499.00,
        typeof options === 'string' ? options : JSON.stringify(options || { sizes: ['Free Size'], colors: ['Standard'] }),
        stock || 500,
        display_order || 1,
        is_active !== undefined ? (is_active === true || is_active === 'true') : true
      ]
    );

    res.status(201).json({ success: true, gift: result.rows[0] });
  } catch (err) {
    console.error('Create gift error:', err);
    res.status(500).json({ success: false, error: 'Failed to create gift' });
  }
});

// PUT /api/gifts/:id - Admin/Manager update gift
router.put('/:id', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, tagline, description, image_url, market_value, options, is_active, stock, display_order } = req.body;

    let optionsVal = null;
    if (options !== undefined && options !== null) {
      optionsVal = typeof options === 'string' ? options : JSON.stringify(options);
    }

    const result = await db.query(
      `UPDATE gifts
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           tagline = COALESCE($3, tagline),
           description = COALESCE($4, description),
           image_url = COALESCE($5, image_url),
           market_value = COALESCE($6, market_value),
           options = COALESCE($7::jsonb, options),
           is_active = COALESCE($8, is_active),
           stock = COALESCE($9, stock),
           display_order = COALESCE($10, display_order)
       WHERE id = $11
       RETURNING *`,
      [
        name || null,
        category || null,
        tagline !== undefined ? tagline : null,
        description !== undefined ? description : null,
        image_url || null,
        market_value !== undefined ? parseFloat(market_value) : null,
        optionsVal,
        is_active !== undefined ? (is_active === true || is_active === 'true') : null,
        stock !== undefined ? parseInt(stock, 10) : null,
        display_order !== undefined ? parseInt(display_order, 10) : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Gift not found' });
    }

    res.json({ success: true, gift: result.rows[0] });
  } catch (err) {
    console.error('Update gift error:', err);
    res.status(500).json({ success: false, error: 'Failed to update gift' });
  }
});

// PUT /api/gifts/:id/status - Admin/Manager updates gift active/inactive status
router.put('/:id/status', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: 'is_active (boolean) is required' });
    }

    const result = await db.query(
      `UPDATE gifts SET is_active = $1 WHERE id = $2 RETURNING *`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Gift not found' });
    }

    res.json({
      success: true,
      message: `Guaranteed Gift "${result.rows[0].name}" status set to ${is_active ? 'ACTIVE' : 'INACTIVE'}`,
      gift: result.rows[0]
    });
  } catch (err) {
    console.error('Update gift status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update gift status' });
  }
});

// DELETE /api/gifts/:id - Soft delete
router.delete('/:id', authenticateToken, requireRoles('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE gifts SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true, message: 'Gift deactivated successfully' });
  } catch (err) {
    console.error('Delete gift error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete gift' });
  }
});

module.exports = router;
