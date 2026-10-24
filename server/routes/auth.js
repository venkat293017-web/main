const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, city, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, address, city, state, pincode, landmark, avatar_url)
       VALUES ($1, $2, $3, 'Users', $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, role, phone, address, city, state, pincode, landmark, avatar_url, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, phone || null, address || null, city || null, 'Tamil Nadu', pincode || null, null, null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const result = await db.query(
      'SELECT id, name, email, password_hash, role, phone, address, city, state, pincode, landmark, avatar_url, COALESCE(is_blocked, false) AS is_blocked, blocked_reason FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if account is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        error: `Account Suspended: Your account has been blocked by administrator.${user.blocked_reason ? ' Reason: ' + user.blocked_reason : ''} Please contact support@winarena.com.`
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password_hash;

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login',
      details: err.message 
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, phone, address, city, state, pincode, landmark, avatar_url, COALESCE(is_blocked, false) AS is_blocked, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = result.rows[0];

    // If currently blocked, reject token
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        is_blocked: true,
        error: 'Your account has been suspended/blocked by an administrator.'
      });
    }


    // Get count of joined tournaments and orders
    const counts = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM tournament_entries WHERE user_id = $1) AS joined_tournaments,
        (SELECT COUNT(*) FROM orders WHERE user_id = $1) AS total_orders`,
      [user.id]
    );

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          joinedTournaments: parseInt(counts.rows[0].joined_tournaments, 10),
          totalOrders: parseInt(counts.rows[0].total_orders, 10),
        }
      }
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, landmark, avatar_url } = req.body;
    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           pincode = COALESCE($6, pincode),
           landmark = COALESCE($7, landmark),
           avatar_url = COALESCE($8, avatar_url)
       WHERE id = $9
       RETURNING id, name, email, role, phone, address, city, state, pincode, landmark, avatar_url`,
      [name, phone, address, city, state, pincode, landmark, avatar_url, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

module.exports = router;
