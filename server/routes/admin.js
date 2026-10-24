const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/admin/overview - Dashboard stats
router.get('/overview', authenticateToken, requireRoles('Super Admin', 'Admin', 'Manager', 'Accountant', 'Support'), async (req, res) => {
  try {
    const statsRes = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM tournaments WHERE status = 'ACTIVE') AS active_tournaments,
        (SELECT COUNT(*) FROM tournament_entries) AS total_entries,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COUNT(*) FROM orders WHERE fulfillment_status = 'DELIVERED') AS delivered_orders,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM orders WHERE payment_status = 'VERIFIED') AS total_revenue
    `);

    const recentOrders = await db.query(`
      SELECT o.order_number, o.shipping_name, o.gift_name, o.amount_paid, o.fulfillment_status, o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    const activeChallenges = await db.query(`
      SELECT id, title, category, entry_fee, slots_filled, total_slots, status, end_time
      FROM tournaments
      WHERE status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: statsRes.rows[0],
      recentOrders: recentOrders.rows,
      activeChallenges: activeChallenges.rows
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch admin overview' });
  }
});

// GET /api/admin/users - User directory with role filtering
router.get('/users', authenticateToken, requireRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { role, search, status } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.phone, u.city, u.created_at,
             COALESCE(u.is_blocked, false) AS is_blocked, u.blocked_at, u.blocked_reason,
             (SELECT COUNT(*) FROM tournament_entries te WHERE te.user_id = u.id) AS entries_count,
             (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'All' && role !== 'ALL') {
      params.push(role);
      query += ` AND u.role = $${params.length}`;
    }

    if (status === 'BLOCKED') {
      query += ` AND u.is_blocked = true`;
    } else if (status === 'ACTIVE') {
      query += ` AND (u.is_blocked IS NULL OR u.is_blocked = false)`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(u.city, '')) LIKE $${params.length} OR LOWER(COALESCE(u.phone, '')) LIKE $${params.length})`;
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await db.query(query, params);
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role - Update user role (Only Super Admin can change roles)
router.put('/users/:id/role', authenticateToken, requireRoles('Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Support', 'Users'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const result = await db.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

// PUT /api/admin/users/:id/block - Block or unblock a single user (Super Admin & Admin)
router.put('/users/:id/block', authenticateToken, requireRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_blocked, reason } = req.body;
    const targetUserId = parseInt(id, 10);

    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Security Warning: You cannot block your own administrator account!'
      });
    }

    // Check if target user exists and what their role is
    const targetUserCheck = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [targetUserId]);
    if (targetUserCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    const targetUser = targetUserCheck.rows[0];
    if (targetUser.role === 'Super Admin' && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        error: 'Only a Super Admin can block another Super Admin account.'
      });
    }

    const blockedFlag = Boolean(is_blocked);
    const blockedReason = blockedFlag ? (reason || 'Account suspended by administrator for violation of platform policy') : null;

    const result = await db.query(
      `UPDATE users
       SET is_blocked = $1,
           blocked_at = (CASE WHEN $1 = true THEN NOW() ELSE NULL END),
           blocked_reason = (CASE WHEN $1 = true THEN $2 ELSE NULL END)
       WHERE id = $3
       RETURNING id, name, email, role, is_blocked, blocked_at, blocked_reason`,
      [blockedFlag, blockedReason, targetUserId]
    );

    res.json({
      success: true,
      message: blockedFlag 
        ? `User "${targetUser.name}" has been blocked and suspended.`
        : `User "${targetUser.name}" has been unblocked and reactivated.`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Block user error:', err);
    res.status(500).json({ success: false, error: 'Failed to update user block status' });
  }
});

