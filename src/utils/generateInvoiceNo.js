const SalesInvoice = require("../models/SalesInvoice");
const seq = require("./sequenceGenerator");
module.exports = () => seq(SalesInvoice, "invoiceNo", "INV");
