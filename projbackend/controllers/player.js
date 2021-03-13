const Player = require("../models/player");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getAllPlayers = (req, res) => {
  Player.find().exec((err, players) => {
    if (err) {
      return res.status(400).json({
        error: "NO players FOUND",
      });
    }
    res.json(players);
  });
};

exports.createPlayerFromScraper = (req, res) => {
  let fields = req.body;

  //destructure the fields
  const { playerName, BDL_id } = fields;

  if (!playerName || !BDL_id) {
    return res.status(400).json({
      error: "Please include player name and id",
    });
  }

  let player = new Player(fields);

  //save to the DB
  player.save((err, player) => {
    if (err) {
      res.status(400).json({
        error: "Saving player in DB failed",
      });
    }
    res.json(player);
  });
};
