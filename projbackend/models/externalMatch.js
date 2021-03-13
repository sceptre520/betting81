const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const externalMatchSchema = new mongoose.Schema({
  sportsbook: {
    type: String,
    trim: true,
    required: true,
    maxlength: 64,
  },
  name: {
    type: String,
    trim: true,
    required: true,
    maxlength: 64,
  },
  league: {
    type: String,
    trim: true,
    required: true,
    maxlength: 32,
  },
  date: {
    type: Date,
  },
  homeTeam: {
    type: String,
  },
  awayTeam: {
    type: String,
  },
  eventId: {
    type: String,
  },
  matchId: {
    type: ObjectId,
    ref: "Match",
  },
});

module.exports = mongoose.model("ExternalMatch", externalMatchSchema);
