const crypto = require("crypto");
module.exports = (prefix = "BAR") =>
  `${prefix}-${Date.now().toString().slice(-10)}${crypto.randomInt(100, 999)}`;
