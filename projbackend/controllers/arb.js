const Arb = require("../models/arb");

exports.deleteAllArbs = (req, res) => {
  Arb.remove({}, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to delete the arbs",
      });
    }
    res.json({
      message: "Deletion was a success",
    });
  });
};

exports.createArb = (req, res) => {
  const arb = new Arb(req.body);
  arb.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "NOT able to save arb markets in DB",
      });
    }
    res.json({ data });
  });
};

exports.getAllArbs = (req, res) => {
  Arb.find()
    .populate("overMarketId")
    .populate("underMarketId")
    .populate({
      path: "overMarketId",
      populate: {
        path: "matchId",
        model: "Match",
      },
    })
    .exec((err, arbs) => {
      if (err) {
        return res.status(400).json({
          error: "NO arbs FOUND",
        });
      }
      res.json(arbs);
    });
};
