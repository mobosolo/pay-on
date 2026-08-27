import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getVoteOptions, submitVote } from "../../api/votes.js";

export default function Vote() {
  const { eventId } = useParams();
  const [billetId, setBilletId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [options, setOptions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    getVoteOptions(eventId)
      .then(setOptions)
      .catch((requestError) => setError(requestError.message));
  }, [eventId]);
  async function vote(event) {
    event.preventDefault();
    setError(null);
    try {
      setResult(
        await submitVote({ billet_id: billetId, vote_option_id: optionId }),
      );
    } catch (voteError) {
      setError(voteError.message);
    }
  }
  return (
    <section>
      <h1 className="page-title">Vote</h1>
      <p className="page-subtitle">Événement : {eventId}</p>
      <p>Le billet doit avoir été scanné avant le vote.</p>
      {error && <p className="state-error">Erreur : {error}</p>}
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
        <button type="submit" disabled={!options.length}>
          Voter
        </button>
      </form>
      {result && (
        <p className="state-info">Vote enregistré : {result.vote_id}</p>
      )}
    </section>
  );
}
