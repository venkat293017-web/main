const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// POST /api/orders/checkout - Join challenge, select guaranteed gift, verify payment (Steps 3 & 4)
router.post('/checkout', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const {
      tournament_id,
      gift_id,
      selected_size,
      selected_color,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_pincode,
      payment_method,
      payment_txn_id
    } = req.body;

    if (!tournament_id || !gift_id || !shipping_name || !shipping_phone || !shipping_address || !shipping_city || !shipping_pincode) {
      return res.status(400).json({
        success: false,
        error: 'Please fill all required shipping address and gift selection fields'
      });
    }

    await client.query('BEGIN');

    // 1. Check tournament status
    const tourRes = await client.query('SELECT * FROM tournaments WHERE id = $1 FOR UPDATE', [tournament_id]);
    if (tourRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const tournament = tourRes.rows[0];
    if (tournament.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'This tournament has already concluded' });
    }

    if (tournament.slots_filled >= tournament.total_slots) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Tournament is fully booked (all slots filled)' });
    }

    // Check if user already joined
    const existingEntry = await client.query(
      'SELECT id FROM tournament_entries WHERE tournament_id = $1 AND user_id = $2',
      [tournament_id, req.user.id]
    );

    if (existingEntry.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'You have already joined this challenge. Head to the Snake Game Arena to play and improve your score!'
      });
    }

    // 2. Check Gift details
    const giftRes = await client.query('SELECT * FROM gifts WHERE id = $1', [gift_id]);
    if (giftRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Selected guaranteed gift not found' });
    }
    const gift = giftRes.rows[0];

    // 3. Generate Official Logistics Order Number (WA-ORD-xxxx)
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `WA-ORD-${randomDigits}`;
    const trackingNumber = `BLUEDART-IND-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const courierPartner = 'BlueDart Express';

    const trackingTimeline = [
      {
        status: 'Order Placed',
        timestamp: new Date(),
        location: `${shipping_city} Regional Hub`,
        note: `Guaranteed ${gift.category} reward order confirmed via ${payment_method || 'UPI'}. Official entry allocated.`
      },
      {
        status: 'Courier Tracking Allocated',
        timestamp: new Date(),
        location: 'BlueDart Logistics Gateway',
        note: `AWB Generated: ${trackingNumber}. Apparel ready for dispatch.`
      }
    ];

    // Insert Order
    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, user_id, tournament_id, gift_id, gift_name, gift_category,
        gift_image, selected_size, selected_color, shipping_name, shipping_phone,
        shipping_address, shipping_city, shipping_state, shipping_pincode,
        amount_paid, payment_method, payment_txn_id, payment_status,
        fulfillment_status, courier_partner, tracking_number, tracking_timeline
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        'VERIFIED', 'ORDER_PLACED', $19, $20, $21
      ) RETURNING *`,
      [
        orderNumber,
        req.user.id,
        tournament.id,
        gift.id,
        gift.name,
        gift.category,
        gift.image_url,
        selected_size || 'Standard',
        selected_color || 'Default',
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state || 'Tamil Nadu',
        shipping_pincode,
        tournament.entry_fee,
        payment_method || 'UPI',
        payment_txn_id || `UPI-${Date.now()}`,
        courierPartner,
        trackingNumber,
        JSON.stringify(trackingTimeline)
      ]
    );

    const order = orderRes.rows[0];

    // 4. Create Tournament Entry (unlocks gameplay modal)
    const entryRes = await client.query(
      `INSERT INTO tournament_entries (tournament_id, user_id, order_id, high_score, games_played)
       VALUES ($1, $2, $3, 0, 0)
       RETURNING *`,
      [tournament.id, req.user.id, order.id]
    );

    // 5. Update slots filled
    await client.query(
      `UPDATE tournaments SET slots_filled = slots_filled + 1 WHERE id = $1`,
      [tournament.id]
    );

    // 6. Ensure user's profile has delivery address synced if empty
    await client.query(
      `UPDATE users
       SET address = COALESCE(NULLIF(address, ''), $1),
           city = COALESCE(NULLIF(city, ''), $2),
           state = COALESCE(NULLIF(state, ''), $3),
           pincode = COALESCE(NULLIF(pincode, ''), $4),
           phone = COALESCE(NULLIF(phone, ''), $5)
       WHERE id = $6`,
      [shipping_address, shipping_city, shipping_state || 'Tamil Nadu', shipping_pincode, shipping_phone, req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Payment verified! Your guaranteed gift order is placed and Snake Arena is now unlocked.',
      order,
      entry: entryRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, error: 'Failed to process tournament entry and payment' });
  } finally {
    client.release();
  }
});

