import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getEventTiers } from "../../api/billets.js";
import { useCart } from "../../state/CartContext.jsx";
import { formatMoney } from "../../utils/format.js";
import "./OrderSummary.css";
import { ErrorMessage } from "../../utils/feedback.jsx";

export default function OrderSummary() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { cart, totalItems } = useCart();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEventTiers(eventId)
      .then((data) => {
        if (!cancelled) setTiers(data);
      })
      .catch((requestError) => setError(requestError))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const lines = useMemo(() => {
    return tiers
      .map((t) => ({ tier: t, qty: cart[t.id] ?? 0 }))
      .filter((l) => l.qty > 0);
  }, [tiers, cart]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.tier.prix * l.qty, 0),
    [lines],
  );

  const fees = 0;
  const total = subtotal + fees;

  const currency = tiers[0]?.devise ?? "XOF";

  if (!loading && totalItems === 0) {
    return (
      <section>
        <h1 className="page-title">Récapitulatif</h1>
        <p className="page-subtitle">Votre panier est vide.</p>
        <Link to={`/events/${eventId}/tiers`} className="recap-link">
          ← Retour à la sélection
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1 className="page-title">Récapitulatif de commande</h1>
      <p className="page-subtitle">Événement #{eventId}</p>
      {loading && <p className="state-info">Chargement du récapitulatif...</p>}
      <ErrorMessage error={error} />

      <ul className="recap-list">
        {lines.map(({ tier, qty }) => (
          <li key={tier.id} className="recap-row">
            <div className="recap-row-left">
              <div className="recap-row-name">{tier.nom}</div>
              <div className="recap-row-meta">
                {qty} × {formatMoney(tier.prix, tier.devise)}
              </div>
            </div>
            <div className="recap-row-total">
              {formatMoney(tier.prix * qty, tier.devise)}
            </div>
          </li>
        ))}
      </ul>

      <div className="recap-totals">
        <div className="recap-totals-row">
          <span>Sous-total</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </div>
        <div className="recap-totals-row">
          <span>Frais</span>
          <span>{formatMoney(fees, currency)}</span>
        </div>
        <div className="recap-totals-row is-total">
          <span>Total TTC</span>
          <span>{formatMoney(total, currency)}</span>
        </div>
      </div>

      <div className="recap-actions">
        <Link to={`/events/${eventId}/tiers`} className="recap-btn-secondary">
          Modifier
        </Link>
        <button
          type="button"
          className="recap-btn-primary"
          onClick={() => navigate(`/events/${eventId}/commande/paiement`)}
        >
          Procéder au paiement
        </button>
      </div>
      <Link to="/" className="back-link">
        Retour à l'accueil
      </Link>
    </section>
  );
}
