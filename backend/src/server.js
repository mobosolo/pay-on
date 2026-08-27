const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const apiRoutes = require("./routes");
const { paymentWebhook } = require("./controllers/webhookController");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type", "x-user-id", "x-signature"],
  }),
);

app.post(
  "/api/webhooks/paiement",
  express.raw({ type: "application/json" }),
  paymentWebhook,
);
app.use(express.json());
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({ message: "PAY-ON backend skeleton is running" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

if (require.main === module) {
  const port = env.port;
  app.listen(port, () => {
    console.log(`PAY-ON backend listening on http://localhost:${port}`);
  });
}

module.exports = app;
