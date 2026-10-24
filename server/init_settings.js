const db = require('./db');

async function initSettingsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL DEFAULT 'default',
        app_name VARCHAR(100) DEFAULT 'WinArena',
        app_tagline VARCHAR(255) DEFAULT 'Skill-Based Competitions & Guaranteed Apparel Rewards',
        logo_url TEXT DEFAULT '',
        logo_icon VARCHAR(50) DEFAULT 'ShoppingBag',
        admin_header_title VARCHAR(100) DEFAULT 'WinArena',
        admin_header_badge VARCHAR(50) DEFAULT 'CONTROL',
        admin_header_subtitle VARCHAR(255) DEFAULT 'Operations & Ops Console',
        support_email VARCHAR(150) DEFAULT 'support@winarena.com',
        support_phone VARCHAR(50) DEFAULT '+91 97711 22334',
        support_whatsapp VARCHAR(50) DEFAULT '+91 97711 22334',
        office_address TEXT DEFAULT 'Level 4, Prestige Tech Park, Outer Ring Road, Bengaluru, Karnataka - 560103',
        currency_symbol VARCHAR(10) DEFAULT '₹',
        currency_code VARCHAR(10) DEFAULT 'INR',
        default_challenge_days INTEGER DEFAULT 5,
        default_entry_fee NUMERIC(10, 2) DEFAULT 1000.00,
        default_courier_partner VARCHAR(100) DEFAULT 'BlueDart Express',
        allow_registrations BOOLEAN DEFAULT true,
        maintenance_mode BOOLEAN DEFAULT false,
        enable_guaranteed_gifts BOOLEAN DEFAULT true,
        footer_copyright_text VARCHAR(255) DEFAULT '© 2026 WinArena Technologies. All rights reserved.',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await db.query(`
      INSERT INTO app_settings (
        setting_key, app_name, app_tagline, logo_url, logo_icon,
        admin_header_title, admin_header_badge, admin_header_subtitle,
        support_email, support_phone, support_whatsapp, office_address,
        currency_symbol, currency_code, default_challenge_days, default_entry_fee,
        default_courier_partner, allow_registrations, maintenance_mode,
        enable_guaranteed_gifts, footer_copyright_text
      ) VALUES (
        'default', 'WinArena', 'Skill-Based Competitions & Guaranteed Apparel Rewards', '', 'ShoppingBag',
        'WinArena', 'CONTROL', 'Operations & Ops Console',
        'support@winarena.com', '+91 97711 22334', '+91 97711 22334',
        'Level 4, Prestige Tech Park, Outer Ring Road, Bengaluru, Karnataka - 560103',
        '₹', 'INR', 5, 1000.00,
        'BlueDart Express', true, false,
        true, '© 2026 WinArena Technologies. All rights reserved.'
      )
      ON CONFLICT (setting_key) DO NOTHING;
    `);

    const res = await db.query('SELECT * FROM app_settings WHERE setting_key = $1', ['default']);
    console.log('✅ app_settings table successfully initialized:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize app_settings:', err);
    process.exit(1);
  }
}

initSettingsTable();
