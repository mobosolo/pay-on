import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section>
      <h1 className="page-title">404 — écran introuvable</h1>
      <p>
        <Link to="/">Retour à l'accueil</Link>
      </p>
    </section>
  );
}
