const Market = require("../models/market");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

//May be buggy
exports.getMatchMarkets = (req, res) => {
  Market.find({ matchId: req.match._id }).exec((err, markets) => {
    if (err) {
      return res.status(400).json({
        error: "Markets not found",
      });
    }
    res.json(markets);
  });
};

exports.createMarket = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields) => {
    if (err) {
      return res.status(400).json({
        error: "problem with inputs",
      });
    }
    //destructure the fields
    const {
      player,
      marketType,
      sportsbook,
      overPrice,
      underPrice,
      handicap,
      matchId,
    } = fields;

    if (!player || !marketType || !sportsbook || !overPrice || !matchId) {
      return res.status(400).json({
        error: "Please include all required fields",
      });
    }

    let market = new Market(fields);

    //save to the DB
    market.save((err, market) => {
      if (err) {
        res.status(400).json({
          error: "Saving market in DB failed",
        });
      }
      res.json(market);
    });
  });
};

exports.createMarketFromScraper = (req, res) => {
  let fields = req.body;

  //destructure the fields
  const { player, marketType, sportsbook, overPrice, matchId } = fields;

  if (!player || !marketType || !sportsbook || !overPrice || !matchId) {
    return res.status(400).json({
      error: "Please include all required fields",
    });
  }

  let market = new Market(fields);

  //save to the DB
  market.save((err, market) => {
    if (err) {
      res.status(400).json({
        error: "Saving market in DB failed",
      });
    }
    res.json(market);
  });
};

// exports.getMatch = (req, res) => {
//   return res.json(req.match);
// };

// exports.getAllMatches = (req, res) => {
//   let limit = req.query.limit ? parseInt(req.query.limit) : 9;
//   let sortBy = req.query.sortBy ? req.query.sortBy : "_id";

//   Match.find()
//     .populate("homeTeam")
//     .select("-homeTeam.logo")
//     .populate("awayTeam")
//     .select("-awayTeam.logo")
//     .sort([[sortBy, "asc"]])
//     .limit(limit)
//     .exec((err, matches) => {
//       if (err) {
//         return res.status(400).json({
//           error: "NO matches FOUND",
//         });
//       }
//       res.json(matches);
//     });
// };

// //middleware
// exports.logo = (req, res, next) => {
//   if (req.match.logo.data) {
//     res.set("Content-Type", req.match.logo.contentType);
//     return res.send(req.match.logo.data);
//   }
//   next();
// };

exports.deleteAllMarkets = (req, res) => {
  Market.remove({}, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to delete the markets",
      });
    }
    res.json({
      message: "Deletion was a success",
    });
  });
};
