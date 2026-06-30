const Purchase = require("../models/Purchase");
const seq = require("./sequenceGenerator");
module.exports = () => seq(Purchase, "purchaseNo", "PUR");
