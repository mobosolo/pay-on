import { apiFetch } from "./client.js";

export function getEventStats(eventId, userId) {
  return apiFetch(`/api/events/${eventId}/stats`, {
    headers: { "x-user-id": userId },
  });
}
