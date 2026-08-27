// Fixtures — retournées tant que VITE_USE_MOCK=true.
// Ces payloads suivent le contrat de CONTRACTS.md sections 3-5.

const MOCK = {
  tiers: [
    {
      id: 'tier_std',
      nom: 'Standard',
      prix: 5000,
      devise: 'XOF',
      quantite_totale: 200,
      quantite_vendue: 12,
      quantite_disponible: 188,
      ventes_debut: '2026-09-01T00:00:00Z',
      ventes_fin: '2026-12-31T23:59:59Z',
      is_active: true,
      description: 'Accès général à l\'événement',
    },
    {
      id: 'tier_vip',
      nom: 'VIP',
      prix: 15000,
      devise: 'XOF',
      quantite_totale: 50,
      quantite_vendue: 3,
      quantite_disponible: 47,
      ventes_debut: '2026-09-01T00:00:00Z',
      ventes_fin: '2026-12-31T23:59:59Z',
      is_active: true,
      description: 'Accès tribune VIP + catering',
    },
    {
      id: 'tier_back',
      nom: 'Backstage',
      prix: 30000,
      devise: 'XOF',
      quantite_totale: 10,
      quantite_vendue: 0,
      quantite_disponible: 10,
      ventes_debut: '2026-09-01T00:00:00Z',
      ventes_fin: '2026-12-31T23:59:59Z',
      is_active: true,
      description: 'Accès backstage + meet & greet',
    },
  ],

  produits: [
    { id: 'prod_tee', vendeur_user_id: 'usr_v1', nom: 'T-shirt event', description: 'Coton bio', prix: 8000, devise: 'XOF', stock: 50, statut: 'live' },
    { id: 'prod_aft', vendeur_user_id: 'usr_v1', nom: 'After-party', description: 'Accès + 1 drink', prix: 12000, devise: 'XOF', stock: 100, statut: 'live' },
  ],

  qrCode: { billet_id: 'billet_demo', qr_code: 'PAYON-QR-billet_demo-XXXXX', statut: 'valide' },

  scanResult: { billet_id: 'billet_demo', statut: 'scanne', tier_nom: 'Standard', scanned_at: new Date().toISOString() },

  voteResult: { vote_id: 'vote_demo', event_id: 'demo', vote_option_id: 'opt_a', created_at: new Date().toISOString() },

  // Trois scénarios de paiement — section 3 #4 + section 4 du CONTRACTS.md.
  // Pilotés via VITE_MOCK_PAYMENT_SCENARIO ou par défaut `success` (cf. mockPaymentScenario).
  transactionSuccess: {
    transaction_id: 'tx_demo_success',
    statut: 'en_attente',
    billets: [{ id: 'billet_demo' }],
    montant_total: 10000,
    paiement_url_ou_ref: 'pg_ref_success',
    _scenario: 'success',
    _qr_code: 'PAYON-QR-billet_demo-XXXXX',
  },
  transactionPending: {
    transaction_id: 'tx_demo_pending',
    statut: 'en_attente',
    billets: [{ id: 'billet_demo' }],
    montant_total: 10000,
    paiement_url_ou_ref: 'pg_ref_pending',
    _scenario: 'pending',
    _qr_code: null,
  },
  transactionFailure: {
    transaction_id: 'tx_demo_failure',
    statut: 'echec',
    billets: [],
    montant_total: 0,
    paiement_url_ou_ref: null,
    _scenario: 'failure',
    _failure_reason: 'Fonds insuffisants (simulation mock)',
  },
};

// Scénario de paiement pilotable via .env (VITE_MOCK_PAYMENT_SCENARIO)
// ou via sessionStorage['payon:payment-scenario'] (modifiable dans DevTools).
export function mockPaymentScenario() {
  const fromStorage = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('payon:payment-scenario')
    : null;
  const fromEnv = import.meta.env.VITE_MOCK_PAYMENT_SCENARIO;
  const raw = (fromStorage || fromEnv || 'success').toLowerCase();
  if (raw === 'pending' || raw === 'waiting') return 'pending';
  if (raw === 'failure' || raw === 'failed' || raw === 'error') return 'failure';
  return 'success';
}

export function getMockTransaction() {
  switch (mockPaymentScenario()) {
    case 'pending':
      return MOCK.transactionPending;
    case 'failure':
      return MOCK.transactionFailure;
    case 'success':
    default:
      return MOCK.transactionSuccess;
  }
}

export function mockDelay(payload, ms = 200) {
  return new Promise((resolve) => setTimeout(() => resolve(payload), ms));
}

export const mocks = MOCK;