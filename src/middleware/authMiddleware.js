const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) token = h.split(" ")[1];
  if (!token) throw new ApiError("Not authorized, token missing", 401);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).populate("role");
  if (!user || user.status !== "active")
    throw new ApiError("User not active or not found", 401);
  req.user = user;
  next();
});
exports.allowRoles =
  (...names) =>
  (req, res, next) => {
    const role = req.user?.role?.roleName;
    if (!names.includes(role))
      return next(new ApiError("Access denied for this role", 403));
    next();
  };
exports.checkPermission =
  (moduleName, action = "canView") =>
  (req, res, next) => {
    const role = req.user?.role;
    if (!role) return next(new ApiError("Role missing", 403));
    if (role.roleName === "Super Admin") return next();
    const p = (role.permissions || []).find((x) => x.module === moduleName);
    if (!p || !p[action])
      return next(
        new ApiError(`No permission for ${moduleName} ${action}`, 403),
      );
    next();
  };
