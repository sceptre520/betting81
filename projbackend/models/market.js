const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const marketSchema = new mongoose.Schema({
  player: {
    type: String,
    trim: true,
    required: true,
    maxlength: 64,
  },
  marketType: {
    type: String,
    trim: true,
    required: true,
    maxlength: 32,
  },
  sportsbook: {
    type: String,
    trim: true,
    required: true,
    maxlength: 32,
  },
  overPrice: {
    type: Number,
    required: true,
  },
  underPrice: {
    type: Number,
  },
  handicap: {
    type: Number,
  },
  matchId: {
    type: ObjectId,
    ref: "Match",
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    trim: true,
    maxlength: 32,
    default: "CRON",
  },
});

module.exports = mongoose.model("Market", marketSchema);
