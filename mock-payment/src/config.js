'use strict';

require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '4001', 10),
  webhookSecret: process.env.MOCK_WEBHOOK_SECRET,
  backendWebhookUrl: process.env.BACKEND_WEBHOOK_URL,
  webhookDelayMs: parseInt(process.env.WEBHOOK_DELAY_MS || '1500', 10),
  databaseUrl: process.env.DATABASE_URL || null,
};

function assertConfig() {
  const missing = [];
  if (!config.webhookSecret) missing.push('MOCK_WEBHOOK_SECRET');
  if (!config.backendWebhookUrl) missing.push('BACKEND_WEBHOOK_URL');
  if (missing.length) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}. ` +
      'Copiez .env.example vers .env et complétez-le.'
    );
  }
}

module.exports = { config, assertConfig };
