const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, optionalAuth, requireRoles } = require('../middleware/auth');

// GET /api/tournaments - Public list of challenges
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status, search, startDate, endDate, timeframe, includeInactive } = req.query;
    const params = [];
    let userScoreSelect = '';

    if (req.user) {
      params.push(req.user.id);
      const userParamIdx = params.length;
      userScoreSelect = `,
        (SELECT te.high_score FROM tournament_entries te WHERE te.tournament_id = t.id AND te.user_id = $${userParamIdx}) AS my_score,
        (SELECT te.games_played FROM tournament_entries te WHERE te.tournament_id = t.id AND te.user_id = $${userParamIdx}) AS my_games_played,
        (CASE 
           WHEN EXISTS (SELECT 1 FROM tournament_entries te4 WHERE te4.tournament_id = t.id AND te4.user_id = $${userParamIdx}) 
           THEN (SELECT COUNT(*) + 1 FROM tournament_entries te2 
                 WHERE te2.tournament_id = t.id 
                   AND te2.high_score > COALESCE((SELECT te3.high_score FROM tournament_entries te3 WHERE te3.tournament_id = t.id AND te3.user_id = $${userParamIdx}), 0))
           ELSE NULL 
         END) AS my_rank`;
    }

    let query = `
      SELECT t.*,
             u_win.name AS winner_user_name,
             u_win.city AS winner_city,
             u_win.state AS winner_state,
             u_win.avatar_url AS winner_avatar,
             (SELECT COUNT(*) FROM tournament_entries te WHERE te.tournament_id = t.id) AS participants_count
             ${userScoreSelect}
      FROM tournaments t
      LEFT JOIN users u_win ON t.winner_id = u_win.id
      WHERE 1=1
    `;

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND t.category = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    } else if (includeInactive !== 'true' && includeInactive !== true) {
      // By default, public requests exclude deactivated/inactive challenges
      query += ` AND t.status != 'INACTIVE'`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(t.title) LIKE $${params.length} OR LOWER(t.category) LIKE $${params.length} OR LOWER(t.description) LIKE $${params.length})`;
    }

    if (timeframe === 'week') {
      query += ` AND (t.created_at >= NOW() - INTERVAL '7 days' OR t.start_time >= NOW() - INTERVAL '7 days')`;
    } else if (timeframe === 'month') {
      query += ` AND (t.created_at >= NOW() - INTERVAL '30 days' OR t.start_time >= NOW() - INTERVAL '30 days')`;
    } else {
      if (startDate) {
        params.push(startDate);
        query += ` AND t.created_at >= $${params.length}::timestamptz`;
      }
      if (endDate) {
        params.push(endDate);
        query += ` AND t.created_at <= ($${params.length}::date + INTERVAL '1 day')::timestamptz`;
      }
    }

    query += ` ORDER BY CASE WHEN t.status = 'ACTIVE' THEN 0 ELSE 1 END, t.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, tournaments: result.rows });
  } catch (err) {
    console.error('Fetch tournaments error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch tournaments' });
  }
});

