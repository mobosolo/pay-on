async function initiatePayment(payload) {
  const baseUrl = process.env.MOCK_SERVICE_URL;
  if (!baseUrl) throw new Error("MOCK_SERVICE_URL est manquante");

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/mock/payments/initiate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.error || `Le service de paiement a répondu ${response.status}`,
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

module.exports = { initiatePayment };
