import { useState } from "react";
import {
  createEvent,
  createTier,
  createVoteOption,
  publishEvent,
} from "../../api/events.js";
import { USER_IDS } from "../../api/config.js";
const initialEvent = {
  titre: "",
  description: "",
  lieu_nom: "",
  adresse: "",
  ville: "",
  date_debut: "",
  date_fin: "",
};
const emptyTier = {
  nom: "",
  prix: "",
  devise: "XOF",
  quantite_totale: "",
  is_active: true,
};
export default function EventCreation() {
  const [form, setForm] = useState(initialEvent);
  const [tiers, setTiers] = useState([{ ...emptyTier }]);
  const [options, setOptions] = useState([{ libelle: "" }]);
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  function updateEvent(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }
  function updateTier(index, name, value) {
    setTiers((previous) =>
      previous.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, [name]: value } : tier,
      ),
    );
  }
  function updateOption(index, value) {
    setOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index ? { libelle: value } : option,
      ),
    );
  }
  async function submit(eventSubmit) {
    eventSubmit.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const created = await createEvent({
        ...form,
        organisateur_id: USER_IDS.organizer,
      });
      setEvent(created);
      const validTiers = tiers.filter((tier) => tier.nom.trim());
      const validOptions = options.filter((option) => option.libelle.trim());
      if (!validTiers.length)
        throw new Error("Ajoutez au moins un tier actif.");
      await Promise.all(
        validTiers.map((tier) =>
          createTier(
            created.id,
            {
              ...tier,
              prix: Number(tier.prix),
              quantite_totale: Number(tier.quantite_totale),
            },
            USER_IDS.organizer,
          ),
        ),
      );
      await Promise.all(
        validOptions.map((option) =>
          createVoteOption(created.id, option, USER_IDS.organizer),
        ),
      );
      const published = await publishEvent(created.id, USER_IDS.organizer);
      setMessage(`Événement ${published.id} publié.`);
    } catch (submitError) {
      setError(submitError.message);
    }
  }
  return (
    <section>
      <h1 className="page-title">Création d'événement</h1>
      <form onSubmit={submit}>
        {["titre", "description", "lieu_nom", "adresse", "ville"].map(
          (name) => (
            <label key={name}>
              {name}
              <input
                required={name !== "description"}
                value={form[name]}
                onChange={(e) => updateEvent(name, e.target.value)}
              />
            </label>
          ),
        )}
        <label>
          Date de début{" "}
          <input
            required
            type="datetime-local"
            value={form.date_debut}
            onChange={(e) => updateEvent("date_debut", e.target.value)}
          />
        </label>
        <label>
          Date de fin{" "}
          <input
            required
            type="datetime-local"
            value={form.date_fin}
            onChange={(e) => updateEvent("date_fin", e.target.value)}
          />
        </label>
        <h2>Tiers de billets</h2>
        {tiers.map((tier, index) => (
          <fieldset key={index}>
            <legend>Tier {index + 1}</legend>
            <label>
              Nom{" "}
              <input
                required
                value={tier.nom}
                onChange={(e) => updateTier(index, "nom", e.target.value)}
              />
            </label>
            <label>
              Prix{" "}
              <input
                required
                type="number"
                min="0"
                value={tier.prix}
                onChange={(e) => updateTier(index, "prix", e.target.value)}
              />
            </label>
            <label>
              Devise{" "}
              <input
                required
                value={tier.devise}
                onChange={(e) => updateTier(index, "devise", e.target.value)}
              />
            </label>
            <label>
              Quantité{" "}
              <input
                required
                type="number"
                min="1"
                value={tier.quantite_totale}
                onChange={(e) =>
                  updateTier(index, "quantite_totale", e.target.value)
                }
              />
            </label>
          </fieldset>
        ))}
        <button
          type="button"
          onClick={() =>
            setTiers((previous) => [...previous, { ...emptyTier }])
          }
        >
          Ajouter un tier
        </button>
        <h2>Options de vote</h2>
        {options.map((option, index) => (
          <label key={index}>
            Option {index + 1}
            <input
              value={option.libelle}
              onChange={(e) => updateOption(index, e.target.value)}
            />
          </label>
        ))}
        <button
          type="button"
          onClick={() =>
            setOptions((previous) => [...previous, { libelle: "" }])
          }
        >
          Ajouter une option
        </button>
        <button type="submit">Créer, configurer et publier</button>
      </form>
      {message && <p className="state-info">{message}</p>}
      {error && <p className="state-error">Erreur : {error}</p>}
      {event && <p>Événement créé : {event.id}</p>}
    </section>
  );
}
