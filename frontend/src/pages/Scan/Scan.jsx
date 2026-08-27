import { useState } from "react";
import { scanBillet } from "../../api/billets.js";
import { USER_IDS } from "../../api/config.js";

export default function Scan() {
  const [qrCode, setQrCode] = useState("");
  const [pointEntree, setPointEntree] = useState("entrée principale");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  async function scan(event) {
    event.preventDefault();
    setError(null);
    try {
      setResult(
        await scanBillet({
          qr_code: qrCode,
          scanned_by_user_id: USER_IDS.scanner,
          point_entree: pointEntree,
        }),
      );
    } catch (e) {
      setError(e.message);
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
        <button type="submit">Valider l'entrée</button>
      </form>
      {error && <p className="state-error">Erreur : {error}</p>}
      {result && (
        <p className="state-info">
          Billet {result.billet_id} scanné ({result.tier_nom}).
        </p>
      )}
    </section>
  );
}
