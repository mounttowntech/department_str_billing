const Payment = require("../models/Payment");
const seq = require("./sequenceGenerator");
module.exports = () => seq(Payment, "paymentNumber", "PAY");
