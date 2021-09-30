const express = require("express");
const router = express.Router();

const { getMatchById } = require("../controllers/match");
const {
  getMatchMarkets,
  createMarket,
  createMarketFromScraper,
  deleteAllMarkets,
  getAllMarkets,
  deleteMarketsForOneSportsbook,
} = require("../controllers/market");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

//all of params
router.param("userId", getUserById);
router.param("matchId", getMatchById);

//Market routes
//read
router.get("/markets/:matchId", getMatchMarkets); //May be buggy

//read
router.get("/markets", getAllMarkets); //May be buggy

//create
router.post(
  "/market/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createMarket
);

router.post("/scraper/market/create", createMarketFromScraper);

//delete route
router.delete("/markets/delete", deleteAllMarkets);
router.delete("/markets/delete/:sportsbook", deleteMarketsForOneSportsbook);

module.exports = router;
