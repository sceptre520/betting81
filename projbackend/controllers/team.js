const Team = require("../models/team");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getTeamById = (req, res, next, id) => {
  Team.findById(id).exec((err, team) => {
    if (err) {
      return res.status(400).json({
        error: "Team not found",
      });
    }
    req.team = team;
    next();
  });
};

exports.createTeam = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "problem with image",
      });
    }
    //destructure the fields
    const { name, abbrev, info } = fields;

    if (!name || !abbrev || !info) {
      return res.status(400).json({
        error: "Please include all fields",
      });
    }

    let team = new Team(fields);

    //handle file here
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "File size too big!",
        });
      }
      team.logo.data = fs.readFileSync(file.photo.path);
      team.logo.contentType = file.photo.type;
    }
    //save to the DB
    team.save((err, team) => {
      if (err) {
        res.status(400).json({
          error: "Saving team in DB failed",
        });
      }
      res.json(team);
    });
  });
};

exports.getTeam = (req, res) => {
  req.team.logo = undefined;
  return res.json(req.team);
};

//middleware
exports.getTeamLogo = (req, res, next) => {
  if (req.team.logo.data) {
    res.set("Content-Type", req.team.logo.contentType);
    return res.send(req.team.logo.data);
  }
  next();
};

exports.getAllTeams = (req, res) => {
  let sortBy = req.query.sortBy ? req.query.sortBy : "name";

  Team.find()
    .select("-logo")
    .sort([[sortBy, "asc"]])
    .exec((err, teams) => {
      if (err) {
        return res.status(400).json({
          error: "NO matches FOUND",
        });
      }
      res.json(teams);
    });
};
