import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createVendorOrder, getEventProducts } from "../../api/vendor.js";
import { USER_IDS } from "../../api/config.js";
import { formatMoney } from "../../utils/format.js";
import { ErrorMessage } from "../../utils/feedback.jsx";
import { Link } from "react-router-dom";

export default function VendorCatalog() {
  const { eventId } = useParams();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null);
  useEffect(() => {
    getEventProducts(eventId, { statut: "live" })
      .then(setProducts)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [eventId]);
  async function order(product) {
    const quantity = Number(quantities[product.id] || 1);
    setError(null);
    setOrdering(product.id);
    try {
      const result = await createVendorOrder({
        acheteur_user_id: USER_IDS.participant,
        produit_id: product.id,
        quantite: quantity,
      });
      setMessage(
        `Commande ${result.commande_id} créée, paiement en attente (${result.montant_total} ${product.devise}).`,
      );
    } catch (e) {
      setError(e);
    } finally {
      setOrdering(null);
    }
  }
  return (
    <section>
      <h1 className="page-title">Catalogue vendeur</h1>
      <p className="page-subtitle">Événement : {eventId}</p>
      {loading && <p className="state-info">Chargement du catalogue...</p>}
      <ErrorMessage error={error} />
      {message && <p className="state-info">{message}</p>}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <strong>{product.nom}</strong> ·{" "}
            {formatMoney(product.prix, product.devise)} · {product.stock} en
            stock
            <p>{product.description}</p>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantities[product.id] || 1}
              onChange={(e) =>
                setQuantities({ ...quantities, [product.id]: e.target.value })
              }
              aria-label={`Quantité ${product.nom}`}
            />
            <button
              type="button"
              disabled={ordering === product.id}
              onClick={() => order(product)}
            >
              {ordering === product.id ? "Commande en cours..." : "Commander"}
            </button>
          </li>
        ))}
      </ul>
      <Link className="back-link" to="/">
        Retour à l'accueil
      </Link>
    </section>
  );
}
