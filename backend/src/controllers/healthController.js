exports.getHealth = (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "pay-on-backend",
    timestamp: new Date().toISOString(),
  });
};
