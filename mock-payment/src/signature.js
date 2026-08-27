'use strict';

const crypto = require('crypto');

// Signature HMAC-SHA256 sur le corps brut (Buffer ou string) du webhook.
// Reproduit EXACTEMENT la fonction verifyWebhookSignature du back-end
// (CONTRACTS.md §4) — la spec exige que les deux côtés calculent sur le raw body.
function signPayload(rawBody, secret) {
  const buf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  return crypto.createHmac('sha256', secret).update(buf).digest('hex');
}

module.exports = { signPayload };
