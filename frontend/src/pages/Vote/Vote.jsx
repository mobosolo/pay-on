import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getVoteOptions, submitVote } from "../../api/votes.js";
import { ErrorMessage } from "../../utils/feedback.jsx";
import { Link } from "react-router-dom";

export default function Vote() {
  const { eventId } = useParams();
  const [billetId, setBilletId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [options, setOptions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    getVoteOptions(eventId)
      .then(setOptions)
      .catch((requestError) => setError(requestError))
      .finally(() => setLoading(false));
  }, [eventId]);
  async function vote(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setResult(
        await submitVote({ billet_id: billetId, vote_option_id: optionId }),
      );
    } catch (voteError) {
      setError(voteError);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section>
      <h1 className="page-title">Vote</h1>
      <p className="page-subtitle">Événement : {eventId}</p>
      <p>Le billet doit avoir été scanné avant le vote.</p>
      {loading && <p className="state-info">Chargement des choix...</p>}
      <ErrorMessage error={error} />
      <form onSubmit={vote}>
        <label>
          Identifiant du billet
          <input
            required
            value={billetId}
            onChange={(e) => setBilletId(e.target.value)}
          />
        </label>
        <label>
          Choix
          <select
            required
            value={optionId}
            onChange={(e) => setOptionId(e.target.value)}
            disabled={!options.length}
          >
            <option value="">Sélectionner une option</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.libelle}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!options.length || submitting}>
          {submitting ? "Enregistrement..." : "Voter"}
        </button>
      </form>
      {result && (
        <p className="state-info">Vote enregistré : {result.vote_id}</p>
      )}
      <Link className="back-link" to="/">
        Retour à l'accueil
      </Link>
    </section>
  );
}