// GET /api/tournaments/:slugOrId - Detailed tournament page
router.get('/:slugOrId', optionalAuth, async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const isId = /^\d+$/.test(slugOrId);

    const tournamentQuery = `
      SELECT t.*,
             u_win.id AS winner_user_id,
             u_win.name AS winner_user_name,
             u_win.email AS winner_email,
             u_win.phone AS winner_phone,
             u_win.city AS winner_city,
             u_win.state AS winner_state,
             u_win.avatar_url AS winner_avatar,
             u_win.created_at AS winner_member_since,
             COALESCE(te_win.high_score, t.winner_score, 0) AS winner_verified_score,
             COALESCE(te_win.games_played, 0) AS winner_games_played,
             te_win.last_played_at AS winner_winning_timestamp
      FROM tournaments t
      LEFT JOIN users u_win ON t.winner_id = u_win.id
      LEFT JOIN tournament_entries te_win ON (t.id = te_win.tournament_id AND t.winner_id = te_win.user_id)
      WHERE ${isId ? 't.id = $1' : 't.slug = $1'}
    `;

    const result = await db.query(tournamentQuery, [isId ? parseInt(slugOrId, 10) : slugOrId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tournament challenge not found' });
    }

    const tournament = result.rows[0];

    // If tournament is concluded or has a winner name but winner profile is not joined, fetch fallback from top entry
    if ((tournament.status === 'CONCLUDED' || tournament.winner_name) && !tournament.winner_user_id) {
      const fallbackTop = await db.query(
        `SELECT te.user_id, te.high_score, te.games_played, te.last_played_at,
                u.name AS user_name, u.email AS user_email, u.city, u.state, u.avatar_url, u.created_at AS member_since
         FROM tournament_entries te
         JOIN users u ON te.user_id = u.id
         WHERE te.tournament_id = $1
         ORDER BY te.high_score DESC, te.last_played_at ASC
         LIMIT 1`,
        [tournament.id]
      );
      if (fallbackTop.rows.length > 0) {
        const fb = fallbackTop.rows[0];
        tournament.winner_id = tournament.winner_id || fb.user_id;
        tournament.winner_user_id = fb.user_id;
        tournament.winner_user_name = fb.user_name;
        tournament.winner_name = tournament.winner_name || fb.user_name;
        tournament.winner_email = fb.user_email;
        tournament.winner_city = fb.city;
        tournament.winner_state = fb.state;
        tournament.winner_avatar = fb.avatar_url;
        tournament.winner_member_since = fb.member_since;
        tournament.winner_score = tournament.winner_score || fb.high_score;
        tournament.winner_verified_score = fb.high_score;
        tournament.winner_games_played = fb.games_played;
        tournament.winner_winning_timestamp = fb.last_played_at;
      }
    }

    // Fetch top 10 leaderboard for this tournament
    const leaderboardRes = await db.query(
      `SELECT te.id, te.user_id, te.high_score, te.games_played, te.last_played_at,
              u.name AS player_name, u.city
       FROM tournament_entries te
       JOIN users u ON te.user_id = u.id
       WHERE te.tournament_id = $1
       ORDER BY te.high_score DESC, te.last_played_at ASC
       LIMIT 10`,
      [tournament.id]
    );

    // If user is authenticated, check if they have joined and what their high score / rank is
    let userEntry = null;
    let userRank = null;
    if (req.user) {
      const entryRes = await db.query(
        `SELECT te.*, o.order_number, o.fulfillment_status, o.gift_name, o.selected_size, o.shipping_city, o.tracking_number
         FROM tournament_entries te
         LEFT JOIN orders o ON te.order_id = o.id
         WHERE te.tournament_id = $1 AND te.user_id = $2`,
        [tournament.id, req.user.id]
      );

      if (entryRes.rows.length > 0) {
        userEntry = entryRes.rows[0];

        // Calculate user rank
        const rankRes = await db.query(
          `SELECT COUNT(*) + 1 AS rank
           FROM tournament_entries
           WHERE tournament_id = $1 AND high_score > $2`,
          [tournament.id, userEntry.high_score]
        );
        userRank = parseInt(rankRes.rows[0].rank, 10);
      }
    }

    res.json({
      success: true,
      tournament,
      leaderboard: leaderboardRes.rows,
      userEntry,
      userRank
    });
  } catch (err) {
    console.error('Fetch tournament details error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch challenge details' });
  }
});

