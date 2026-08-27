'use strict';

const express = require('express');
const { config, assertConfig } = require('./config');
const { ensureSchema } = require('./db');
const paymentsRouter = require('./routes');

async function main() {
  assertConfig();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'mock-payment' }));
  app.use('/mock/payments', paymentsRouter);

  // Tentative de connexion DB — non bloquante, mode dégradé si échec.
  let dbOk = false;
  try {
    dbOk = await ensureSchema();
    if (dbOk) console.log('[mock-payment] Table mock_transactions prête.');
  } catch (err) {
    console.warn(`[mock-payment] DB indisponible (${err.message}). Démarrage en mode dégradé — la persistance mock est désactivée mais les webhooks fonctionnent.`);
  }

  app.listen(config.port, () => {
    console.log(`[mock-payment] Service mock en écoute sur http://localhost:${config.port}`);
    console.log(`[mock-payment] Webhook cible: ${config.backendWebhookUrl}`);
    if (!dbOk) {
      console.warn('[mock-payment] [!] Mode dégradé: pas de persistance mock_transactions.');
    }
  });
}

main().catch((err) => {
  console.error('[mock-payment] Démarrage impossible:', err);
  process.exit(1);
});
