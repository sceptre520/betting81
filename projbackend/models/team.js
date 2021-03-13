var mongoose = require("mongoose");

var teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 32,
    trim: true,
  },
  abbrev: {
    type: String,
    maxlength: 3,
    trim: true,
  },
  info: {
    type: String,
    trim: true,
  },
  logo: {
    data: Buffer,
    contentType: String,
  },
});

module.exports = mongoose.model("Team", teamSchema);
