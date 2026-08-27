import { apiFetch } from './client.js';
import { mocks, mockDelay } from './mock.js';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

export async function getEventProducts(eventId, { statut } = {}) {
  if (USE_MOCK) {
    const filtered = statut ? mocks.produits.filter((p) => p.statut === statut) : mocks.produits;
    return mockDelay(filtered);
  }
  const qs = statut ? `?statut=${encodeURIComponent(statut)}` : '';
  return apiFetch(`/api/events/${eventId}/produits${qs}`);
}

export async function createVendorOrder(payload) {
  if (USE_MOCK) {
    return mockDelay({ transaction_id: 'tx_demo', commande_id: 'cmd_demo', statut: 'en_attente', montant_total: 8000 });
  }
  return apiFetch('/api/vendeur/commandes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
