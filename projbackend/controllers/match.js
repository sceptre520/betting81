const Match = require("../models/match");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getMatchById = (req, res, next, id) => {
  Match.findById(id)
    .populate("homeTeam")
    .populate("awayTeam")
    .exec((err, match) => {
      if (err) {
        return res.status(400).json({
          error: "Match not found",
        });
      }
      req.match = match;
      next();
    });
};

exports.createMatch = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "problem with image",
      });
    }
    //destructure the fields
    const { name, league, date, homeTeam, awayTeam } = fields;

    if (!name || !league || !date || !homeTeam || !awayTeam) {
      return res.status(400).json({
        error: "Please include all fields",
      });
    }

    let match = new Match(fields);

    //save to the DB
    match.save((err, match) => {
      if (err) {
        res.status(400).json({
          error: "Saving match in DB failed",
        });
      }
      res.json(match);
    });
  });
};

exports.createMatchFromScraper = (req, res) => {
  let fields = req.body;

  //destructure the fields
  const { name, league, date, homeTeam, awayTeam } = fields;

  if (!name || !league || !date || !homeTeam || !awayTeam) {
    return res.status(400).json({
      error: "Please include all fields",
    });
  }

  let match = new Match(fields);

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

exports.getMatch = (req, res) => {
  return res.json(req.match);
};

exports.getAllMatches = (req, res) => {
  let sortBy = req.query.sortBy ? req.query.sortBy : "date";

  Match.find()
    .populate("homeTeam")
    .select("-homeTeam.logo")
    .populate("awayTeam")
    .select("-awayTeam.logo")
    .sort([[sortBy, "asc"]])
    .exec((err, matches) => {
      if (err) {
        return res.status(400).json({
          error: "NO matches FOUND",
        });
      }
      res.json(matches);
    });
};

//middleware
exports.logo = (req, res, next) => {
  if (req.match.logo.data) {
    res.set("Content-Type", req.match.logo.contentType);
    return res.send(req.match.logo.data);
  }
  next();
};

// delete controllers
exports.deleteAllMatches = (req, res) => {
  Match.remove({}, (err) => {
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

exports.deleteOldMatches = (req, res) => {
  var datestamp = new Date();
  datestamp.setDate(datestamp.getDate() - 1);

  Match.deleteMany({ date: { $lt: datestamp } }, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to delete the old matches",
      });
    }
    res.json({
      message: "Deletion was a success",
    });
  });
};