// GET /api/tournaments/:id/leaderboard - Live leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT te.id, te.user_id, te.high_score, te.games_played, te.last_played_at,
              u.name AS player_name, u.city
       FROM tournament_entries te
       JOIN users u ON te.user_id = u.id
       WHERE te.tournament_id = $1
       ORDER BY te.high_score DESC, te.last_played_at ASC
       LIMIT 100`,
      [id]
    );

    res.json({
      success: true,
      leaderboard: result.rows.map((row, index) => ({
        rank: index + 1,
        ...row
      }))
    });
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/tournaments - Admin/Manager create new challenge
router.post('/', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const {
      title, slug, category, badge_text, banner_tag, description, specifications,
      whats_in_box, image_url, gallery_urls, entry_fee, retail_price, total_slots,
      status, start_time, end_time, duration_days
    } = req.body;

    if (!title || !slug || !image_url) {
      return res.status(400).json({ success: false, error: 'Title, slug, and image URL are required' });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const days = duration_days ? parseFloat(duration_days) : 5;
    const computedStartTime = start_time ? new Date(start_time) : new Date();
    const computedEndTime = end_time 
      ? new Date(end_time) 
      : new Date(computedStartTime.getTime() + days * 24 * 60 * 60 * 1000);
    const computedBannerTag = banner_tag || `${days}-Day Skill Mega Challenge`;
    const initialStatus = status || 'ACTIVE';

    const result = await db.query(
      `INSERT INTO tournaments (
        title, slug, category, badge_text, banner_tag, description, specifications,
        whats_in_box, image_url, gallery_urls, entry_fee, retail_price, total_slots,
        slots_filled, status, start_time, end_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, $14, $15, $16)
      RETURNING *`,
      [
        title,
        cleanSlug,
        category || 'Smartphones & Flagships',
        badge_text || 'OFFICIAL PARTNER HUB',
        computedBannerTag,
        description || '',
        JSON.stringify(specifications || []),
        JSON.stringify(whats_in_box || []),
        image_url,
        JSON.stringify(gallery_urls || [image_url]),
        entry_fee || 1000.00,
        retail_price || 50000.00,
        total_slots || 500,
        initialStatus,
        computedStartTime,
        computedEndTime
      ]
    );

    res.status(201).json({ success: true, tournament: result.rows[0] });
  } catch (err) {
    console.error('Create tournament error:', err);
    res.status(500).json({ success: false, error: 'Failed to create tournament challenge' });
  }
});

// PUT /api/tournaments/:id - Admin/Manager update challenge
router.put('/:id', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, category, badge_text, banner_tag, description, specifications,
      whats_in_box, image_url, gallery_urls, entry_fee, retail_price, total_slots,
      slots_filled, status, start_time, end_time, duration_days
    } = req.body;

    let computedStartTime = start_time ? new Date(start_time) : null;
    let computedEndTime = end_time ? new Date(end_time) : null;
    if (!computedEndTime && duration_days) {
      const days = parseFloat(duration_days);
      if (days > 0) {
        const baseTime = computedStartTime ? computedStartTime.getTime() : Date.now();
        computedEndTime = new Date(baseTime + days * 24 * 60 * 60 * 1000);
      }
    }

    const result = await db.query(
      `UPDATE tournaments
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           badge_text = COALESCE($3, badge_text),
           banner_tag = COALESCE($4, banner_tag),
           description = COALESCE($5, description),
           specifications = COALESCE($6, specifications),
           whats_in_box = COALESCE($7, whats_in_box),
           image_url = COALESCE($8, image_url),
           gallery_urls = COALESCE($9, gallery_urls),
           entry_fee = COALESCE($10, entry_fee),
           retail_price = COALESCE($11, retail_price),
           total_slots = COALESCE($12, total_slots),
           slots_filled = COALESCE($13, slots_filled),
           status = COALESCE($14, status),
           start_time = COALESCE($15, start_time),
           end_time = COALESCE($16, end_time)
       WHERE id = $17
       RETURNING *`,
      [
        title,
        category,
        badge_text,
        banner_tag,
        description,
        specifications ? JSON.stringify(specifications) : null,
        whats_in_box ? JSON.stringify(whats_in_box) : null,
        image_url,
        gallery_urls ? JSON.stringify(gallery_urls) : null,
        entry_fee,
        retail_price,
        total_slots,
        slots_filled,
        status,
        computedStartTime,
        computedEndTime,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    res.json({ success: true, tournament: result.rows[0] });
  } catch (err) {
    console.error('Update tournament error:', err);
    res.status(500).json({ success: false, error: 'Failed to update tournament' });
  }
});

// PUT /api/tournaments/:id/feature - Admin/Manager sets this challenge as featured on Homepage
router.put('/:id/feature', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Reset all tournaments to is_featured = false
    await db.query(`UPDATE tournaments SET is_featured = false`);

    // Set the selected tournament to is_featured = true
    const result = await db.query(
      `UPDATE tournaments SET is_featured = true WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    res.json({
      success: true,
      message: `Tournament "${result.rows[0].title}" is now featured on the homepage!`,
      tournament: result.rows[0]
    });
  } catch (err) {
    console.error('Set featured tournament error:', err);
    res.status(500).json({ success: false, error: 'Failed to set featured tournament' });
  }
});

