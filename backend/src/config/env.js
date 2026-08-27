require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  mockServiceUrl: process.env.MOCK_SERVICE_URL,
  webhookSecret: process.env.WEBHOOK_SECRET || "development-secret",
  mockWebhookSecret: process.env.MOCK_WEBHOOK_SECRET || "mock-secret",
  paygateWebhookSecret: process.env.PAYGATE_WEBHOOK_SECRET || "paygate-secret",
};
