import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getBilletQrCode } from "../../api/billets.js";
import "./Confirmation.css";
import { ErrorMessage } from "../../utils/feedback.jsx";

export default function Confirmation() {
  const { eventId, billetId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBilletQrCode(billetId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [billetId]);

  if (loading) {
    return (
      <section>
        <h1 className="page-title">Confirmation</h1>
        <p>Chargement du QR code…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1 className="page-title">Confirmation</h1>
        <ErrorMessage error={error} />
        <Link to={`/events/${eventId}/commande/paiement`} className="conf-link">
          Retour au paiement
        </Link>
      </section>
    );
  }

  if (!data?.qr_code) {
    return (
      <section>
        <h1 className="page-title">Confirmation</h1>
        <p className="conf-warn">
          QR code indisponible — le paiement n'a pas encore été confirmé.
        </p>
        <Link to={`/events/${eventId}/commande/paiement`} className="conf-link">
          ← Retour au paiement
        </Link>
      </section>
    );
  }

  return (
    <section className="conf-screen">
      <div className="conf-success" aria-hidden="true">
        ✓
      </div>
      <h1 className="page-title">Billet confirmé</h1>
      <p className="page-subtitle">Événement #{eventId}</p>

      <div className="conf-qr-card">
        <QRCodeCanvas
          value={data.qr_code}
          size={224}
          bgColor="#ffffff"
          fgColor="#111111"
          level="M"
          includeMargin={false}
        />
        <p className="conf-qr-hint">Présentez ce QR code à l'entrée.</p>
        <code className="conf-qr-code">{data.qr_code}</code>
        <p className="conf-billet-id">Billet #{data.billet_id}</p>
      </div>

      <Link to={`/events/${eventId}/tiers`} className="conf-link">
        Acheter d'autres billets
      </Link>
      <Link to="/" className="conf-link">
        Retour à l'accueil
      </Link>
    </section>
  );
}
