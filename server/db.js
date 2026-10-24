const { Pool } = require('pg');
require('dotenv').config();

const getSSLConfig = () => {
  if (!process.env.DATABASE_URL) return false;
  if (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) {
    return false;
  }
  // Render internal network hosts (dpg-...:5432) do NOT support SSL
  if (/@dpg-[a-z0-9]+(-a)?(:|\/)/i.test(process.env.DATABASE_URL) && !process.env.DATABASE_URL.includes('.render.com')) {
    return false;
  }
  // External cloud hosts require SSL
  return { rejectUnauthorized: false };
};

const sslConfig = getSSLConfig();

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(sslConfig ? { ssl: sslConfig } : {}),
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '!Pass@0123',
      database: process.env.DB_NAME || 'ChallengeDB',
    };

const pool = new Pool({
  ...connectionConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
