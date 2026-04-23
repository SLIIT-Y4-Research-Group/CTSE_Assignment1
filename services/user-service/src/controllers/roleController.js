const Role = require("../models/Role");
const User = require("../models/User");

async function listRoles(req, res) {
  const roles = await Role.find({}).sort({ name: 1 });
  return res.json({ roles });
}

async function createRole(req, res) {
  const { name, permissions = [] } = req.body;

  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }

  const existing = await Role.findOne({ name: name.trim() });
  if (existing) {
    return res.status(409).json({ message: "Role already exists" });
  }

  const role = await Role.create({ name: name.trim(), permissions });
  return res.status(201).json({ role });
}

async function updateRole(req, res) {
  const { id } = req.params;
  const { name, permissions } = req.body;

  const update = {};
  if (name) update.name = name.trim();
  if (Array.isArray(permissions)) update.permissions = permissions;

  const role = await Role.findByIdAndUpdate(id, update, { new: true });
  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }

  return res.json({ role });
}

async function deleteRole(req, res) {
  const { id } = req.params;

  const inUse = await User.exists({ role: id });
  if (inUse) {
    return res.status(400).json({ message: "Role is assigned to users" });
  }

  const role = await Role.findByIdAndDelete(id);
  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }

  return res.json({ message: "Role deleted" });
}

module.exports = { listRoles, createRole, updateRole, deleteRole };
