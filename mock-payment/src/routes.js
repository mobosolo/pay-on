'use strict';

const express = require('express');
const crypto = require('crypto');
const { config } = require('./config');
const { insertMockTransaction, getMockTransaction } = require('./db');
const { buildWebhookPayload, sendWebhook } = require('./webhook');

const router = express.Router();

const VALID_SCENARIOS = new Set(['success', 'failure', 'pending']);

// POST /mock/payments/initiate
router.post('/initiate', async (req, res) => {
  const { transaction_id, event_id, amount_total, currency, scenario } = req.body || {};

  if (!transaction_id || !event_id || amount_total == null || !currency) {
    return res.status(400).json({
      error: 'Champs requis manquants',
      required: ['transaction_id', 'event_id', 'amount_total', 'currency'],
    });
  }
  if (scenario && !VALID_SCENARIOS.has(scenario)) {
    return res.status(400).json({
      error: 'scenario invalide',
      allowed: [...VALID_SCENARIOS],
    });
  }
  // UUID v1-5 basique (juste un sanity check de forme, pas une validation stricte).
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidLike.test(transaction_id) || !uuidLike.test(event_id)) {
    return res.status(400).json({ error: 'transaction_id et event_id doivent être des UUID' });
  }

  const effectiveScenario = scenario || 'success';
  const referenceExterne = `pg_ref_${crypto.randomUUID()}`;
  const status = effectiveScenario === 'success' ? 'succes' : effectiveScenario === 'failure' ? 'echec' : 'en_attente';

  // Persistance (best-effort, le service continue si la DB est down).
  try {
    await insertMockTransaction({
      transactionId: transaction_id,
      referenceExterne,
      status,
      scenario: effectiveScenario,
    });
  } catch (err) {
    console.error('[mock-payment] Persistance KO:', err.message);
  }

  // Émission webhook différée (sauf pending où on n'émet rien — spec §4).
  if (effectiveScenario !== 'pending') {
    const failureReason = effectiveScenario === 'failure' ? 'Simulated failure (scenario=failure)' : null;
    setTimeout(async () => {
      const payload = buildWebhookPayload({
        transactionId: transaction_id,
        referenceExterne,
        eventId: event_id,
        status: effectiveScenario === 'success' ? 'success' : 'failed',
        amountTotal: amount_total,
        currency,
        failureReason,
      });
      const result = await sendWebhook(payload);
      if (!result.ok) {
        console.error(`[mock-payment] Échec envoi webhook pour ${transaction_id}: ${result.error}`);
      } else {
        console.log(`[mock-payment] Webhook ${effectiveScenario === 'success' ? 'success' : 'failed'} envoyé pour ${transaction_id} → HTTP ${result.httpStatus} ${JSON.stringify(result.body)}`);
      }
    }, config.webhookDelayMs);
  } else {
    console.log(`[mock-payment] scenario=pending: aucun webhook émis pour ${transaction_id} (valide la règle §1 du contrat)`);
  }

  return res.status(201).json({
    transaction_id,
    reference_externe: referenceExterne,
    status,
    scenario: effectiveScenario,
    provider: 'mock',
  });
});

// POST /mock/payments/webhook
// NOTE : cette route est définie ici par SYMÉTRIE avec la spec (les 3 routes
// du contrat §4). En exploitation réelle elle n'est pas appelée : c'est CE
// service qui ÉMET le webhook vers le back-end (POST /api/webhooks/paiement),
// pas l'inverse. Cette route sert uniquement de récepteur de test si quelqu'un
// veut pinguer le mock pour vérifier qu'il écoute.
router.post('/webhook', (req, res) => {
  console.warn('[mock-payment] /mock/payments/webhook appelé — ce service émet les webhooks, il ne les reçoit pas. Route ignorée.');
  return res.status(200).json({ received: true, note: 'mock émet, ne reçoit pas' });
});

// GET /mock/payments/:transaction_id/status
router.get('/:transaction_id/status', async (req, res) => {
  const { transaction_id } = req.params;
  let row = null;
  try {
    row = await getMockTransaction(transaction_id);
  } catch (err) {
    console.error('[mock-payment] Lecture DB KO:', err.message);
  }
  if (!row) {
    return res.status(404).json({ error: 'transaction inconnue du mock' });
  }
  return res.status(200).json({
    transaction_id: row.transaction_id,
    reference_externe: row.reference_externe,
    status: row.status,
    scenario: row.scenario,
    webhook_sent_at: row.webhook_sent_at,
    created_at: row.created_at,
  });
});

module.exports = router;
