const prisma = require("../config/prisma");
const { HttpError, sendError, requireFields } = require("../utils/http");

function parseDate(value, field) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime()))
    throw new HttpError(400, `${field} invalide`);
  return date;
}

async function createEvent(req, res) {
  try {
    const body = req.body || {};
    requireFields(body, [
      "organisateur_id",
      "titre",
      "lieu_nom",
      "adresse",
      "ville",
      "date_debut",
      "date_fin",
    ]);
    const organiser = await prisma.utilisateur.findUnique({
      where: { id: body.organisateur_id },
    });
    if (!organiser) throw new HttpError(404, "Organisateur introuvable");
    if (organiser.role !== "organisateur" || !organiser.isActive)
      throw new HttpError(403, "Le compte doit avoir le rôle organisateur");

    const dateDebut = parseDate(body.date_debut, "date_debut");
    const dateFin = parseDate(body.date_fin, "date_fin");
    if (dateFin <= dateDebut)
      throw new HttpError(400, "date_fin doit être postérieure à date_debut");

    const event = await prisma.evenement.create({
      data: {
        organisateurId: body.organisateur_id,
        titre: body.titre,
        description: body.description || null,
        lieuNom: body.lieu_nom,
        adresse: body.adresse,
        ville: body.ville,
        dateDebut,
        dateFin,
      },
    });
    return res.status(201).json(event);
  } catch (error) {
    return sendError(res, error);
  }
}

async function listEvents(req, res) {
  try {
    const status = req.query.statut || "publie";
    const allowedStatuses = new Set([
      "brouillon",
      "publie",
      "presale",
      "live",
      "cloture",
      "annule",
    ]);
    if (!allowedStatuses.has(status))
      throw new HttpError(400, "statut invalide");
    const events = await prisma.evenement.findMany({
      where: { statut: status },
      orderBy: { dateDebut: "asc" },
      select: {
        id: true,
        titre: true,
        description: true,
        statut: true,
        lieuNom: true,
        adresse: true,
        ville: true,
        dateDebut: true,
        dateFin: true,
      },
    });
    return res.json(
      events.map((event) => ({
        id: event.id,
        titre: event.titre,
        description: event.description,
        statut: event.statut,
        lieu_nom: event.lieuNom,
        adresse: event.adresse,
        ville: event.ville,
        date_debut: event.dateDebut,
        date_fin: event.dateFin,
      })),
    );
  } catch (error) {
    return sendError(res, error);
  }
}

async function publishEvent(req, res) {
  try {
    const event = await prisma.evenement.findUnique({
      where: { id: req.params.id },
      include: { tiers: { where: { isActive: true }, take: 1 } },
    });
    if (!event) throw new HttpError(404, "Événement introuvable");
    const requesterId = req.get("x-user-id") || req.body?.organisateur_id;
    if (requesterId && requesterId !== event.organisateurId)
      throw new HttpError(403, "Vous n’êtes pas propriétaire de cet événement");
    if (!requesterId)
      throw new HttpError(401, "Identité organisateur requise via x-user-id");
    if (event.statut === "annule" || event.statut !== "brouillon")
      throw new HttpError(409, "Événement déjà publié ou non publiable");
    if (!event.tiers.length)
      throw new HttpError(409, "Aucun tier actif défini");
    const updated = await prisma.evenement.update({
      where: { id: event.id },
      data: { statut: "publie" },
      select: { id: true, statut: true },
    });
    return res.json(updated);
  } catch (error) {
    return sendError(res, error);
  }
}

async function listTiers(req, res) {
  try {
    const event = await prisma.evenement.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!event) throw new HttpError(404, "Événement introuvable");
    const tiers = await prisma.tierBillet.findMany({
      where: { eventId: event.id },
      orderBy: { nom: "asc" },
    });
    return res.json(
      tiers.map((tier) => ({
        id: tier.id,
        nom: tier.nom,
        prix: tier.prix,
        devise: tier.devise,
        quantite_totale: tier.quantiteTotale,
        quantite_vendue: tier.quantiteVendue,
        quantite_disponible: tier.quantiteTotale - tier.quantiteVendue,
        ventes_debut: tier.ventesDebut,
        ventes_fin: tier.ventesFin,
        is_active: tier.isActive,
      })),
    );
  } catch (error) {
    return sendError(res, error);
  }
}

async function createTier(req, res) {
  try {
    const body = req.body || {};
    requireFields(body, ["nom", "prix", "devise", "quantite_totale"]);
    const price = Number(body.prix);
    const quantity = Number(body.quantite_totale);
    if (!Number.isFinite(price) || price < 0)
      throw new HttpError(400, "prix invalide");
    if (!Number.isInteger(quantity) || quantity < 0)
      throw new HttpError(400, "quantite_totale invalide");
    const event = await prisma.evenement.findUnique({
      where: { id: req.params.id },
      select: { id: true, organisateurId: true, statut: true },
    });
    if (!event) throw new HttpError(404, "Événement introuvable");
    if (req.headers["x-user-id"] !== event.organisateurId)
      throw new HttpError(403, "Vous n’êtes pas propriétaire de cet événement");
    if (event.statut !== "brouillon")
      throw new HttpError(
        409,
        "Impossible d’ajouter un tier après publication",
      );
    const tier = await prisma.tierBillet.create({
      data: {
        eventId: event.id,
        nom: body.nom,
        prix: price,
        devise: body.devise,
        quantiteTotale: quantity,
        ventesDebut: body.ventes_debut
          ? parseDate(body.ventes_debut, "ventes_debut")
          : null,
        ventesFin: body.ventes_fin
          ? parseDate(body.ventes_fin, "ventes_fin")
          : null,
        isActive: body.is_active === undefined ? true : Boolean(body.is_active),
      },
    });
    return res.status(201).json({
      id: tier.id,
      event_id: tier.eventId,
      nom: tier.nom,
      prix: tier.prix,
      devise: tier.devise,
      quantite_totale: tier.quantiteTotale,
      quantite_vendue: tier.quantiteVendue,
      is_active: tier.isActive,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listProducts(req, res) {
  try {
    const event = await prisma.evenement.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!event) throw new HttpError(404, "Événement introuvable");
    const where = { eventId: event.id };
    if (req.query.statut) where.statut = req.query.statut;
    const products = await prisma.produitVendeur.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return res.json(
      products.map((product) => ({
        id: product.id,
        vendeur_user_id: product.vendeurUserId,
        nom: product.nom,
        description: product.description,
        prix: product.prix,
        devise: product.devise,
        stock: product.stock,
        statut: product.statut,
      })),
    );
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  listEvents,
  createEvent,
  publishEvent,
  listTiers,
  createTier,
  listProducts,
};
