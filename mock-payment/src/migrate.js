'use strict';

// Script one-shot pour créer la table mock_transactions.
// Utile quand on veut provisionner sans démarrer le serveur (CI, ops).
const { ensureSchema } = require('./db');

ensureSchema()
  .then((ok) => {
    if (ok) {
      console.log('[mock-payment] Table mock_transactions créée / vérifiée.');
      process.exit(0);
    } else {
      console.error('[mock-payment] DATABASE_URL non défini — abandon.');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('[mock-payment] Migration échouée:', err.message);
    process.exit(1);
  });