// PUT /api/tournaments/:id/status - Admin/Manager updates challenge status (ACTIVE / INACTIVE / CONCLUDED)
router.put('/:id/status', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const normalizedStatus = (status || '').toUpperCase().trim();
    if (!['ACTIVE', 'INACTIVE', 'CONCLUDED'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, error: 'Status must be ACTIVE, INACTIVE, or CONCLUDED' });
    }

    // If deactivating a tournament, ensure it is no longer featured on the home hero
    if (normalizedStatus === 'INACTIVE') {
      await db.query(`UPDATE tournaments SET is_featured = false WHERE id = $1 AND is_featured = true`, [id]);
      // If no active tournament is featured, feature another active tournament
      const activeFeatured = await db.query(`SELECT id FROM tournaments WHERE is_featured = true AND status = 'ACTIVE' LIMIT 1`);
      if (activeFeatured.rows.length === 0) {
        await db.query(`
          UPDATE tournaments 
          SET is_featured = true 
          WHERE id = (SELECT id FROM tournaments WHERE status = 'ACTIVE' AND id != $1 ORDER BY created_at DESC LIMIT 1)
        `, [id]);
      }
    }

    const result = await db.query(
      `UPDATE tournaments SET status = $1 WHERE id = $2 RETURNING *`,
      [normalizedStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    res.json({
      success: true,
      message: `Tournament "${result.rows[0].title}" status set to ${normalizedStatus}`,
      tournament: result.rows[0]
    });
  } catch (err) {
    console.error('Update tournament status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update tournament status' });
  }
});

// POST /api/tournaments/:id/declare-winner - Winner Declaration (Step 7)
router.post('/:id/declare-winner', authenticateToken, requireRoles('Admin', 'Manager', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Find the #1 player on the leaderboard
    const topPlayerRes = await db.query(
      `SELECT te.*, u.name AS user_name, u.email AS user_email
       FROM tournament_entries te
       JOIN users u ON te.user_id = u.id
       WHERE te.tournament_id = $1
       ORDER BY te.high_score DESC, te.last_played_at ASC
       LIMIT 1`,
      [id]
    );

    let winnerId = null;
    let winnerName = 'No Qualified Participant';
    let winnerScore = 0;

    if (topPlayerRes.rows.length > 0) {
      const topPlayer = topPlayerRes.rows[0];
      winnerId = topPlayer.user_id;
      winnerName = topPlayer.user_name;
      winnerScore = topPlayer.high_score;
    }

    const updated = await db.query(
      `UPDATE tournaments
       SET status = 'CONCLUDED',
           badge_text = 'WINNER DECLARED • CONTEST ENDED',
           winner_id = $1,
           winner_name = $2,
           winner_score = $3
       WHERE id = $4
       RETURNING *`,
      [winnerId, winnerName, winnerScore, id]
    );

    res.json({
      success: true,
      message: `Winner successfully declared: ${winnerName}`,
      tournament: updated.rows[0]
    });
  } catch (err) {
    console.error('Declare winner error:', err);
    res.status(500).json({ success: false, error: 'Failed to declare winner' });
  }
});

// DELETE /api/tournaments/:id - Admin delete
router.delete('/:id', authenticateToken, requireRoles('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tournaments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (err) {
    console.error('Delete tournament error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete tournament' });
  }
});

module.exports = router;