// POST /api/admin/users/bulk-block - Multi-select bulk block or unblock users
router.post('/users/bulk-block', authenticateToken, requireRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const { user_ids, is_blocked, reason } = req.body;
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide at least one user ID to update' });
    }

    // Exclude current user from being blocked
    const targetIds = user_ids.map(Number).filter(id => !isNaN(id) && id !== req.user.id);

    if (targetIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot perform bulk action on only your own account' });
    }

    const blockedFlag = Boolean(is_blocked);
    const blockedReason = blockedFlag ? (reason || 'Bulk account suspension by administrator') : null;

    const result = await db.query(
      `UPDATE users
       SET is_blocked = $1,
           blocked_at = (CASE WHEN $1 = true THEN NOW() ELSE NULL END),
           blocked_reason = (CASE WHEN $1 = true THEN $2 ELSE NULL END)
       WHERE id = ANY($3::int[])
       RETURNING id, name, email, role, is_blocked`,
      [blockedFlag, blockedReason, targetIds]
    );

    res.json({
      success: true,
      message: blockedFlag
        ? `Successfully blocked ${result.rowCount} user account(s).`
        : `Successfully unblocked ${result.rowCount} user account(s).`,
      count: result.rowCount,
      updated_users: result.rows
    });
  } catch (err) {
    console.error('Bulk block users error:', err);
    res.status(500).json({ success: false, error: 'Failed to perform bulk block/unblock action' });
  }
});


// PUT /api/admin/game-settings - Update dynamic snake game settings (Admin & Super Admin)
router.put('/game-settings', authenticateToken, requireRoles('Super Admin', 'Admin', 'Manager'), async (req, res) => {
  try {
    const {
      base_speed,
      min_speed,
      acceleration_step,
      golden_apple_chance,
      golden_apple_points,
      normal_apple_points,
      golden_apple_duration_sec,
      board_size
    } = req.body;

    const result = await db.query(
      `UPDATE game_settings
       SET base_speed = COALESCE($1, base_speed),
           min_speed = COALESCE($2, min_speed),
           acceleration_step = COALESCE($3, acceleration_step),
           golden_apple_chance = COALESCE($4, golden_apple_chance),
           golden_apple_points = COALESCE($5, golden_apple_points),
           normal_apple_points = COALESCE($6, normal_apple_points),
           golden_apple_duration_sec = COALESCE($7, golden_apple_duration_sec),
           board_size = COALESCE($8, board_size),
           updated_at = NOW()
       WHERE setting_key = 'default'
       RETURNING *`,
      [
        base_speed,
        min_speed,
        acceleration_step,
        golden_apple_chance,
        golden_apple_points,
        normal_apple_points,
        golden_apple_duration_sec,
        board_size
      ]
    );

    res.json({
      success: true,
      message: 'Snake II Arcade gameplay parameters dynamically updated in database!',
      settings: result.rows[0]
    });
  } catch (err) {
    console.error('Update game settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to update game settings' });
  }
});

