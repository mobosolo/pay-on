const crypto = require("crypto");
const prisma = require("../config/prisma");
const { HttpError, sendError } = require("../utils/http");

function verifyWebhookSignature(rawBody, receivedSignature, secret) {
  if (!receivedSignature || !/^[0-9a-f]{64}$/i.test(receivedSignature))
    return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(receivedSignature, "hex");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function paymentWebhook(req, res) {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const signature = req.headers["x-signature"];
    const secret =
      process.env.WEBHOOK_SECRET || process.env.MOCK_WEBHOOK_SECRET;
    if (!secret || !verifyWebhookSignature(rawBody, signature, secret))
      throw new HttpError(401, "Signature invalide");

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new HttpError(400, "Payload JSON invalide");
    }
    const required = [
      "transaction_id",
      "event_id",
      "status",
      "reference_externe",
      "amount_total",
      "currency",
      "provider",
    ];
    if (
      required.some(
        (field) => payload[field] === undefined || payload[field] === null,
      )
    )
      throw new HttpError(400, "Payload webhook incomplet");
    if (!["success", "failed", "pending"].includes(payload.status))
      throw new HttpError(400, "status webhook invalide");

    const transaction = await prisma.transaction.findUnique({
      where: { id: payload.transaction_id },
      include: {
        billets: { include: { tier: true } },
        commandesVendeur: { include: { produit: true } },
      },
    });
    if (!transaction) throw new HttpError(404, "Transaction introuvable");
    const eventIds = new Set([
      ...transaction.billets.map((ticket) => ticket.tier.eventId),
      ...transaction.commandesVendeur.map((order) => order.produit.eventId),
    ]);
    if (eventIds.size !== 1 || !eventIds.has(payload.event_id))
      throw new HttpError(409, "event_id incohérent");
    if (["succes", "echec", "rembourse"].includes(transaction.statut))
      return res.json({ received: true });

    const mappedStatus = {
      success: "succes",
      failed: "echec",
      pending: "en_attente",
    }[payload.status];
    if (payload.status === "pending") return res.json({ received: true });
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          statut: mappedStatus,
          referenceExterne: payload.reference_externe,
          provider: payload.provider,
          failureReason: payload.failure_reason || null,
          splitOrganisateur: payload.split?.organisateur ?? null,
          splitVendeur: payload.split?.vendeur ?? null,
          splitPlateforme: payload.split?.plateforme ?? null,
          splitNote: payload.split?.note || null,
          confirmedAt: payload.status === "success" ? new Date() : null,
        },
      });
      if (payload.status === "success") {
        for (const ticket of transaction.billets) {
          await tx.billet.update({
            where: { id: ticket.id },
            data: { qrCode: `payon_${crypto.randomUUID()}` },
          });
        }
        for (const order of transaction.commandesVendeur) {
          await tx.commandeVendeur.update({
            where: { id: order.id },
            data: {
              statut: "payee",
              qrCodeRetrait: `retrait_${crypto.randomUUID()}`,
            },
          });
        }
      } else {
        await tx.billet.updateMany({
          where: { transactionId: transaction.id },
          data: { statut: "annule" },
        });
        for (const tierId of [
          ...new Set(transaction.billets.map((ticket) => ticket.tierId)),
        ]) {
          const amount = transaction.billets.filter(
            (ticket) => ticket.tierId === tierId,
          ).length;
          await tx.tierBillet.update({
            where: { id: tierId },
            data: { quantiteVendue: { decrement: amount } },
          });
        }
        for (const order of transaction.commandesVendeur)
          await tx.produitVendeur.update({
            where: { id: order.produitId },
            data: { stock: { increment: order.quantite } },
          });
        await tx.commandeVendeur.updateMany({
          where: { transactionId: transaction.id },
          data: { statut: "annulee" },
        });
      }
    });
    return res.json({ received: true });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { paymentWebhook, verifyWebhookSignature };
