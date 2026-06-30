const StockLedger = require("../models/StockLedger");
module.exports = (data) => StockLedger.create(data);
