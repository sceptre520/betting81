const ExternalMatch = require("../models/externalMatch");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getAllExternalMatches = (req, res) => {
  ExternalMatch.find().exec((err, matches) => {
    if (err) {
      return res.status(400).json({
        error: "NO matches FOUND",
      });
    }
    res.json(matches);
  });
};

exports.createExternalMatchFromScraper = (req, res) => {
  let fields = req.body;

  //destructure the fields
  const { name, league, sportsbook } = fields;

  if (!name || !league || !sportsbook) {
    return res.status(400).json({
      error: "Please include name,league,sportsbook (at least)",
    });
  }

  let match = new ExternalMatch(fields);

  //save to the DB
  match.save((err, match) => {
    if (err) {
      res.status(400).json({
        error: "Saving match in DB failed",
      });
    }
    res.json(match);
  });
};

// delete controllers
exports.deleteAllExternalMatches = (req, res) => {
  ExternalMatch.remove({}, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to delete the matches",
      });
    }
    res.json({
      message: "Deletion was a success",
    });
  });
};
