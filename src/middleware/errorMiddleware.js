const ApiError = require("../utils/ApiError");
exports.notFound = (req, res, next) =>
  next(new ApiError(`Route not found: ${req.originalUrl}`, 404));
exports.errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res
    .status(status)
    .json({
      success: false,
      message: err.message || "Server Error",
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    });
};
