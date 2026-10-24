const db = require('./db');

async function checkCols() {
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
    `);

    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Users columns:', res.rows.map(r => r.column_name));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCols();
