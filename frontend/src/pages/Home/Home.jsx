import { Link } from "react-router-dom";
import { DEMO_EVENT_ID } from "../../api/demo.js";
import { readCreatedEvents } from "../../utils/feedback.jsx";
import { useEffect, useState } from "react";

export default function Home() {
  const [events, setEvents] = useState([]);
  useEffect(() => setEvents(readCreatedEvents()), []);
  return (
    <section className="home-screen">
      <p className="home-kicker">PAY-ON</p>
      <h1 className="page-title">Votre prochaine expérience commence ici.</h1>
      <p className="page-subtitle">
        Billetterie événementielle, accès et participation réunis au même
        endroit.
      </p>
      {DEMO_EVENT_ID ? (
        <Link className="home-cta" to={`/events/${DEMO_EVENT_ID}/tiers`}>
          Voir l'événement de démonstration
        </Link>
      ) : (
        <p className="state-info">Aucun événement n'est encore sélectionné.</p>
      )}
      <section className="created-events">
        <h2>Vos événements récents</h2>
        {events.length === 0 ? (
          <p className="muted-copy">Aucun événement créé sur cet appareil.</p>
        ) : (
          <ul>
            {events.map((event) => (
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
