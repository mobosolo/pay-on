const STATUS_MESSAGES = {
  400: "Les informations saisies sont incomplètes ou invalides.",
  401: "Votre session ou votre identité est requise pour continuer.",
  403: "Vous n'avez pas les droits nécessaires pour cette action.",
  404: "La ressource demandée n'existe pas.",
  409: "Cette action n'est pas possible dans l'état actuel.",
  500: "Le service rencontre un problème. Réessayez dans un instant.",
};

export function getReadableError(error) {
  const match = error?.message?.match(/^API (\d+)/);
  return (
    STATUS_MESSAGES[match ? Number(match[1]) : null] ??
    "Une erreur est survenue. Réessayez."
  );
}

export function getTechnicalError(error) {
  return error?.message ?? "Erreur inconnue";
}

export function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div className="feedback-error" role="alert">
      <p className="state-error">{getReadableError(error)}</p>
      <details>
        <summary>Détail technique</summary>
        <code>{getTechnicalError(error)}</code>
      </details>
    </div>
  );
}

export const CREATED_EVENTS_KEY = "payon:created-events:v1";

export function readCreatedEvents() {
  try {
    const raw = window.localStorage.getItem(CREATED_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCreatedEvent(event) {
  const events = readCreatedEvents().filter((item) => item.id !== event.id);
  window.localStorage.setItem(
    CREATED_EVENTS_KEY,
    JSON.stringify([event, ...events]),
  );
}
