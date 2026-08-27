const prisma = require("../config/prisma");
const { HttpError, sendError } = require("../utils/http");

async function getEventStats(req, res) {
  try {
    const event = await prisma.evenement.findUnique({
      where: { id: req.params.id },
    });
    if (!event) throw new HttpError(404, "Événement introuvable");

    const requesterId = req.headers["x-user-id"];
    if (!requesterId)
      throw new HttpError(401, "Identité requise via x-user-id");
    const requester = await prisma.utilisateur.findUnique({
      where: { id: requesterId },
    });
    if (!requester || !requester.isActive)
      throw new HttpError(403, "Accès stats refusé");
    const isEventOwner =
      requester.role === "organisateur" &&
      requester.id === event.organisateurId;
    const isStaff = requester.role === "staff_scan";
    if (!isEventOwner && !isStaff)
      throw new HttpError(403, "Accès stats refusé");

    const eventId = event.id;
    const [revenueRows, tierRows, ticketRows, gateRows, productRows] =
      await Promise.all([
        prisma.$queryRaw`
        SELECT
          COALESCE((SELECT SUM(t.montant) FROM transactions t
            WHERE t.statut = 'succes' AND EXISTS (
              SELECT 1 FROM billets b JOIN tier_billets tb ON tb.id = b.tier_id
              WHERE b.transaction_id = t.id AND tb.event_id = ${eventId}::uuid
            )), 0) + COALESCE((SELECT SUM(t.montant) FROM transactions t
            WHERE t.statut = 'succes' AND EXISTS (
              SELECT 1 FROM commandes_vendeur cv JOIN produits_vendeur pv ON pv.id = cv.produit_id
              WHERE cv.transaction_id = t.id AND pv.event_id = ${eventId}::uuid
            )), 0) AS total,
          COALESCE((SELECT SUM(t.montant) FROM transactions t
            WHERE t.statut = 'succes' AND EXISTS (
              SELECT 1 FROM billets b JOIN tier_billets tb ON tb.id = b.tier_id
              WHERE b.transaction_id = t.id AND tb.event_id = ${eventId}::uuid
            )), 0) AS billetterie,
          COALESCE((SELECT SUM(t.montant) FROM transactions t
            WHERE t.statut = 'succes' AND EXISTS (
              SELECT 1 FROM commandes_vendeur cv JOIN produits_vendeur pv ON pv.id = cv.produit_id
              WHERE cv.transaction_id = t.id AND pv.event_id = ${eventId}::uuid
            )), 0) AS vente_marchande
      `,
        prisma.$queryRaw`
        SELECT tb.id AS tier_id, tb.nom, tb.quantite_totale,
          COUNT(b.id)::int AS quantite_vendue,
          COALESCE(SUM(tb.prix), 0) AS revenus
        FROM tier_billets tb
        LEFT JOIN billets b ON b.tier_id = tb.id AND b.statut IN ('valide', 'scanne')
          AND EXISTS (SELECT 1 FROM transactions t WHERE t.id = b.transaction_id AND t.statut = 'succes')
        WHERE tb.event_id = ${eventId}::uuid
        GROUP BY tb.id, tb.nom, tb.quantite_totale
        ORDER BY tb.nom
      `,
        prisma.$queryRaw`
        SELECT
          COUNT(*) FILTER (WHERE b.statut = 'scanne')::int AS scannes,
          COUNT(*) FILTER (WHERE b.statut = 'valide')::int AS non_scannes
        FROM billets b
        JOIN tier_billets tb ON tb.id = b.tier_id
        JOIN transactions t ON t.id = b.transaction_id
        WHERE tb.event_id = ${eventId}::uuid AND t.statut = 'succes'
      `,
        prisma.$queryRaw`
        SELECT COALESCE(b.point_entree, 'non_renseigne') AS point_entree,
          COUNT(*)::int AS scannes
        FROM billets b
        JOIN tier_billets tb ON tb.id = b.tier_id
        JOIN transactions t ON t.id = b.transaction_id
        WHERE tb.event_id = ${eventId}::uuid AND t.statut = 'succes' AND b.statut = 'scanne'
        GROUP BY COALESCE(b.point_entree, 'non_renseigne')
        ORDER BY point_entree
      `,
        prisma.produitVendeur.findMany({
          where: { eventId },
          select: { id: true, nom: true, stock: true, statut: true },
          orderBy: { nom: "asc" },
        }),
      ]);

    const revenue = revenueRows[0];
    return res.json({
      event_id: eventId,
      revenus: {
        total: revenue.total,
        billetterie: revenue.billetterie,
        vente_marchande: revenue.vente_marchande,
        devise: "XOF",
      },
      billetterie: {
        par_tier: tierRows.map((row) => ({
          tier_id: row.tier_id,
          nom: row.nom,
          quantite_vendue: row.quantite_vendue,
          quantite_totale: row.quantite_totale,
        })),
        billets_scannes: ticketRows[0]?.scannes || 0,
        billets_non_scannes: ticketRows[0]?.non_scannes || 0,
        par_porte: gateRows.map((row) => ({
          point_entree: row.point_entree,
          count: row.scannes,
        })),
      },
      vendeur: {
        par_produit: productRows.map((product) => ({
          produit_id: product.id,
          nom: product.nom,
          stock_restant: product.stock,
          statut: product.statut,
        })),
      },
      derniere_maj: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { getEventStats };
