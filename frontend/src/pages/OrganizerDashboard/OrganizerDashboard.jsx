import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventStats } from "../../api/stats.js";
import { USER_IDS } from "../../api/config.js";

export default function OrganizerDashboard() {
  const { eventId } = useParams();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    getEventStats(eventId, USER_IDS.organizer)
      .then(setStats)
      .catch((e) => setError(e.message));
  }, [eventId]);
  return (
    <section>
      <h1 className="page-title">Dashboard organisateur</h1>
      <p className="page-subtitle">Événement : {eventId}</p>
      {error && <p className="state-error">Erreur : {error}</p>}
      {!stats && !error && (
        <p className="state-info">Chargement des statistiques...</p>
      )}
      {stats && (
        <>
          <p>
            Revenus :{" "}
            <strong>
              {stats.revenus.total} {stats.revenus.devise}
            </strong>
          </p>
          <p>
            Billets scannés : {stats.billets.scannes} · non scannés :{" "}
            {stats.billets.non_scannes}
          </p>
          <h2>Ventes par tier</h2>
          <ul>
            {stats.ventes_par_tier.map((tier) => (
              <li key={tier.tier_id}>
                {tier.nom} : {tier.quantite_vendue} vendu(s), {tier.revenus} XOF
              </li>
            ))}
          </ul>
          <h2>Stock produits</h2>
          <ul>
            {stats.stock_produits.map((product) => (
              <li key={product.produit_id}>
                {product.nom} : {product.stock} ({product.statut})
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
