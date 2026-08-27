import { Link } from "react-router-dom";
import { listEvents } from "../../api/events.js";
import { readCreatedEvents } from "../../utils/feedback.jsx";
import { useEffect, useState } from "react";
import { ErrorMessage } from "../../utils/feedback.jsx";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    listEvents().then(setEvents).catch(setError);
  }, []);
  const createdEvents = readCreatedEvents();
  return (
    <section className="home-screen">
      <p className="home-kicker">PAY-ON</p>
      <h1 className="page-title">Votre prochaine expérience commence ici.</h1>
      <p className="page-subtitle">
        Billetterie événementielle, accès et participation réunis au même
        endroit.
      </p>
      <ErrorMessage error={error} />
      <section className="created-events">
        <h2>Événements à venir</h2>
        {events.length === 0 ? (
          <p className="muted-copy">Aucun événement publié pour le moment.</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.titre}</strong>
                <span>
                  {event.lieu_nom}, {event.ville}
                </span>
                <Link to={`/events/${event.id}/tiers`}>Voir les billets</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="created-events">
        <h2>Vos événements récents</h2>
        {createdEvents.length === 0 ? (
          <p className="muted-copy">Aucun événement créé sur cet appareil.</p>
        ) : (
          <ul>
            {createdEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.titre}</strong>
                <code>{event.id}</code>
                <Link to={`/events/${event.id}/tiers`}>Ouvrir</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
