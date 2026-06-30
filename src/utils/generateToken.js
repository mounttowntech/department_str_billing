const jwt = require("jsonwebtoken");
module.exports = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, store: user.store },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
