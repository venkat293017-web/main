const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/game/settings - Get dynamic game settings from DB
router.get('/settings', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM game_settings WHERE setting_key = $1', ['default']);
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        settings: {
          base_speed: 110,
          min_speed: 40,
          acceleration_step: 3,
          golden_apple_chance: 0.25,
          golden_apple_points: 50,
          normal_apple_points: 10,
          golden_apple_duration_sec: 7,
          board_size: 20
        }
      });
    }
    res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    console.error('Fetch game settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch game settings' });
  }
});

// POST /api/game/start-session - Start an authenticated game session
router.post('/start-session', authenticateToken, async (req, res) => {
  try {
    const { tournament_id } = req.body;

    if (!tournament_id) {
      return res.status(400).json({ success: false, error: 'Tournament ID is required' });
    }

    // 1. Verify user is registered for this tournament
    const entryRes = await db.query(
      `SELECT te.*, t.status AS tournament_status, t.title AS tournament_title, t.start_time, t.end_time
       FROM tournament_entries te
       JOIN tournaments t ON te.tournament_id = t.id
       WHERE te.tournament_id = $1 AND te.user_id = $2`,
      [tournament_id, req.user.id]
    );

    if (entryRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You have not joined this tournament yet. Please join and select your guaranteed gift first.'
      });
    }

    const entry = entryRes.rows[0];
    if (entry.tournament_status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'This tournament has already ended. Gameplay is locked.'
      });
    }

    // Verify tournament has started (if start_time is in the future)
    if (entry.start_time && new Date(entry.start_time).getTime() > Date.now()) {
      const startTimeFormatted = new Date(entry.start_time).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      return res.status(400).json({
        success: false,
        error: `This tournament is an Upcoming Challenge! Gameplay opens on ${startTimeFormatted}. Your entry and guaranteed apparel gift are safely reserved.`
      });
    }

    // 2. Fetch active dynamic game settings
    const settingsRes = await db.query('SELECT * FROM game_settings WHERE setting_key = $1', ['default']);
    const settings = settingsRes.rows[0] || {
      base_speed: 110,
      min_speed: 40,
      acceleration_step: 3,
      golden_apple_chance: 0.25,
      golden_apple_points: 50,
      normal_apple_points: 10,
      golden_apple_duration_sec: 7,
      board_size: 20
    };

    // 3. Generate session token
    const sessionToken = crypto.randomBytes(24).toString('hex');
    await db.query(
      `INSERT INTO game_sessions (session_token, tournament_id, user_id, status)
       VALUES ($1, $2, $3, 'ACTIVE')`,
      [sessionToken, tournament_id, req.user.id]
    );

    res.json({
      success: true,
      sessionToken,
      settings,
      currentHighScore: entry.high_score,
      tournamentTitle: entry.tournament_title
    });
  } catch (err) {
    console.error('Start game session error:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate game session' });
  }
});

// POST /api/game/submit-score - Secure score submission with verification
router.post('/submit-score', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const {
      session_token,
      tournament_id,
      score,
      apples_eaten,
      golden_apples_eaten,
      duration_seconds
    } = req.body;

    if (!session_token || !tournament_id || score === undefined) {
      return res.status(400).json({ success: false, error: 'Session token, tournament ID, and score are required' });
    }

    await client.query('BEGIN');

    // 1. Verify game session
    const sessionRes = await client.query(
      `SELECT * FROM game_sessions
       WHERE session_token = $1 AND tournament_id = $2 AND user_id = $3
       FOR UPDATE`,
      [session_token, tournament_id, req.user.id]
    );

    if (sessionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Invalid or expired game session' });
    }

    const session = sessionRes.rows[0];
    if (session.status === 'COMPLETED') {
      const entryRes = await client.query(
        `SELECT * FROM tournament_entries WHERE tournament_id = $1 AND user_id = $2`,
        [tournament_id, req.user.id]
      );
      const currentEntry = entryRes.rows[0];
      const rankRes = await client.query(
        `SELECT COUNT(*) + 1 AS rank FROM tournament_entries WHERE tournament_id = $1 AND high_score > $2`,
        [tournament_id, currentEntry ? currentEntry.high_score : 0]
      );
      await client.query('COMMIT');
      return res.json({
        success: true,
        alreadySubmitted: true,
        highScore: currentEntry ? currentEntry.high_score : session.score,
        rank: parseInt(rankRes.rows[0]?.rank || 1, 10),
        message: 'Score submitted to leaderboard',
        isPersonalBest: session.score >= (currentEntry ? currentEntry.high_score : 0)
      });
    }

    // 2. Anti-cheat check: basic mathematical bounds validation
    const settingsRes = await client.query('SELECT * FROM game_settings WHERE setting_key = $1', ['default']);
    const settings = settingsRes.rows[0] || { golden_apple_points: 50, normal_apple_points: 10 };

    const expectedScore = (apples_eaten || 0) * settings.normal_apple_points +
                          (golden_apples_eaten || 0) * settings.golden_apple_points;

    // Allow slight tolerance if golden apples expired right as eaten, but score cannot exceed calculated ceiling
    const maxPossibleScore = Math.max(expectedScore, (apples_eaten || 0) * settings.golden_apple_points * 2);
    if (score > maxPossibleScore && score > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Security validation failed: anomalous score detected' });
    }

    // 3. Mark session complete
    await client.query(
      `UPDATE game_sessions
       SET status = 'COMPLETED',
           score = $1,
           apples_eaten = $2,
           golden_apples_eaten = $3,
           duration_seconds = $4,
           completed_at = NOW()
       WHERE id = $5`,
      [score, apples_eaten || 0, golden_apples_eaten || 0, duration_seconds || 0, session.id]
    );

    // 4. Update tournament entry
    const entryRes = await client.query(
      `SELECT * FROM tournament_entries
       WHERE tournament_id = $1 AND user_id = $2
       FOR UPDATE`,
      [tournament_id, req.user.id]
    );

    if (entryRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Tournament entry not found' });
    }

    const currentEntry = entryRes.rows[0];
    const isPersonalBest = score > currentEntry.high_score;
    const newHighScore = isPersonalBest ? score : currentEntry.high_score;

    await client.query(
      `UPDATE tournament_entries
       SET high_score = $1,
           games_played = games_played + 1,
           last_played_at = NOW()
       WHERE id = $2`,
      [newHighScore, currentEntry.id]
    );

    // 5. Calculate new rank on live leaderboard
    const rankRes = await client.query(
      `SELECT COUNT(*) + 1 AS rank
       FROM tournament_entries
       WHERE tournament_id = $1 AND high_score > $2`,
      [tournament_id, newHighScore]
    );
    const newRank = parseInt(rankRes.rows[0].rank, 10);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: isPersonalBest ? '🎉 New Personal Best High Score recorded!' : 'Score submitted to leaderboard',
      score,
      highScore: newHighScore,
      isPersonalBest,
      rank: newRank
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Submit score error:', err);
    res.status(500).json({ success: false, error: 'Failed to record game score' });
  } finally {
    client.release();
  }
});

module.exports = router;
