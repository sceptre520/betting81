const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const playerSchema = new mongoose.Schema({
  playerName: {
    type: String,
    trim: true,
    required: true,
    maxlength: 64,
  },
  BDL_id: {
    type: Number,
    required: true,
  },
  position: {
    type: String,
  },
  teamAbbrev: {
    type: String,
  },
  height: {
    type: String,
  },
  weight: {
    type: String,
  },
  league: {
    type: String,
  },
});

module.exports = mongoose.model("Player", playerSchema);
