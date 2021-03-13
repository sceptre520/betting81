const express = require("express");
const router = express.Router();

const {
  getTeamById,
  createTeam,
  getTeam,
  getTeamLogo,
  getAllTeams,
} = require("../controllers/team");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

//all of params
router.param("userId", getUserById);
router.param("teamId", getTeamById);

//Team routes
//read
router.get("/team/:teamId", getTeam);
router.get("/team/logo/:teamId", getTeamLogo);

//create
router.post(
  "/team/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createTeam
);

//listing route
router.get("/teams", getAllTeams);

module.exports = router;
