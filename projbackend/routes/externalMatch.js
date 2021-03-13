const express = require("express");
const router = express.Router();

const {
  getAllExternalMatches,
  createExternalMatchFromScraper,
  deleteAllExternalMatches,
} = require("../controllers/externalMatch");

router.get("/externalMatches", getAllExternalMatches);

//create
router.post("/scraper/externalMatches/create", createExternalMatchFromScraper);

//delete route
router.delete("/externalmatches/delete", deleteAllExternalMatches);

module.exports = router;
