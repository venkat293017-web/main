const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function seedDatabase() {
  console.log('--- Initializing WinArena Database Schema & Seed Data ---');
  const client = await pool.connect();

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Tables created successfully.');

    // 1. Seed Users with various roles
    const passwordHash = await bcrypt.hash('admin123', 10);
    const playerHash = await bcrypt.hash('player123', 10);

    const usersData = [
      { name: 'Venkat (Super Admin)', email: 'superadmin@winarena.com', password: passwordHash, role: 'Super Admin', phone: '+91 9840123456', address: '14 Prestige Tower, Anna Salai', city: 'Chennai', pincode: '600002' },
      { name: 'Admin Manager', email: 'admin@winarena.com', password: passwordHash, role: 'Admin', phone: '+91 9840123457', address: 'Plot 45, OMR IT Highway', city: 'Chennai', pincode: '600096' },
      { name: 'Operations Manager', email: 'manager@winarena.com', password: passwordHash, role: 'Manager', phone: '+91 9840123458', address: 'Sector 5, HSR Layout', city: 'Bengaluru', pincode: '560102' },
      { name: 'Chief Accountant', email: 'accountant@winarena.com', password: passwordHash, role: 'Accountant', phone: '+91 9840123459', address: 'BKC Financial Center', city: 'Mumbai', pincode: '400051' },
      { name: 'Customer Support Lead', email: 'support@winarena.com', password: passwordHash, role: 'Support', phone: '+91 9840123460', address: 'Gachibowli Cyber Hub', city: 'Hyderabad', pincode: '500032' },
      { name: 'test (PLAYER)', email: 'test@winarena.com', password: playerHash, role: 'Users', phone: '+91 9884011223', address: '32 Lakeview Avenue, Nungambakkam', city: 'Chennai', pincode: '600020' },
      { name: 'Rahul Sharma', email: 'rahul@winarena.com', password: playerHash, role: 'Users', phone: '+91 9771122334', address: 'B-102 Indiranagar', city: 'Bengaluru', pincode: '560038' },
      { name: 'Priya Sundaram', email: 'priya@winarena.com', password: playerHash, role: 'Users', phone: '+91 9662233445', address: '55 Jubilee Hills', city: 'Hyderabad', pincode: '500033' },
      { name: 'Aditya Verma', email: 'aditya@winarena.com', password: playerHash, role: 'Users', phone: '+91 9553344556', address: '78 Model Town', city: 'Delhi', pincode: '110009' }
    ];

    const insertedUsers = [];
    for (const u of usersData) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone, address, city, pincode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, email, role`,
        [u.name, u.email, u.password, u.role, u.phone, u.address, u.city, u.pincode]
      );
      insertedUsers.push(res.rows[0]);
    }
    console.log(`✅ Seeded ${insertedUsers.length} users with full RBAC roles.`);

    // 2. Seed Guaranteed Gifts (matching screenshots & prompt)
    const giftsData = [
      {
        name: 'Urban Archive Heavyweight Streetwear Graphic T-Shirt',
        category: 'T-Shirt',
        tagline: '100% 240 GSM Combed Cotton, drop shoulder relaxed streetwear fit, fade-resistant puff print.',
        description: 'Crafted from ultra-premium 240 GSM combed cotton. Features oversized drop-shoulder cut with high-density silicone chest print, bio-washed and pre-shrunk for lifetime durability.',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        market_value: 1499.00,
        options: {
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: ['Charcoal Black', 'Vintage Off-White', 'Midnight Navy']
        },
        display_order: 1
      },
      {
        name: 'Kanchipuram Art Silk Floral Embroidered Saree with Zari Border',
        category: 'Saree',
        tagline: 'Rich royal peacock blue with intricate gold zari brocade. Includes unstitched blouse piece (0.8m).',
        description: 'Traditional Kanchipuram style weaving featuring rich royal peacock blue adorned with intricate golden zari border and delicate floral motifs. Soft on skin and drape perfect.',
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        market_value: 2499.00,
        options: {
          sizes: ['Free Size (5.5m + 0.8m Blouse)'],
          colors: ['Royal Peacock Blue', 'Crimson Red', 'Emerald Green']
        },
        display_order: 2
      },
      {
        name: 'Handcrafted Zardozi Embroidered Designer Chanderi Kurti',
        category: 'Kurti',
        tagline: 'Luxurious Chanderi silk blend in royal wine with handcrafted neck & sleeve zari embroidery.',
        description: 'Authentic Chanderi silk blend featuring handcrafted intricate Zardozi embroidery along the yoke and cuffs. Finished with soft breathable lining for royal festive elegance.',
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
        market_value: 1899.00,
        options: {
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: ['Royal Wine', 'Rose Gold', 'Dusty Teal']
        },
        display_order: 3
      }
    ];

    const insertedGifts = [];
    for (const g of giftsData) {
      const res = await client.query(
        `INSERT INTO gifts (name, category, tagline, description, image_url, market_value, options, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, category, market_value`,
        [g.name, g.category, g.tagline, g.description, g.image_url, g.market_value, JSON.stringify(g.options), g.display_order]
      );
      insertedGifts.push(res.rows[0]);
    }
    console.log(`✅ Seeded ${insertedGifts.length} guaranteed apparel gifts.`);

    // 3. Seed Tournaments (Challenges)
    const tournamentsData = [
      {
        title: 'iPhone 16 Pro Max 256GB Titanium',
        slug: 'iphone-16-pro-max-titanium',
        category: 'Smartphones & Flagships',
        badge_text: 'OFFICIAL OFFICIAL PARTNER HUB',
        banner_tag: '5-Day Skill Mega Challenge',
        description: 'Compete in the retro Snake challenge to win the 100% brand sealed iPhone 16 Pro Max Titanium 256GB! Fair play with transparent live leaderboard.',
        specifications: [
          '6.9-inch Super Retina XDR OLED Display with 120Hz ProMotion',
          'Apple A18 Pro Chip with 6-core GPU & Apple Intelligence Support',
          '48MP Fusion Camera + 5x Telephoto Optical Zoom with Anti-Reflective lens',
          'Grade 5 Aerospace-Grade Titanium frame with Textured Matte Glass back',
          'Up to 33 hours video playback & MagSafe fast wireless charging'
        ],
        whats_in_box: [
          'Factory Sealed Unit of iPhone 16 Pro Max 256GB',
          'USB-C Charge Cable (1m woven)',
          'Official Brand Tax Invoice & 1-Year Apple Warranty',
          'WinArena Verified Winner Certificate',
          'Your Chosen Guaranteed Apparel Gift (Dispatched via courier)'
        ],
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
        gallery_urls: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=900&auto=format&fit=crop&q=80'
        ],
        entry_fee: 1000.00,
        retail_price: 149900.00,
        total_slots: 500,
        slots_filled: 280,
        rating: 5.0,
        ratings_count: 1,
        status: 'ACTIVE',
        start_time: new Date(),
        end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Kawasaki Ninja ZX-10R Superbike',
        slug: 'kawasaki-ninja-zx-10r',
        category: 'Superbikes',
        badge_text: 'OFFICIAL OFFICIAL PARTNER HUB',
        banner_tag: 'High-Octane 5-Day Arena',
        description: 'Feel the 203 PS inline-four adrenaline! Compete in the Snake skill arena and top the national leaderboard to claim the Kawasaki Ninja ZX-10R.',
        specifications: [
          '998 cc Liquid-Cooled 4-stroke In-Line Four Engine',
          '203 PS Peak Power @ 13,200 rpm with Ram Air',
          'Brembo Stylema Monobloc Calipers with 330mm Dual Discs',
          'Kawasaki Cornering Management Function (KCMF) & Launch Control'
        ],
        whats_in_box: [
          'Brand New Kawasaki Ninja ZX-10R with On-Road Registration Docs',
          'Official Kawasaki Manufacturer Warranty',
          'WinArena Superbike Champion Certificate',
          'Your Chosen Guaranteed Apparel Gift (Dispatched via courier)'
        ],
        image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&auto=format&fit=crop&q=80',
        gallery_urls: [
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&auto=format&fit=crop&q=80'
        ],
        entry_fee: 1000.00,
        retail_price: 1680000.00,
        total_slots: 1000,
        slots_filled: 742,
        rating: 4.9,
        ratings_count: 12,
        status: 'ACTIVE',
        start_time: new Date(),
        end_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Sony PlayStation 5 Pro 2TB Gaming Bundle',
        slug: 'sony-ps5-pro-bundle',
        category: 'PS5 & Gaming',
        badge_text: 'OFFICIAL OFFICIAL PARTNER HUB',
        banner_tag: 'Next-Gen Console Tournament',
        description: 'Next-gen ray tracing, 4K 120 FPS high fidelity, DualSense Wireless controller + 2 Blockbuster games included.',
        specifications: [
          'PlayStation Spectral Super Resolution (PSSR) AI-driven upscaling',
          '2TB Ultra-High Speed NVMe Solid State Drive',
          'Advanced Ray Tracing & 4K 120Hz Output Support',
          'DualSense Wireless Controller with Haptic Feedback & Adaptive Triggers'
        ],
        whats_in_box: [
          'Sony PlayStation 5 Pro Console (2TB SSD)',
          'DualSense Wireless Controller',
          'HDMI 2.1 Ultra High Speed Cable',
          'WinArena Official Gaming Trophy',
          'Your Chosen Guaranteed Apparel Gift (Dispatched via courier)'
        ],
        image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=900&auto=format&fit=crop&q=80',
        gallery_urls: [
          'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=900&auto=format&fit=crop&q=80'
        ],
        entry_fee: 1000.00,
        retail_price: 68900.00,
        total_slots: 300,
        slots_filled: 245,
        rating: 5.0,
        ratings_count: 8,
        status: 'ACTIVE',
        start_time: new Date(),
        end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Ducati Panigale V4 S Edition',
        slug: 'ducati-panigale-v4-s',
        category: 'Superbikes',
        badge_text: 'WINNER DECLARED • CONTEST ENDED',
        banner_tag: 'Hall of Fame Completed Challenge',
        description: 'Tournament concluded! Declared Champion has been awarded the superbike with on-road registration.',
        specifications: [
          '1,103 cc Desmosedici Stradale 90° V4 Engine with Counter-Rotating Crankshaft',
          'Öhlins Smart EC 2.0 Electronic Suspension System',
          'Full Carbon Fiber aero winglets producing 37 kg downforce @ 270 km/h'
        ],
        whats_in_box: [
          'Factory Spec Ducati Panigale V4 S',
          'Ducati Riding Suit & Carbon Helmet',
          'WinArena Hall of Fame Shield'
        ],
        image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&auto=format&fit=crop&q=80',
        gallery_urls: [
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&auto=format&fit=crop&q=80'
        ],
        entry_fee: 1000.00,
        retail_price: 2650000.00,
        total_slots: 500,
        slots_filled: 500,
        rating: 5.0,
        ratings_count: 24,
        status: 'CONCLUDED',
        winner_name: 'Rahul Sharma (Declared Champion 👑)',
        winner_score: 1420,
        start_time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    const insertedTournaments = [];
    for (const t of tournamentsData) {
      const res = await client.query(
        `INSERT INTO tournaments (
          title, slug, category, badge_text, banner_tag, description, specifications, whats_in_box,
          image_url, gallery_urls, entry_fee, retail_price, total_slots, slots_filled, rating,
          ratings_count, status, winner_name, winner_score, start_time, end_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id, title, slug, status`,
        [
          t.title, t.slug, t.category, t.badge_text, t.banner_tag, t.description,
          JSON.stringify(t.specifications), JSON.stringify(t.whats_in_box),
          t.image_url, JSON.stringify(t.gallery_urls), t.entry_fee, t.retail_price,
          t.total_slots, t.slots_filled, t.rating, t.ratings_count, t.status,
          t.winner_name || null, t.winner_score || 0, t.start_time, t.end_time
        ]
      );
      insertedTournaments.push(res.rows[0]);
    }
    console.log(`✅ Seeded ${insertedTournaments.length} tournaments.`);

    // 4. Seed Dynamic Game Settings
    await client.query(
      `INSERT INTO game_settings (
        setting_key, base_speed, min_speed, acceleration_step, golden_apple_chance,
        golden_apple_points, normal_apple_points, golden_apple_duration_sec, board_size
      ) VALUES ('default', 110, 40, 3, 0.25, 50, 10, 7, 20)
      ON CONFLICT (setting_key) DO NOTHING`
    );
    console.log('✅ Seeded dynamic game settings.');

    // 5. Seed sample orders and tournament entries for the test player
    const testUser = insertedUsers.find(u => u.email === 'test@winarena.com');
    const rahulUser = insertedUsers.find(u => u.email === 'rahul@winarena.com');
    const priyaUser = insertedUsers.find(u => u.email === 'priya@winarena.com');
    const adityaUser = insertedUsers.find(u => u.email === 'aditya@winarena.com');

    const iphoneTournament = insertedTournaments.find(t => t.slug === 'iphone-16-pro-max-titanium');
    const tshirtGift = insertedGifts.find(g => g.category === 'T-Shirt');

    // Create order for test user
    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, user_id, tournament_id, gift_id, gift_name, gift_category, gift_image,
        selected_size, selected_color, shipping_name, shipping_phone, shipping_address, shipping_city,
        shipping_state, shipping_pincode, amount_paid, payment_method, payment_txn_id, payment_status,
        fulfillment_status, courier_partner, tracking_number, tracking_timeline
      ) VALUES (
        'WA-ORD-849201', $1, $2, $3, $4, $5, $6,
        'M', 'Charcoal Black', 'test (PLAYER)', '+91 9884011223', '32 Lakeview Avenue, Nungambakkam', 'Chennai',
        'Tamil Nadu', '600020', 1000.00, 'UPI (GPay)', 'UPI-TXN-998822001', 'VERIFIED',
        'DISPATCHED', 'BlueDart Express', 'BLUEDART-IND-7782918',
        $7
      ) RETURNING id`,
      [
        testUser.id,
        iphoneTournament.id,
        tshirtGift.id,
        tshirtGift.name,
        tshirtGift.category,
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        JSON.stringify([
          { status: 'Order Placed', timestamp: new Date(Date.now() - 36 * 3600 * 1000), location: 'Chennai Fulfillment Hub', note: 'Guaranteed reward allocated upon ₹1,000 entry' },
          { status: 'Packed & QC Passed', timestamp: new Date(Date.now() - 24 * 3600 * 1000), location: 'Chennai Warehouse #3', note: 'Custom packaging with barcode verification' },
          { status: 'Dispatched with Courier', timestamp: new Date(Date.now() - 12 * 3600 * 1000), location: 'BlueDart Air Hub', note: 'AWB: BLUEDART-IND-7782918. In transit to destination.' }
        ])
      ]
    );

    // Create tournament entries & scores for leaderboard
    await client.query(
      `INSERT INTO tournament_entries (tournament_id, user_id, order_id, high_score, games_played, last_played_at)
       VALUES
       ($1, $2, $3, 890, 12, NOW() - INTERVAL '2 hours'),
       ($1, $4, NULL, 1140, 18, NOW() - INTERVAL '1 hour'),
       ($1, $5, NULL, 970, 9, NOW() - INTERVAL '3 hours'),
       ($1, $6, NULL, 730, 5, NOW() - INTERVAL '5 hours')`,
      [iphoneTournament.id, testUser.id, orderRes.rows[0].id, rahulUser.id, priyaUser.id, adityaUser.id]
    );
    console.log('✅ Seeded sample verified orders and tournament leaderboard entries.');

    console.log('🎉 Seed completed successfully!');
  } catch (err) {
    console.error('Error during database seed:', err);
    throw err;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
