exports.success = (res, message, data = null, status = 200) =>
  res.status(status).json({ success: true, message, data });
exports.fail = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });
