const prisma = require("../config/prisma");
const { initiatePayment } = require("../utils/payment");
const { HttpError, sendError, requireFields } = require("../utils/http");

async function createVendorOrder(req, res) {
  try {
    const body = req.body || {};
    requireFields(body, ["acheteur_user_id", "produit_id", "quantite"]);
    const quantity = Number(body.quantite);
    if (!Number.isInteger(quantity) || quantity <= 0)
      throw new HttpError(400, "quantite doit être un entier positif");
    const buyer = await prisma.utilisateur.findUnique({
      where: { id: body.acheteur_user_id },
    });
    if (!buyer || !buyer.isActive)
      throw new HttpError(404, "Acheteur introuvable");

    const prepared = await prisma.$transaction(async (tx) => {
      const product = await tx.produitVendeur.findUnique({
        where: { id: body.produit_id },
        include: { event: true },
      });
      if (!product) throw new HttpError(404, "Produit vendeur introuvable");
      if (!["presale", "live"].includes(product.statut))
        throw new HttpError(409, "Produit non disponible");
      const reserved = await tx.produitVendeur.updateMany({
        where: { id: product.id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (reserved.count !== 1) throw new HttpError(409, "Stock insuffisant");
      const total = Number(product.prix.toString()) * quantity;
      const transaction = await tx.transaction.create({
        data: {
          userId: buyer.id,
          montant: total,
          devise: product.devise,
          statut: "en_attente",
        },
      });
      const order = await tx.commandeVendeur.create({
        data: {
          produitId: product.id,
          acheteurUserId: buyer.id,
          quantite: quantity,
          montantTotal: total,
          statut: "en_attente",
          transactionId: transaction.id,
        },
      });
      return { product, transaction, order, total };
    });

    try {
      await initiatePayment({
        transaction_id: prepared.transaction.id,
        event_id: prepared.product.eventId,
        amount_total: prepared.total,
        currency: prepared.product.devise,
        scenario: body.scenario,
      });
    } catch (paymentError) {
      await prisma.$transaction(async (tx) => {
        await tx.commandeVendeur.delete({ where: { id: prepared.order.id } });
        await tx.transaction.delete({ where: { id: prepared.transaction.id } });
        await tx.produitVendeur.update({
          where: { id: prepared.product.id },
          data: { stock: { increment: quantity } },
        });
      });
      throw new HttpError(502, "Échec d’initiation du paiement", {
        cause: paymentError.message,
      });
    }
    return res
      .status(201)
      .json({
        transaction_id: prepared.transaction.id,
        commande_id: prepared.order.id,
        statut: "en_attente",
        montant_total: prepared.total,
      });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { createVendorOrder };
