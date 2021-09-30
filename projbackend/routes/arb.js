const express = require("express");
const { createArb, getAllArbs, deleteAllArbs } = require("../controllers/arb");
const router = express.Router();

//create
router.post("/arb/create", createArb);

//read
router.get("/arb/all", getAllArbs);

//delete
router.delete("/arb/delete", deleteAllArbs);

module.exports = router;
