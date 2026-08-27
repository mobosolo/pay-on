import { Link } from "react-router-dom";
import { DEMO_EVENT_ID } from "../../api/demo.js";

export default function Home() {
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
    </section>
  );
}
