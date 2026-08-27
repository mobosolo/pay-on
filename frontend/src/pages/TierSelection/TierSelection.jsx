import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { getEventTiers } from "../../api/billets.js";
import { useCart } from "../../state/CartContext.jsx";
import { formatMoney } from "../../utils/format.js";
import "./TierSelection.css";
import { ErrorMessage } from "../../utils/feedback.jsx";

export default function TierSelection() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { cart, setQty, totalItems } = useCart();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEventTiers(eventId)
      .then((data) => {
        if (!cancelled) setTiers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const subtotal = useMemo(() => {
    return tiers.reduce((sum, t) => sum + t.prix * (cart[t.id] ?? 0), 0);
  }, [tiers, cart]);

  const currency = tiers[0]?.devise ?? "XOF";

  function handleContinue() {
    if (totalItems === 0) return;
    navigate(`/events/${eventId}/commande/recap`);
  }

  return (
    <section className="screen-tier">
      <h1 className="page-title">Choisissez vos billets</h1>
      <p className="page-subtitle">Événement #{eventId}</p>

      {loading && <p className="state-info">Chargement des tiers…</p>}
      <ErrorMessage error={error} />

      <ul className="tier-list">
        {tiers.map((tier) => {
          const qty = cart[tier.id] ?? 0;
          const remaining = tier.quantite_disponible;
          const disabled = !tier.is_active || remaining <= 0;
          return (
            <li
              key={tier.id}
              className={`tier-card ${disabled ? "is-disabled" : ""}`}
              aria-disabled={disabled}
            >
              <div className="tier-head">
                <div>
                  <h2 className="tier-name">{tier.nom}</h2>
                  {tier.description && (
                    <p className="tier-desc">{tier.description}</p>
                  )}
                </div>
                <div className="tier-price">
                  {formatMoney(tier.prix, tier.devise)}
                </div>
              </div>

              <p className="tier-stock">
                {remaining > 0 ? (
                  <>
                    <span className="stock-num">{remaining}</span> restants
                  </>
                ) : (
                  <span className="stock-out">Épuisé</span>
                )}
              </p>

              <div className="qty-row">
                <button
                  type="button"
                  className="qty-btn"
                  aria-label={`Retirer un ${tier.nom}`}
                  disabled={disabled || qty === 0}
                  onClick={() => setQty(tier.id, qty - 1)}
                >
                  −
                </button>
                <span
                  className="qty-value"
                  aria-live="polite"
                  aria-label={`Quantité ${tier.nom}`}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  className="qty-btn"
                  aria-label={`Ajouter un ${tier.nom}`}
                  disabled={disabled || qty >= remaining}
                  onClick={() => setQty(tier.id, qty + 1)}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="cta-bar">
        <div className="subtotal">
          <span className="subtotal-label">Sous-total</span>
          <span className="subtotal-value">
            {formatMoney(subtotal, currency)}
          </span>
        </div>
        <button
          type="button"
          className="cta-btn"
          disabled={totalItems === 0}
          onClick={handleContinue}
        >
          Continuer ({totalItems})
        </button>
      </div>
      <Link className="back-link" to="/">
        Retour à l'accueil
      </Link>
    </section>
  );
}
