'use strict';

const axios = require('axios');
const { config } = require('./config');
const { signPayload } = require('./signature');
const { markWebhookSent } = require('./db');

// Construit le payload EXACTEMENT conforme au contrat canonique CONTRACTS.md §4.
// Ne dérive JAMAIS de ce schéma — c'est la spec qui fige la bascule Paygate.
function buildWebhookPayload({
  transactionId,
  referenceExterne,
  eventId,
  status,
  amountTotal,
  currency,
  failureReason = null,
  split = { organisateur: 0, vendeur: 0, plateforme: 0, note: 'calculé selon split_config, taux provisoires' },
}) {
  return {
    transaction_id: transactionId,
    reference_externe: referenceExterne,
    event_id: eventId,
    status,
    amount_total: amountTotal,
    currency,
    split,
    failure_reason: failureReason,
    provider: 'mock',
    timestamp: new Date().toISOString(),
  };
}

async function sendWebhook(payload) {
  // Contrat v1.1 : UNE seule sérialisation (sans champ signature), HMAC-SHA256
  // calculé sur ce corps brut exact, transmis dans le header X-Signature.
  // Le body part tel quel sur le réseau — jamais de re-sérialisation.
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(rawBody, config.webhookSecret);

  try {
    const response = await axios.post(config.backendWebhookUrl, rawBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      timeout: 10000,
    });
    await markWebhookSent(payload.transaction_id);
    return { ok: true, httpStatus: response.status, body: response.data };
  } catch (err) {
    return {
      ok: false,
      error: err.response ? `HTTP ${err.response.status}` : err.message,
    };
  }
}

module.exports = { buildWebhookPayload, sendWebhook };
