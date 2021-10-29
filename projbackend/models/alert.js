const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const alertSchema = new mongoose.Schema({
  alertDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  medium: {
    type: String,
    maxlength: 32,
  },
  alertText: {
    type: String,
    maxlength: 200,
  },
  matchId: {
    type: ObjectId,
    ref: "Match",
    required: true,
  },
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
});

module.exports = mongoose.model("Alert", alertSchema);
