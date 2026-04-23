const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  ticket_type: { type: String, required: true },
  description: String,

  price: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },

  quantity: { type: Number, required: true },
  sold: { type: Number, default: 0 },

  max_per_user: { type: Number, default: 10 },

  sale_start: Date,
  sale_end: Date,

  status: {
    type: String,
    enum: ['ACTIVE', 'SOLD_OUT', 'CANCELLED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);