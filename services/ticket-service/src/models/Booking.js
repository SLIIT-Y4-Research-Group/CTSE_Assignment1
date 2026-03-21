const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user_id: { type: String, required: true },

  tickets: [
    {
      ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
      quantity: { type: Number, required: true },
      price_at_booking: { type: Number, required: true }
    }
  ],

  total_amount: { type: Number, required: true },

  booking_status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'PENDING'
  },

  payment_status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },

  payment_id: String,

  booking_reference: { type: String, unique: true },

  booking_date: { type: Date, default: Date.now },
  cancelled_at: Date
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
