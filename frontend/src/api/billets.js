import { apiFetch } from "./client.js";
import {
  mocks,
  mockDelay,
  getMockTransaction,
  mockPaymentScenario,
} from "./mock.js";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

export async function getEventTiers(eventId) {
  if (USE_MOCK) return mockDelay(mocks.tiers);
  return apiFetch(`/api/events/${eventId}/tiers`);
}

export async function createBilletOrder(payload) {
  if (USE_MOCK) {
    const tx = getMockTransaction();
    return mockDelay(tx, 600);
  }
  return apiFetch("/api/billets/commandes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getBilletQrCode(billetId) {
  if (USE_MOCK) {
    const tx = getMockTransaction();
    return mockDelay({
      billet_id: billetId,
      qr_code: tx._qr_code,
      statut:
        tx._scenario === "success"
          ? "valide"
          : tx._scenario === "pending"
            ? "en_attente"
            : "annule",
    });
  }
  return apiFetch(`/api/billets/${billetId}/qrcode`);
}

export async function scanBillet(payload) {
  if (USE_MOCK) return mockDelay(mocks.scanResult);
  return apiFetch("/api/billets/scan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function currentMockPaymentScenario() {
  return mockPaymentScenario();
}
