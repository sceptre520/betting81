const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const matchSchema = new mongoose.Schema({
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
    required: true,
  },
  homeTeam: {
    type: ObjectId,
    ref: "Team",
    required: true,
  },
  awayTeam: {
    type: ObjectId,
    ref: "Team",
    required: true,
  },
});

module.exports = mongoose.model("Match", matchSchema);
