const bcrypt = require("bcrypt");
const User = require("../models/User");
const Role = require("../models/Role");
const { sendNewUserEmail } = require("../utils/notificationClient");

async function getMe(req, res) {
  return res.json({ user: req.user.toJSON() });
}

async function listUsers(req, res) {
  const { role, status, q, limit = 20, page = 1 } = req.query;
  const query = {};

  if (role) {
    query.role = role;
  }

  if (status) {
    query.status = status;
  }

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } }
    ];
  }

  const safeLimit = Math.min(Number(limit) || 20, 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const [items, total] = await Promise.all([
    User.find(query)
      .populate("role")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    User.countDocuments(query)
  ]);

  return res.json({
    items: items.map((u) => u.toJSON()),
    total,
    page: safePage,
    limit: safeLimit
  });
}

async function createUser(req, res) {
  const { name, email, roleId } = req.body;

  if (!name || !email || !roleId) {
    return res.status(400).json({ message: "name, email, and roleId are required" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const role = await Role.findById(roleId);
  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD;
  if (!defaultPassword) {
    return res.status(500).json({ message: "DEFAULT_USER_PASSWORD is not set" });
  }

  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role._id,
    mustChangePassword: true
  });
  console.log(`Created user ${user.email} with role ${role.name}`);
  let emailStatus = "sent";
  try {
    console.log(`Sending notification email to ${email}...`);
    await sendNewUserEmail({
      to: email,
      name,
      email,
      password: defaultPassword,
      roleName: role.name
    });
  } catch (err) {
    console.error(`Failed to send notification email to ${email}:`, err.message);
    emailStatus = "failed";
  }
  console.log(`User ${email} created successfully. Email status: ${emailStatus}`);
  return res.status(201).json({ user: user.toJSON(), emailStatus });
}

async function updateUserRole(req, res) {
  const { id } = req.params;
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ message: "roleId is required" });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role: roleId },
    { new: true }
  ).populate("role");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: user.toJSON() });
}

async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["active", "disabled"].includes(status)) {
    return res.status(400).json({ message: "status must be active or disabled" });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate("role");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: user.toJSON() });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "newPassword is required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.mustChangePassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: "currentPassword is required" });
    }

    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  return res.json({ message: "Password updated" });
}

module.exports = {
  getMe,
  listUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  changePassword
};
