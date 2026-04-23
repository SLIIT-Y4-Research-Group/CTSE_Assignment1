const Role = require("../models/Role");

const DEFAULT_ROLES = [
  {
    name: "admin",
    permissions: ["*"]
  },
  {
    name: "event_manager",
    permissions: [
      "events:read",
      "events:write",
      "tickets:read",
      "tickets:write",
      "reports:read"
    ]
  },
  {
    name: "staff",
    permissions: ["events:read", "tickets:read"]
  },
  {
    name: "attendee",
    permissions: ["events:read", "tickets:read"]
  }
];

async function ensureDefaultRoles() {
  const existing = await Role.find({}, { name: 1 }).lean();
  const existingNames = new Set(existing.map((r) => r.name));

  const toCreate = DEFAULT_ROLES.filter((role) => !existingNames.has(role.name));
  if (toCreate.length > 0) {
    await Role.insertMany(toCreate);
  }
}

module.exports = { ensureDefaultRoles, DEFAULT_ROLES };
