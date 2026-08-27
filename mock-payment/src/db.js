'use strict';

const { Pool } = require('pg');
const { config } = require('./config');

let pool = null;

function getPool() {
  if (pool) return pool;
  if (!config.databaseUrl) return null;
  pool = new Pool({ connectionString: config.databaseUrl });
  pool.on('error', (err) => {
    console.error('[mock-payment] Erreur pool PG:', err.message);
  });
  return pool;
}

async function ensureSchema() {
  const p = getPool();
  if (!p) return false;
  const ddl = `
    CREATE TABLE IF NOT EXISTS mock_transactions (
      transaction_id    UUID PRIMARY KEY,
      reference_externe VARCHAR(64) NOT NULL,
      status            VARCHAR(16) NOT NULL,
      scenario          VARCHAR(16) NOT NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      webhook_sent_at   TIMESTAMPTZ
    );
  `;
  await p.query(ddl);
  return true;
}

async function insertMockTransaction({ transactionId, referenceExterne, status, scenario }) {
  const p = getPool();
  if (!p) return false;
  await p.query(
    `INSERT INTO mock_transactions (transaction_id, reference_externe, status, scenario)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (transaction_id) DO NOTHING`,
    [transactionId, referenceExterne, status, scenario]
  );
  return true;
}

async function getMockTransaction(transactionId) {
  const p = getPool();
  if (!p) return null;
  const r = await p.query(
    `SELECT transaction_id, reference_externe, status, scenario, created_at, webhook_sent_at
     FROM mock_transactions WHERE transaction_id = $1`,
    [transactionId]
  );
  return r.rows[0] || null;
}

async function markWebhookSent(transactionId) {
  const p = getPool();
  if (!p) return false;
  await p.query(
    `UPDATE mock_transactions SET webhook_sent_at = NOW() WHERE transaction_id = $1`,
    [transactionId]
  );
  return true;
}

module.exports = {
  getPool,
  ensureSchema,
  insertMockTransaction,
  getMockTransaction,
  markWebhookSent,
};
