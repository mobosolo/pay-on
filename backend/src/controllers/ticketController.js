const crypto = require("crypto");
const prisma = require("../config/prisma");
const { initiatePayment } = require("../utils/payment");
const { HttpError, sendError, requireFields } = require("../utils/http");

function asNumber(value) {
  return Number(value.toString());
}

async function createTicketOrder(req, res) {
  let transactionId;
  try {
    const body = req.body || {};
    requireFields(body, ["user_id", "items"]);
    if (!Array.isArray(body.items) || body.items.length === 0)
      throw new HttpError(400, "items doit être un tableau non vide");
    const user = await prisma.utilisateur.findUnique({
      where: { id: body.user_id },
    });
    if (!user || !user.isActive)
      throw new HttpError(404, "Acheteur introuvable");

    const prepared = await prisma.$transaction(async (tx) => {
      const tierIds = body.items.map((item) => item.tier_id);
      const tiers = await tx.tierBillet.findMany({
        where: { id: { in: tierIds } },
        include: { event: true },
      });
      if (tiers.length !== new Set(tierIds).size)
        throw new HttpError(404, "Tier introuvable");
      const tierMap = new Map(tiers.map((tier) => [tier.id, tier]));
      const eventIds = new Set(tiers.map((tier) => tier.eventId));
      if (eventIds.size !== 1)
        throw new HttpError(
          400,
          "Tous les tiers doivent appartenir au même événement",
        );

      let total = 0;
      const billets = [];
      for (const item of body.items) {
        const quantity = Number(item.quantite);
        const tier = tierMap.get(item.tier_id);
        if (!Number.isInteger(quantity) || quantity <= 0)
          throw new HttpError(400, "quantite doit être un entier positif");
        if (
          !tier.isActive ||
          tier.event.statut === "annule" ||
          tier.event.statut === "cloture"
        )
          throw new HttpError(409, "Tier non disponible");
        const reserved = await tx.tierBillet.updateMany({
          where: {
            id: tier.id,
            quantiteVendue: { lte: tier.quantiteTotale - quantity },
          },
          data: { quantiteVendue: { increment: quantity } },
        });
        if (reserved.count !== 1) throw new HttpError(409, "Stock insuffisant");
        total += asNumber(tier.prix) * quantity;
        for (let index = 0; index < quantity; index += 1)
          billets.push({ tierId: tier.id, proprietaireUserId: body.user_id });
      }
      const transaction = await tx.transaction.create({
        data: {
          userId: body.user_id,
          montant: total,
          devise: tiers[0].devise,
          statut: "en_attente",
        },
      });
      transactionId = transaction.id;
      await tx.billet.createMany({
        data: billets.map((billet) => ({
          ...billet,
          transactionId: transaction.id,
          statut: "valide",
        })),
      });
      return { transaction, billets, eventId: tiers[0].eventId, total };
    });

    let payment;
    try {
      payment = await initiatePayment({
        transaction_id: prepared.transaction.id,
        event_id: prepared.eventId,
        amount_total: prepared.total,
        currency: prepared.transaction.devise,
        scenario: body.scenario,
      });
    } catch (paymentError) {
      await prisma.$transaction(async (tx) => {
        await tx.billet.deleteMany({
          where: { transactionId: prepared.transaction.id },
        });
        for (const item of body.items) {
          await tx.tierBillet.update({
            where: { id: item.tier_id },
            data: { quantiteVendue: { decrement: Number(item.quantite) } },
          });
        }
        await tx.transaction.delete({ where: { id: prepared.transaction.id } });
      });
      throw new HttpError(502, "Échec d’initiation du paiement", {
        cause: paymentError.message,
      });
    }
    const billetIds = await prisma.billet.findMany({
      where: { transactionId: prepared.transaction.id },
      select: { id: true, tierId: true },
    });
    return res
      .status(201)
      .json({
        transaction_id: prepared.transaction.id,
        statut: "en_attente",
        billets: billetIds,
        montant_total: prepared.total,
        paiement_url_ou_ref:
          payment.reference_externe || payment.payment_url || null,
      });
  } catch (error) {
    if (transactionId && error.status !== 502)
      console.error(
        `Transaction préparée ${transactionId} non finalisée:`,
        error.message,
      );
    return sendError(res, error);
  }
}

async function getQrCode(req, res) {
  try {
    const billet = await prisma.billet.findUnique({
      where: { id: req.params.id },
      select: { id: true, qrCode: true, statut: true },
    });
    if (!billet) throw new HttpError(404, "Billet introuvable");
    if (!billet.qrCode && billet.statut === "valide")
      return res
        .status(409)
        .json({
          error: "Paiement non confirmé",
          billet_id: billet.id,
          qr_code: null,
          statut: billet.statut,
        });
    return res.json({
      billet_id: billet.id,
      qr_code: billet.qrCode,
      statut: billet.statut,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function scanTicket(req, res) {
  try {
    const body = req.body || {};
    requireFields(body, ["qr_code", "scanned_by_user_id", "point_entree"]);
    const scanner = await prisma.utilisateur.findUnique({
      where: { id: body.scanned_by_user_id },
    });
    if (!scanner || !["staff_scan", "organisateur"].includes(scanner.role))
      throw new HttpError(403, "Droits de scan insuffisants");
    const ticket = await prisma.billet.findUnique({
      where: { qrCode: body.qr_code },
      include: { tier: true },
    });
    if (!ticket) throw new HttpError(404, "Billet introuvable");
    if (ticket.statut !== "valide")
      throw new HttpError(409, "Billet déjà scanné, annulé ou remboursé");
    const scannedAt = new Date();
    const updated = await prisma.billet.updateMany({
      where: { id: ticket.id, statut: "valide" },
      data: {
        statut: "scanne",
        scannedAt,
        scannedByUserId: scanner.id,
        pointEntree: body.point_entree,
      },
    });
    if (updated.count !== 1) throw new HttpError(409, "Billet déjà traité");
    return res.json({
      billet_id: ticket.id,
      statut: "scanne",
      tier_nom: ticket.tier.nom,
      scanned_at: scannedAt,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { createTicketOrder, getQrCode, scanTicket };
