const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    lastLoginAt: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false }
  },
  { timestamps: true },
{ collection: 'users' });



module.exports = mongoose.model("User", UserSchema);
