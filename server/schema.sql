-- Drop tables if needed for clean reload
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS tournament_entries CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS game_settings CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS gifts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Users',
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100) DEFAULT 'Tamil Nadu',
  pincode VARCHAR(20),
  landmark VARCHAR(255),
  avatar_url TEXT,
  is_blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Guaranteed Gifts table
CREATE TABLE gifts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  tagline VARCHAR(500),
  description TEXT,
  image_url TEXT NOT NULL,
  market_value NUMERIC(10, 2) DEFAULT 1499.00,
  options JSONB DEFAULT '{"sizes": ["S", "M", "L", "XL", "XXL"], "colors": ["Standard"]}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 500,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tournaments (Challenges) table
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) DEFAULT 'Smartphones & Flagships',
  badge_text VARCHAR(100) DEFAULT 'OFFICIAL OFFICIAL PARTNER HUB',
  banner_tag VARCHAR(100) DEFAULT '5-Day Skill Mega Challenge',
  description TEXT,
  specifications JSONB DEFAULT '[]'::jsonb,
  whats_in_box JSONB DEFAULT '[]'::jsonb,
  image_url TEXT NOT NULL,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  entry_fee NUMERIC(10, 2) DEFAULT 1000.00,
  retail_price NUMERIC(10, 2) DEFAULT 149900.00,
  total_slots INTEGER DEFAULT 500,
  slots_filled INTEGER DEFAULT 280,
  rating NUMERIC(3, 1) DEFAULT 5.0,
  ratings_count INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  is_featured BOOLEAN DEFAULT false,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 days',
  winner_id INTEGER REFERENCES users(id),
  winner_name VARCHAR(255),
  winner_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders table (Logistics & Guaranteed Apparel Delivery)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
  gift_id INTEGER REFERENCES gifts(id) ON DELETE SET NULL,
  gift_name VARCHAR(255) NOT NULL,
  gift_category VARCHAR(100),
  gift_image TEXT,
  selected_size VARCHAR(50),
  selected_color VARCHAR(50),
  shipping_name VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(50) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) DEFAULT 'Tamil Nadu',
  shipping_pincode VARCHAR(20) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 1000.00,
  payment_method VARCHAR(50) DEFAULT 'UPI',
  payment_txn_id VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'VERIFIED',
  fulfillment_status VARCHAR(50) DEFAULT 'ORDER_PLACED',
  courier_partner VARCHAR(100) DEFAULT 'BlueDart Express',
  tracking_number VARCHAR(100),
  tracking_timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tournament Entries
CREATE TABLE tournament_entries (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  high_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- 6. Dynamic Game Settings table
CREATE TABLE game_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL DEFAULT 'default',
  base_speed INTEGER DEFAULT 120,
  min_speed INTEGER DEFAULT 45,
  acceleration_step INTEGER DEFAULT 3,
  golden_apple_chance NUMERIC(4, 2) DEFAULT 0.25,
  golden_apple_points INTEGER DEFAULT 50,
  normal_apple_points INTEGER DEFAULT 10,
  golden_apple_duration_sec INTEGER DEFAULT 7,
  board_size INTEGER DEFAULT 20,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Game Sessions (Anti-cheat & Score audit)
CREATE TABLE game_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  apples_eaten INTEGER DEFAULT 0,
  golden_apples_eaten INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. Application Settings (Dynamic Branding, Logo & Configuration)
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

-- Indexes for high performance
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_slug ON tournaments(slug);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_entries_tournament_score ON tournament_entries(tournament_id, high_score DESC);

