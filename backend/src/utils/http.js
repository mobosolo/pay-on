class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function sendError(res, error) {
  const status = error instanceof HttpError ? error.status : 500;
  const body = { error: error.message || "Erreur interne" };
  if (error.details) body.details = error.details;
  if (status === 500) console.error(error);
  return res.status(status).json(body);
}

function requireFields(body, fields) {
  const missing = fields.filter(
    (field) =>
      body[field] === undefined || body[field] === null || body[field] === "",
  );
  if (missing.length)
    throw new HttpError(400, "Champs requis manquants", { required: missing });
}

module.exports = { HttpError, sendError, requireFields };
