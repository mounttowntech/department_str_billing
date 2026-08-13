const jwt = require("jsonwebtoken");

// ==========================================================
// AUTHENTICATION MIDDLEWARE
// ==========================================================

const verifyToken = (req, res, next) => {
  try {
    // ========================================================
    // GET AUTHORIZATION HEADER
    // ========================================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is required",
      });
    }

    // ========================================================
    // CHECK BEARER TOKEN
    // ========================================================

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    // ========================================================
    // EXTRACT TOKEN
    // ========================================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not provided",
      });
    }

    // ========================================================
    // VERIFY TOKEN
    // ========================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

 

    // ========================================================
    // VALIDATE USER ID
    // ========================================================

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // ========================================================
    // SET USER INFORMATION
    // ========================================================

    req.user = {
      id: decoded.id,
      role: decoded.role || null,
      store: decoded.store || null,
      email: decoded.email || null,
    };

    

    // ========================================================
    // CONTINUE
    // ========================================================

    next();

  } catch (error) {
    console.error(
      "Authentication Error:",
      error.message
    );

    // ========================================================
    // TOKEN EXPIRED
    // ========================================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    // ========================================================
    // INVALID TOKEN
    // ========================================================

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // ========================================================
    // OTHER ERROR
    // ========================================================

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = {
  verifyToken,
};