const Alert = require("../models/alert");

exports.deleteAllAlerts = (req, res) => {
  Alert.remove({}, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Failed to delete the alerts",
      });
    }
    res.json({
      message: "Deletion was a success",
    });
  });
};

exports.createAlert = (req, res) => {
  const alert = new Alert(req.body);
  alert.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "NOT able to save alert in DB",
      });
    }
    res.json({ data });
  });
};

exports.getAllAlerts = (req, res) => {
  Alert.find().exec((err, alerts) => {
    if (err) {
      return res.status(400).json({
        error: "NO alerts FOUND",
      });
    }
    res.json(alerts);
  });
};
