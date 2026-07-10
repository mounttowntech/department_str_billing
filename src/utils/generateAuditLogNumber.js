const AuditLog = require("../models/AuditLog");

module.exports = async () => {
  const lastLog = await AuditLog.findOne().sort({ createdAt: -1 });

  let number = 1;

  if (lastLog && lastLog.logNumber) {
    const last = parseInt(lastLog.logNumber.replace("LOG", ""));
    number = last + 1;
  }

  return `LOG${String(number).padStart(5, "0")}`;
};