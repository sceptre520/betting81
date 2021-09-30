const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const arbSchema = new mongoose.Schema({
  overMarketId: {
    type: ObjectId,
    ref: "Market",
    required: true,
  },
  underMarketId: {
    type: ObjectId,
    ref: "Market",
    required: true,
  },
  ArbOrMiddle: {
    type: String,
    maxlength: 32,
    default: "arb",
  },
});

module.exports = mongoose.model("Arb", arbSchema);