// GET /api/admin/financials - Financial & revenue analytics (Accountant, Admin, Super Admin)
router.get('/financials', authenticateToken, requireRoles('Super Admin', 'Admin', 'Accountant'), async (req, res) => {
  try {
    const revenueSummary = await db.query(`
      SELECT
        COUNT(*) AS total_paid_entries,
        COALESCE(SUM(amount_paid), 0) AS gross_entry_collections,
        COALESCE(SUM(g.market_value), 0) AS estimated_gift_mrp_value
      FROM orders o
      LEFT JOIN gifts g ON o.gift_id = g.id
      WHERE o.payment_status = 'VERIFIED'
    `);

    const perTournament = await db.query(`
      SELECT 
        t.id, t.title, t.entry_fee, t.slots_filled, t.total_slots,
        COALESCE(SUM(o.amount_paid), 0) AS total_collected
      FROM tournaments t
      LEFT JOIN orders o ON t.id = o.tournament_id AND o.payment_status = 'VERIFIED'
      GROUP BY t.id, t.title, t.entry_fee, t.slots_filled, t.total_slots
      ORDER BY total_collected DESC
    `);

    const perGift = await db.query(`
      SELECT 
        g.category, g.name, COUNT(o.id) AS orders_count,
        COALESCE(SUM(o.amount_paid), 0) AS revenue_generated
      FROM gifts g
      LEFT JOIN orders o ON g.id = o.gift_id AND o.payment_status = 'VERIFIED'
      GROUP BY g.category, g.name
      ORDER BY orders_count DESC
    `);

    const recentTxns = await db.query(`
      SELECT o.id, o.order_number, o.shipping_name, o.payment_method, o.payment_txn_id,
             o.amount_paid, o.payment_status, o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      summary: revenueSummary.rows[0],
      perTournament: perTournament.rows,
      perGift: perGift.rows,
      recentTransactions: recentTxns.rows
    });
  } catch (err) {
    console.error('Financials error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch financial reports' });
  }
});

// GET /api/admin/competitions-participants - Get all competitions with participant counts & joined user details
router.get('/competitions-participants', authenticateToken, requireRoles('Super Admin', 'Admin', 'Manager', 'Support', 'Accountant'), async (req, res) => {
  try {
    const { tournament_id, search, sort } = req.query;

    // 0. Auto-sync and ensure every tournament entry has a valid order linked
    try {
      // Step A: Link entries to existing orders by user_id and tournament_id if te.order_id is null
      await db.query(`
        UPDATE tournament_entries te
        SET order_id = o.id
        FROM orders o
        WHERE te.order_id IS NULL AND te.tournament_id = o.tournament_id AND te.user_id = o.user_id
      `);

      // Step B: For any remaining entries without an order (like seed data), create an official order record
      const unlinked = await db.query(`
        SELECT te.id AS entry_id, te.tournament_id, te.user_id, u.name, u.phone, u.address, u.city, u.state, u.pincode
        FROM tournament_entries te
        JOIN users u ON te.user_id = u.id
        WHERE te.order_id IS NULL OR NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = te.order_id)
      `);

      if (unlinked.rows.length > 0) {
        const defaultGiftRes = await db.query(`SELECT * FROM gifts ORDER BY id ASC LIMIT 1`);
        const gift = defaultGiftRes.rows[0] || {
          id: 1,
          name: 'Urban Archive Streetwear Graphic T-Shirt',
          category: 'T-Shirt',
          image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
        };

        for (const entry of unlinked.rows) {
          const randDigits = Math.floor(100000 + Math.random() * 900000);
          const orderNum = `WA-ORD-${randDigits}`;
          const awbNum = `BLUEDART-IND-${Math.floor(1000000 + Math.random() * 9000000)}`;
          const orderRes = await db.query(`
            INSERT INTO orders (
              order_number, user_id, tournament_id, gift_id, gift_name, gift_category, gift_image,
              selected_size, selected_color, shipping_name, shipping_phone, shipping_address,
              shipping_city, shipping_state, shipping_pincode, amount_paid, payment_method, payment_status,
              fulfillment_status, courier_partner, tracking_number, tracking_timeline
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              'M', 'Standard', $8, $9, $10,
              $11, $12, $13, 1000.00, 'UPI (Verified)', 'VERIFIED',
              'ORDER_PLACED', 'BlueDart Express', $14,
              $15
            ) RETURNING id
          `, [
            orderNum, entry.user_id, entry.tournament_id, gift.id, gift.name, gift.category, gift.image_url,
            entry.name || 'Contestant', entry.phone || '+91 9771122334', entry.address || 'Address on file',
            entry.city || 'Bengaluru', entry.state || 'Tamil Nadu', entry.pincode || '560038',
            awbNum,
            JSON.stringify([
              { status: 'Order Placed', timestamp: new Date(), location: `${entry.city || 'Chennai'} Regional Hub`, note: 'Guaranteed reward confirmed upon contest entry.' }
            ])
          ]);

          await db.query(`UPDATE tournament_entries SET order_id = $1 WHERE id = $2`, [orderRes.rows[0].id, entry.entry_id]);
        }
      }
    } catch (syncErr) {
      console.warn('Auto-sync orders warning:', syncErr);
    }

    // 1. Get summary for each competition (tournament)
    const compSummaryRes = await db.query(`
      SELECT
        t.id,
        t.title,
        t.slug,
        t.category,
        t.status,
        t.image_url,
        t.entry_fee,
        t.retail_price,
        t.slots_filled,
        t.total_slots,
        t.created_at,
        t.end_time,
        (SELECT COUNT(*) FROM tournament_entries te WHERE te.tournament_id = t.id) AS actual_participants_count,
        (SELECT COALESCE(SUM(o.amount_paid), 0) FROM orders o WHERE o.tournament_id = t.id AND o.payment_status = 'VERIFIED') AS total_revenue_collected,
        (SELECT MAX(high_score) FROM tournament_entries te WHERE te.tournament_id = t.id) AS highest_score,
        (SELECT u.name FROM tournament_entries te JOIN users u ON te.user_id = u.id WHERE te.tournament_id = t.id ORDER BY te.high_score DESC, te.last_played_at ASC LIMIT 1) AS leader_name
      FROM tournaments t
      ORDER BY t.created_at DESC
    `);

    // 2. Query detailed participants with User & Order & Shipping information
    let query = `
      SELECT
        te.id AS entry_id,
        te.tournament_id,
        te.user_id,
        te.high_score,
        te.games_played,
        te.last_played_at,
        te.created_at AS joined_at,
        DENSE_RANK() OVER (PARTITION BY te.tournament_id ORDER BY te.high_score DESC, te.last_played_at ASC) AS competition_rank,
        t.title AS tournament_title,
        t.category AS tournament_category,
        t.entry_fee,
        t.status AS tournament_status,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.address AS user_address,
        u.city AS user_city,
        u.state AS user_state,
        u.pincode AS user_pincode,
        u.role AS user_role,
        u.avatar_url,
        o.id AS order_id,
        o.order_number,
        o.amount_paid,
        o.payment_method,
        o.payment_status,
        o.fulfillment_status,
        o.courier_partner,
        o.tracking_number,
        o.gift_name,
        o.gift_category,
        o.gift_image,
        o.selected_size,
        o.selected_color,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_city,
        o.shipping_state,
        o.shipping_pincode,
        o.created_at AS order_created_at
      FROM tournament_entries te
      JOIN tournaments t ON te.tournament_id = t.id
      JOIN users u ON te.user_id = u.id
      LEFT JOIN orders o ON te.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (tournament_id && tournament_id !== 'ALL') {
      params.push(tournament_id);
      query += ` AND te.tournament_id = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const sIdx = params.length;
      query += ` AND (
        LOWER(u.name) LIKE $${sIdx} OR
        LOWER(u.email) LIKE $${sIdx} OR
        LOWER(COALESCE(u.phone, '')) LIKE $${sIdx} OR
        LOWER(t.title) LIKE $${sIdx} OR
        LOWER(COALESCE(o.shipping_name, '')) LIKE $${sIdx} OR
        LOWER(COALESCE(o.shipping_phone, '')) LIKE $${sIdx} OR
        LOWER(COALESCE(o.shipping_city, '')) LIKE $${sIdx} OR
        LOWER(COALESCE(o.order_number, '')) LIKE $${sIdx} OR
        LOWER(COALESCE(o.tracking_number, '')) LIKE $${sIdx} OR
        LOWER(COALESCE(o.gift_name, '')) LIKE $${sIdx}
      )`;
    }

    if (sort === 'SCORE_DESC') {
      query += ` ORDER BY te.high_score DESC, te.created_at DESC`;
    } else if (sort === 'OLDEST') {
      query += ` ORDER BY te.created_at ASC`;
    } else {
      query += ` ORDER BY te.created_at DESC`;
    }

    const participantsRes = await db.query(query, params);

    res.json({
      success: true,
      competitions: compSummaryRes.rows,
      participants: participantsRes.rows,
      total_participants: participantsRes.rows.length
    });
  } catch (err) {
    console.error('Competitions participants error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch competitions participants' });
  }
});

// GET /api/admin/tournaments/:id/participants - Single tournament participants
router.get('/tournaments/:id/participants', authenticateToken, requireRoles('Super Admin', 'Admin', 'Manager', 'Support', 'Accountant'), async (req, res) => {
  try {
    const { id } = req.params;
    const { search } = req.query;

    const tourRes = await db.query(`SELECT * FROM tournaments WHERE id = $1`, [id]);
    if (tourRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Competition not found' });
    }

    let query = `
      SELECT
        te.id AS entry_id,
        te.tournament_id,
        te.user_id,
        te.high_score,
        te.games_played,
        te.last_played_at,
        te.created_at AS joined_at,
        DENSE_RANK() OVER (ORDER BY te.high_score DESC, te.last_played_at ASC) AS rank,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.address AS user_address,
        u.city AS user_city,
        u.state AS user_state,
        u.pincode AS user_pincode,
        u.role AS user_role,
        u.avatar_url,
        o.id AS order_id,
        o.order_number,
        o.amount_paid,
        o.payment_method,
        o.payment_status,
        o.fulfillment_status,
        o.courier_partner,
        o.tracking_number,
        o.gift_name,
        o.gift_category,
        o.gift_image,
        o.selected_size,
        o.selected_color,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_city,
        o.shipping_state,
        o.shipping_pincode,
        o.created_at AS order_created_at
      FROM tournament_entries te
      JOIN users u ON te.user_id = u.id
      LEFT JOIN orders o ON te.order_id = o.id
      WHERE te.tournament_id = $1
    `;
    const params = [id];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (
        LOWER(u.name) LIKE $2 OR
        LOWER(u.email) LIKE $2 OR
        LOWER(COALESCE(u.phone, '')) LIKE $2 OR
        LOWER(COALESCE(o.shipping_name, '')) LIKE $2 OR
        LOWER(COALESCE(o.shipping_phone, '')) LIKE $2 OR
        LOWER(COALESCE(o.shipping_city, '')) LIKE $2 OR
        LOWER(COALESCE(o.order_number, '')) LIKE $2 OR
        LOWER(COALESCE(o.tracking_number, '')) LIKE $2 OR
        LOWER(COALESCE(o.gift_name, '')) LIKE $2
      )`;
    }

    query += ` ORDER BY te.high_score DESC, te.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      tournament: tourRes.rows[0],
      total_participants: result.rows.length,
      participants: result.rows
    });
  } catch (err) {
    console.error('Tournament participants error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

// POST /api/admin/upload-image - Upload prize/challenge image
router.post('/upload-image', authenticateToken, requireRoles('Super Admin', 'Admin', 'Manager'), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Match base64 data URI e.g. "data:image/png;base64,iVBORw..."
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image data' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine extension
    let ext = 'jpg';
    if (mimeType === 'image/png') ext = 'png';
    else if (mimeType === 'image/webp') ext = 'webp';
    else if (mimeType === 'image/gif') ext = 'gif';
    else if (mimeType === 'image/svg+xml') ext = 'svg';

    const uploadsDir = path.join(__dirname, '../uploads/prizes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeBaseName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30) : 'prize';
    const uniqueFilename = `${safeBaseName}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/prizes/${uniqueFilename}`;
    res.json({ success: true, url: publicUrl, filename: uniqueFilename });
  } catch (err) {
    console.error('Upload image error:', err);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

// GET /api/admin/app-settings - Get full application settings
router.get('/app-settings', authenticateToken, requireRoles('Super Admin', 'Admin'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM app_settings WHERE setting_key = $1', ['default']);
    if (result.rows.length === 0) {
      const defaultInsert = await db.query(`
        INSERT INTO app_settings (setting_key) VALUES ('default') RETURNING *
      `);
      return res.json({ success: true, settings: defaultInsert.rows[0] });
    }
    res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    console.error('Fetch app settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to load application settings' });
  }
});

// PUT /api/admin/app-settings - Update application settings (Super Admin only)
router.put('/app-settings', authenticateToken, requireRoles('Super Admin'), async (req, res) => {
  try {
    const {
      app_name,
      app_tagline,
      logo_url,
      logo_icon,
      admin_header_title,
      admin_header_badge,
      admin_header_subtitle,
      support_email,
      support_phone,
      support_whatsapp,
      office_address,
      currency_symbol,
      currency_code,
      default_challenge_days,
      default_entry_fee,
      default_courier_partner,
      allow_registrations,
      maintenance_mode,
      enable_guaranteed_gifts,
      footer_copyright_text
    } = req.body;

    const result = await db.query(
      `UPDATE app_settings
       SET app_name = COALESCE($1, app_name),
           app_tagline = COALESCE($2, app_tagline),
           logo_url = COALESCE($3, logo_url),
           logo_icon = COALESCE($4, logo_icon),
           admin_header_title = COALESCE($5, admin_header_title),
           admin_header_badge = COALESCE($6, admin_header_badge),
           admin_header_subtitle = COALESCE($7, admin_header_subtitle),
           support_email = COALESCE($8, support_email),
           support_phone = COALESCE($9, support_phone),
           support_whatsapp = COALESCE($10, support_whatsapp),
           office_address = COALESCE($11, office_address),
           currency_symbol = COALESCE($12, currency_symbol),
           currency_code = COALESCE($13, currency_code),
           default_challenge_days = COALESCE($14, default_challenge_days),
           default_entry_fee = COALESCE($15, default_entry_fee),
           default_courier_partner = COALESCE($16, default_courier_partner),
           allow_registrations = COALESCE($17, allow_registrations),
           maintenance_mode = COALESCE($18, maintenance_mode),
           enable_guaranteed_gifts = COALESCE($19, enable_guaranteed_gifts),
           footer_copyright_text = COALESCE($20, footer_copyright_text),
           updated_at = NOW()
       WHERE setting_key = 'default'
       RETURNING *`,
      [
        app_name,
        app_tagline,
        logo_url !== undefined ? logo_url : null,
        logo_icon,
        admin_header_title,
        admin_header_badge,
        admin_header_subtitle,
        support_email,
        support_phone,
        support_whatsapp,
        office_address,
        currency_symbol,
        currency_code,
        default_challenge_days,
        default_entry_fee,
        default_courier_partner,
        allow_registrations,
        maintenance_mode,
        enable_guaranteed_gifts,
        footer_copyright_text
      ]
    );

    res.json({
      success: true,
      message: 'Application settings & branding successfully updated!',
      settings: result.rows[0]
    });
  } catch (err) {
    console.error('Update app settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to update application settings' });
  }
});

// POST /api/admin/upload-logo - Upload app brand logo (Super Admin only)
router.post('/upload-logo', authenticateToken, requireRoles('Super Admin'), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No logo image data provided' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 logo data' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
    else if (mimeType === 'image/webp') ext = 'webp';
    else if (mimeType === 'image/svg+xml') ext = 'svg';

    const uploadsDir = path.join(__dirname, '../uploads/brand');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueFilename = `app-logo-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/brand/${uniqueFilename}`;
    res.json({ success: true, url: publicUrl, filename: uniqueFilename });
  } catch (err) {
    console.error('Upload logo error:', err);
    res.status(500).json({ success: false, error: 'Failed to upload logo' });
  }
});

module.exports = router;

