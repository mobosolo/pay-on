import { apiFetch } from "./client.js";
import { mocks, mockDelay } from "./mock.js";
import { DEMO_EVENT_ID } from "./demo.js";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

const mockEvents = new Map();

export async function listEvents() {
  if (USE_MOCK) {
    const demoEvents = [
      {
        id: DEMO_EVENT_ID || "demo-event",
        titre: "Événement PAY-ON",
        description: "Billetterie, accès et participation au même endroit.",
        statut: "publie",
        lieu_nom: "Lieu de démonstration",
        ville: "Abidjan",
        date_debut: "2026-12-19T18:00:00Z",
        date_fin: "2026-12-20T02:00:00Z",
      },
    ];
    return mockDelay(
      [...demoEvents, ...mockEvents.values()].filter(
        (event) => event.statut === "publie",
      ),
    );
  }
  return apiFetch("/api/events?statut=publie");
}

export async function createEvent(payload) {
  if (USE_MOCK) {
    const id = globalThis.crypto?.randomUUID?.() || `demo-event-${Date.now()}`;
    const event = { id, ...payload, statut: "brouillon" };
    mockEvents.set(id, { ...event, tiers: [], options: [] });
    return mockDelay(event);
  }
  return apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function publishEvent(eventId, organizerId) {
  if (USE_MOCK) {
    const event = mockEvents.get(eventId);
    if (!event) throw new Error("Événement mock introuvable");
    event.statut = "publie";
    return mockDelay({ id: eventId, statut: event.statut });
  }
  return apiFetch(`/api/events/${eventId}/publish`, {
    method: "PATCH",
    headers: { "x-user-id": organizerId },
    body: JSON.stringify({}),
  });
}

export async function createTier(eventId, payload, organizerId) {
  if (USE_MOCK) {
    const event = mockEvents.get(eventId);
    if (!event) throw new Error("Événement mock introuvable");
    const tier = {
      id: globalThis.crypto?.randomUUID?.() || `tier-${Date.now()}`,
      event_id: eventId,
      quantite_vendue: 0,
      ...payload,
    };
    event.tiers.push(tier);
    return mockDelay(tier);
  }
  return apiFetch(`/api/events/${eventId}/tiers`, {
    method: "POST",
    headers: { "x-user-id": organizerId },
    body: JSON.stringify(payload),
  });
}

export async function createVoteOption(eventId, payload, organizerId) {
  if (USE_MOCK) {
    const event = mockEvents.get(eventId);
    if (!event) throw new Error("Événement mock introuvable");
    const option = {
      id: globalThis.crypto?.randomUUID?.() || `option-${Date.now()}`,
      event_id: eventId,
      ...payload,
    };
    event.options.push(option);
    return mockDelay(option);
  }
  return apiFetch(`/api/events/${eventId}/vote-options`, {
    method: "POST",
    headers: { "x-user-id": organizerId },
    body: JSON.stringify(payload),
  });
}
