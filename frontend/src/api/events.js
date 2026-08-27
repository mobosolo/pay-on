import { apiFetch } from "./client.js";

export async function createEvent(payload) {
  return apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function publishEvent(eventId, organizerId) {
  return apiFetch(`/api/events/${eventId}/publish`, {
    method: "PATCH",
    headers: { "x-user-id": organizerId },
    body: JSON.stringify({}),
  });
}

export async function createTier(eventId, payload, organizerId) {
  return apiFetch(`/api/events/${eventId}/tiers`, {
    method: "POST",
    headers: { "x-user-id": organizerId },
    body: JSON.stringify(payload),
  });
}

export async function createVoteOption(eventId, payload, organizerId) {
  return apiFetch(`/api/events/${eventId}/vote-options`, {
    method: "POST",
    headers: { "x-user-id": organizerId },
    body: JSON.stringify(payload),
  });
}
