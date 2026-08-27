import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createBilletOrder, getBilletQrCode } from "../../api/billets.js";
import { USER_IDS } from "../../api/config.js";
import { useCart } from "../../state/CartContext.jsx";
import { formatMoney } from "../../utils/format.js";
import "./Payment.css";
import { ErrorMessage } from "../../utils/feedback.jsx";

const PHASES = {
  IDLE: "idle",
  SUBMITTING: "submitting",
  PENDING: "pending",
  SUCCESS: "success",
  FAILURE: "failure",
};

export default function Payment() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { cart, totalItems } = useCart();
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [tx, setTx] = useState(null);
  const [error, setError] = useState(null);

  const items = useMemo(
    () =>
      Object.entries(cart).map(([tierId, qty]) => ({
        tier_id: tierId,
        quantite: qty,
      })),
    [cart],
  );

  useEffect(() => {
    if (!tx?.billets?.length || phase !== PHASES.PENDING) return undefined;
    let cancelled = false;
    let attempts = 0;
    const billetId = tx.billets[0].id;
    const check = async () => {
      attempts += 1;
      try {
        const qr = await getBilletQrCode(billetId);
        if (!cancelled && qr.qr_code) setPhase(PHASES.SUCCESS);
      } catch (checkError) {
        if (!cancelled && !checkError.message.startsWith("API 409"))
          setError(checkError);
      }
      if (!cancelled && phase === PHASES.PENDING && attempts < 20) {
        window.setTimeout(check, 500);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [tx, phase]);

  async function startPayment() {
    if (totalItems === 0) return;
    setPhase(PHASES.SUBMITTING);
    setError(null);
    try {
      const result = await createBilletOrder({
        user_id: USER_IDS.participant,
        items,
      });
      setTx(result);
      setPhase(PHASES.PENDING);
    } catch (e) {
      setError(e);
      setPhase(PHASES.IDLE);
    }
  }

  return (
    <section className="screen-pay">
      <h1 className="page-title">Paiement</h1>
      <p className="page-subtitle">Événement #{eventId}</p>

      {phase === PHASES.IDLE && (
        <div className="pay-ready">
          <p>
            Vous allez être débité de la somme affichée sur le récapitulatif. Le
            débit n'est définitif qu'à réception du webhook de paiement.
          </p>
          <button
            type="button"
            className="pay-btn"
            disabled={totalItems === 0}
            onClick={startPayment}
          >
            Payer maintenant
          </button>
          {totalItems === 0 && (
            <p className="pay-warn">Panier vide — retournez à la sélection.</p>
          )}
        </div>
      )}

      {(phase === PHASES.SUBMITTING || phase === PHASES.PENDING) && (
        <div className="pay-pending" role="status" aria-live="polite">
          <div className="pay-spinner" aria-hidden="true" />
          <h2 className="pay-state-title">Paiement en attente</h2>
          <p>
            Référence : <code>{tx?.transaction_id ?? "—"}</code>
          </p>
          {tx?.montant_total != null && (
            <p>Montant : {formatMoney(tx.montant_total, "XOF")}</p>
          )}
          <p className="pay-state-hint">
            Le webhook de paiement confirmera ou non la transaction. Ne fermez
            pas cette page.
          </p>
        </div>
      )}

      {phase === PHASES.SUCCESS && tx && (
        <div className="pay-success" role="status" aria-live="assertive">
          <div className="pay-icon pay-icon-success" aria-hidden="true">
            ✓
          </div>
          <h2 className="pay-state-title">Paiement réussi</h2>
          <p>Votre commande est confirmée.</p>
          <button
            type="button"
            className="pay-btn"
            onClick={() => {
              const firstBilletId = tx.billets?.[0]?.id ?? "billet_demo";
              navigate(
                `/events/${eventId}/billets/${firstBilletId}/confirmation`,
              );
            }}
          >
            Voir mon billet
          </button>
        </div>
      )}

      {phase === PHASES.FAILURE && tx && (
        <div className="pay-failure" role="alert">
          <div className="pay-icon pay-icon-failure" aria-hidden="true">
            ✕
          </div>
          <h2 className="pay-state-title">Échec du paiement</h2>
          <p>
            {tx._failure_reason ||
              "La transaction a été refusée par le prestataire."}
          </p>
          <div className="pay-failure-actions">
            <button
              type="button"
              className="pay-btn-secondary"
              onClick={() => navigate(`/events/${eventId}/commande/recap`)}
            >
              Retour au récapitulatif
            </button>
            <button type="button" className="pay-btn" onClick={startPayment}>
              Réessayer
            </button>
          </div>
        </div>
      )}

      <ErrorMessage error={error} />
      <button
        type="button"
        className="pay-btn-secondary"
        onClick={() => navigate(`/events/${eventId}/commande/recap`)}
      >
        Retour au récapitulatif
      </button>
    </section>
  );
}
