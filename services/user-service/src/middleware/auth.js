const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).populate("role");

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "User is disabled" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requirePermissions(requiredPermissions = []) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(403).json({ message: "Role not assigned" });
    }

    if (role.permissions.includes("*")) {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) => role.permissions.includes(perm));
    if (!hasAll) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = { requireAuth, requirePermissions };
