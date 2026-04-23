const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    event_id: {
      type: String,
      required: true,
    },
    ticket_id: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "LKR",
    },
    payment_status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    stripe_session_id: {
      type: String,
    },
    stripe_payment_intent_id: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);