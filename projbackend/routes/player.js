const express = require("express");
const router = express.Router();

const {
  getAllPlayers,
  createPlayerFromScraper,
} = require("../controllers/player");

router.get("/players", getAllPlayers);

//create
router.post("/scraper/players/create", createPlayerFromScraper);

module.exports = router;
