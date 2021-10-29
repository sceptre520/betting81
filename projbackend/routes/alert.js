const express = require("express");
const {
  createAlert,
  getAllAlerts,
  deleteAllAlerts,
} = require("../controllers/alert");
const router = express.Router();

//create
router.post("/alert/create", createAlert);

//read
router.get("/alert/all", getAllAlerts);

//delete
router.delete("/alert/delete", deleteAllAlerts);

module.exports = router;
