const express = require("express");
const router = express.Router();

const {
  getMatchById,
  createMatch,
  getMatch,
  getAllMatches,
  createMatchFromScraper,
  deleteAllMatches,
} = require("../controllers/match");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");
const { getTeamById } = require("../controllers/team");

//all of params
router.param("userId", getUserById);
router.param("teamId", getTeamById);
router.param("matchId", getMatchById);

//Team routes
//read
router.get("/match/:matchId", getMatch);

//create
router.post(
  "/match/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createMatch
);

//create
router.post("/scraper/match/create", createMatchFromScraper);

//listing route
router.get("/matches", getAllMatches);

//delete route
router.delete("/matches/delete", deleteAllMatches);

module.exports = router;