// GET /api/orders/my - Current user's apparel orders
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, t.title AS tournament_title, t.image_url AS tournament_image
       FROM orders o
       LEFT JOIN tournaments t ON o.tournament_id = t.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error('Fetch my orders error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch your orders' });
  }
});

// GET /api/orders/:id - Single order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isOrderNum = id.startsWith('WA-ORD-');

    const query = isOrderNum
      ? `SELECT o.*, t.title AS tournament_title, u.email AS user_email
         FROM orders o
         LEFT JOIN tournaments t ON o.tournament_id = t.id
         JOIN users u ON o.user_id = u.id
         WHERE o.order_number = $1`
      : `SELECT o.*, t.title AS tournament_title, u.email AS user_email
         FROM orders o
         LEFT JOIN tournaments t ON o.tournament_id = t.id
         JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`;

    const result = await db.query(query, [isOrderNum ? id : parseInt(id, 10)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = result.rows[0];

    // Check ownership if not admin/staff
    const staffRoles = ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Support'];
    if (order.user_id !== req.user.id && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error('Fetch order error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch order details' });
  }
});

// GET /api/orders/admin/all - Staff & Admin orders management (Support, Accountant, Manager, Admin)
router.get('/admin/all', authenticateToken, requireRoles('Super Admin', 'Admin', 'Manager', 'Accountant', 'Support'), async (req, res) => {
  try {
    const { status, search, tournament_id } = req.query;
    let query = `
      SELECT o.*, t.title AS tournament_title, u.name AS user_name, u.email AS user_email
      FROM orders o
      LEFT JOIN tournaments t ON o.tournament_id = t.id
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All' && status !== 'ALL') {
      params.push(status);
      query += ` AND o.fulfillment_status = $${params.length}`;
    }

    if (tournament_id && tournament_id !== 'All' && tournament_id !== 'ALL') {
      params.push(parseInt(tournament_id, 10));
      query += ` AND o.tournament_id = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(o.order_number) LIKE $${params.length} OR LOWER(o.shipping_name) LIKE $${params.length} OR LOWER(o.shipping_city) LIKE $${params.length} OR LOWER(o.tracking_number) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(t.title) LIKE $${params.length})`;
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await db.query(query, params);
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error('Admin fetch orders error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders list' });
  }
});

// PUT /api/orders/:id/status - Staff update logistics status (Step 6 fulfillment)
router.put('/:id/status', authenticateToken, requireRoles('Super Admin', 'Admin', 'Manager', 'Support'), async (req, res) => {
  try {
    const { id } = req.params;
    const { fulfillment_status, courier_partner, tracking_number, location, note } = req.body;

    const currentOrder = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (currentOrder.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = currentOrder.rows[0];
    let timeline = order.tracking_timeline || [];
    if (!Array.isArray(timeline)) {
      timeline = [];
    }

    if (note || fulfillment_status) {
      timeline.push({
        status: fulfillment_status || order.fulfillment_status,
        timestamp: new Date(),
        location: location || `${order.shipping_city} Express Logistics Hub`,
        note: note || `Package status updated to ${fulfillment_status}`
      });
    }

    const result = await db.query(
      `UPDATE orders
       SET fulfillment_status = COALESCE($1, fulfillment_status),
           courier_partner = COALESCE($2, courier_partner),
           tracking_number = COALESCE($3, tracking_number),
           tracking_timeline = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [fulfillment_status, courier_partner, tracking_number, JSON.stringify(timeline), id]
    );

    res.json({
      success: true,
      message: 'Logistics fulfillment status updated successfully',
      order: result.rows[0]
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

module.exports = router;
