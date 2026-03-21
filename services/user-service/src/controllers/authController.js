const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");

function signToken(user) {
  const roleId = user.role?._id
    ? user.role._id.toString()
    : user.role?.toString();
  const roleName = user.role?.name;

  return jwt.sign(
    { sub: user._id.toString(), roleId, roleName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "name, email, and password are required" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const role = await Role.findOne({ name: "attendee" });
  if (!role) {
    return res.status(500).json({ message: "Default role not configured" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role._id,
  });

  const userWithRole = await User.findById(user._id).populate("role");
  const token = signToken(userWithRole || user);
  return res.status(201).json({ user: user.toJSON(), token });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).populate(
    "role",
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.status !== "active") {
    return res.status(403).json({ message: "User is disabled" });
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  return res.json({
    user: user.toJSON(),
    token,
    mustChangePassword: user.mustChangePassword,
  });
}

module.exports = { register, login };
