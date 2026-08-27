import { apiFetch } from './client.js';
import { mocks, mockDelay } from './mock.js';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

export async function submitVote(payload) {
  if (USE_MOCK) return mockDelay(mocks.voteResult);
  return apiFetch('/api/votes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getVoteOptions(eventId) {
  if (USE_MOCK) return mockDelay([]);
  return apiFetch(`/api/events/${eventId}/vote-options`);
}
