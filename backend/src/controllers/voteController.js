const prisma = require("../config/prisma");
const { HttpError, sendError, requireFields } = require("../utils/http");

async function createVoteOption(req, res) {
  try {
    const body = req.body || {};
    requireFields(body, ["libelle"]);
    const event = await prisma.evenement.findUnique({
      where: { id: req.params.id },
      select: { id: true, organisateurId: true },
    });
    if (!event) throw new HttpError(404, "Événement introuvable");
    if (req.headers["x-user-id"] !== event.organisateurId)
      throw new HttpError(403, "Vous n’êtes pas propriétaire de cet événement");
    const option = await prisma.voteOption.create({
      data: { eventId: event.id, libelle: body.libelle },
    });
    return res.status(201).json({
      id: option.id,
      event_id: option.eventId,
      libelle: option.libelle,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listVoteOptions(req, res) {
  try {
    const event = await prisma.evenement.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!event) throw new HttpError(404, "Événement introuvable");
    const options = await prisma.voteOption.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "asc" },
    });
    return res.json(
      options.map((option) => ({
        id: option.id,
        event_id: option.eventId,
        libelle: option.libelle,
      })),
    );
  } catch (error) {
    return sendError(res, error);
  }
}

async function createVote(req, res) {
  try {
    const body = req.body || {};
    requireFields(body, ["billet_id", "vote_option_id"]);
    const ticket = await prisma.billet.findUnique({
      where: { id: body.billet_id },
      include: { tier: true },
    });
    if (!ticket) throw new HttpError(404, "Billet introuvable");
    if (ticket.statut !== "scanne")
      throw new HttpError(403, "Le billet doit être scanné");
    const option = await prisma.voteOption.findUnique({
      where: { id: body.vote_option_id },
    });
    if (!option) throw new HttpError(404, "Option de vote introuvable");
    const eventId = ticket.tier.eventId;
    if (option.eventId !== eventId)
      throw new HttpError(400, "Option de vote rattachée à un autre événement");
    const vote = await prisma.vote
      .create({
        data: { billetId: ticket.id, eventId, voteOptionId: option.id },
      })
      .catch((error) => {
        if (error.code === "P2002")
          throw new HttpError(409, "Billet déjà voté pour cet événement");
        throw error;
      });
    return res.status(201).json({
      vote_id: vote.id,
      event_id: vote.eventId,
      vote_option_id: vote.voteOptionId,
      created_at: vote.createdAt,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { createVote, createVoteOption, listVoteOptions };
