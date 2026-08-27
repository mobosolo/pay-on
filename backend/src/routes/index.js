const express = require("express");
const { getHealth } = require("../controllers/healthController");
const {
  listEvents,
  createEvent,
  publishEvent,
  listTiers,
  createTier,
  listProducts,
} = require("../controllers/eventController");
const {
  createTicketOrder,
  getQrCode,
  scanTicket,
} = require("../controllers/ticketController");
const {
  createVote,
  createVoteOption,
  listVoteOptions,
} = require("../controllers/voteController");
const { createVendorOrder } = require("../controllers/vendorController");
const { getEventStats } = require("../controllers/statsController");

const router = express.Router();

router.get("/health", getHealth);
router.get("/events", listEvents);
router.post("/events", createEvent);
router.patch("/events/:id/publish", publishEvent);
router.get("/events/:id/tiers", listTiers);
router.post("/events/:id/tiers", createTier);
router.post("/events/:id/vote-options", createVoteOption);
router.get("/events/:id/vote-options", listVoteOptions);
router.post("/billets/commandes", createTicketOrder);
router.get("/billets/:id/qrcode", getQrCode);
router.post("/billets/scan", scanTicket);
router.post("/votes", createVote);
router.get("/events/:id/produits", listProducts);
router.get("/events/:id/stats", getEventStats);
router.post("/vendeur/commandes", createVendorOrder);

module.exports = router;
