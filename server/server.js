const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tournamentsRoutes = require('./routes/tournaments');
const giftsRoutes = require('./routes/gifts');
const ordersRoutes = require('./routes/orders');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client dev server & production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const path = require('path');
const fs = require('fs');

// Health Check API
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await db.query('SELECT NOW()');
    res.json({
      status: 'UP',
      time: dbRes.rows[0].now,
      service: 'WinArena 5-Day Skill Tournament API',
      database: 'ChallengeDB'
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// Public Application Settings API (Branding, App Name, Logo, Support info)
app.get('/api/app-settings', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM app_settings WHERE setting_key = $1', ['default']);
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        settings: {
          app_name: 'WinArena',
          app_tagline: 'Skill-Based Competitions & Guaranteed Apparel Rewards',
          logo_url: '',
          logo_icon: 'ShoppingBag',
          admin_header_title: 'WinArena',
          admin_header_badge: 'CONTROL',
          admin_header_subtitle: 'Operations & Ops Console',
          support_email: 'support@winarena.com',
          support_phone: '+91 97711 22334',
          support_whatsapp: '+91 97711 22334',
          currency_symbol: '₹',
          default_challenge_days: 5,
          default_entry_fee: 1000,
          default_courier_partner: 'BlueDart Express',
          maintenance_mode: false,
          allow_registrations: true,
          enable_guaranteed_gifts: true
        }
      });
    }
    res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    console.error('Fetch public app settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch application settings' });
  }
});

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/gifts', giftsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Serve Static Frontend (Vite Build) in Production / Deployment
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 WinArena Server running on port ${PORT}`);
  console.log(`📡 Database: ${process.env.DATABASE_URL ? 'Cloud PostgreSQL (DATABASE_URL configured)' : (process.env.DB_NAME || 'ChallengeDB')}`);

  // Auto-init schema if deploying to a fresh database (e.g. Railway)
  try {
    const checkRes = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);
    if (!checkRes.rows[0].exists) {
      console.log('🔄 First-time deployment detected! Initializing database schema & seeds...');
      const { seedDatabase } = require('./seed');
      await seedDatabase();
      console.log('🎉 Database tables & seed data initialized successfully!');
    }
  } catch (err) {
    console.warn('Database initialization check note:', err.message);
  }
});
