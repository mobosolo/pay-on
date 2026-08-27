import { useState } from "react";
import { scanBillet } from "../../api/billets.js";
import { USER_IDS } from "../../api/config.js";
import { ErrorMessage } from "../../utils/feedback.jsx";
import { Link } from "react-router-dom";

export default function Scan() {
  const [qrCode, setQrCode] = useState("");
  const [pointEntree, setPointEntree] = useState("entrée principale");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  async function scan(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setResult(
        await scanBillet({
          qr_code: qrCode,
          scanned_by_user_id: USER_IDS.scanner,
          point_entree: pointEntree,
        }),
      );
    } catch (e) {
      setError(e);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section>
      <h1 className="page-title">Scan entrée</h1>
      <form onSubmit={scan}>
        <label>
          QR code{" "}
          <input
            required
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
          />
        </label>
        <label>
          Point d'entrée{" "}
          <input
            required
            value={pointEntree}
            onChange={(e) => setPointEntree(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Vérification..." : "Valider l'entrée"}
        </button>
      </form>
      <ErrorMessage error={error} />
      {result && (
        <p className="state-info">
          Billet {result.billet_id} scanné ({result.tier_nom}).
        </p>
      )}
      <Link className="back-link" to="/">
        Retour à l'accueil
      </Link>
    </section>
  );
}
