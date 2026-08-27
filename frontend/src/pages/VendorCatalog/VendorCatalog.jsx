import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createVendorOrder, getEventProducts } from "../../api/vendor.js";
import { USER_IDS } from "../../api/config.js";
import { formatMoney } from "../../utils/format.js";

export default function VendorCatalog() {
  const { eventId } = useParams();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    getEventProducts(eventId, { statut: "live" })
      .then(setProducts)
      .catch((e) => setError(e.message));
  }, [eventId]);
  async function order(product) {
    const quantity = Number(quantities[product.id] || 1);
    setError(null);
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
      setError(e.message);
    }
  }
  return (
    <section>
      <h1 className="page-title">Catalogue vendeur</h1>
      <p className="page-subtitle">Événement : {eventId}</p>
      {error && <p className="state-error">Erreur : {error}</p>}
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
            <button type="button" onClick={() => order(product)}>
              Commander
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
