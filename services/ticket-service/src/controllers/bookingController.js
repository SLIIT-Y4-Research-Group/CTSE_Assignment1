const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const { generateBookingReference } = require('../utils/helpers');
const { getUserById } = require('../utils/userService');

exports.bookTickets = async (req, res) => {
  const { user_id, tickets } = req.body;

  try {
    // Verify user exists via User Service
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    let totalAmount = 0;
    let ticketDetails = [];

    for (let item of tickets) {
      const ticket = await Ticket.findById(item.ticket_id);

      const available = ticket.quantity - ticket.sold;
      if (available < item.quantity) return res.status(400).json({ message: 'Not enough tickets' });

      ticket.sold += item.quantity;
      await ticket.save();

      totalAmount += ticket.price * item.quantity;

      ticketDetails.push({
        ticket_id: ticket._id,
        quantity: item.quantity,
        price_at_booking: ticket.price
      });
    }

    const booking = await Booking.create({
      user_id,
      tickets: ticketDetails,
      total_amount: totalAmount,
      booking_reference: generateBookingReference()
    });

    res.status(201).json(booking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingDetails = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('tickets.ticket_id');
  res.json(booking);
};

exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user_id: req.params.userId });
  res.json(bookings);
};

exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  for (let item of booking.tickets) {
    const ticket = await Ticket.findById(item.ticket_id);
    ticket.sold -= item.quantity;
    await ticket.save();
  }

  booking.booking_status = 'CANCELLED';
  booking.cancelled_at = new Date();
  await booking.save();

  res.json({ message: 'Booking cancelled' });
};

exports.confirmPayment = async (req, res) => {
  const { bookingId, payment_id } = req.body;

  const booking = await Booking.findById(bookingId);

  booking.payment_status = 'PAID';
  booking.booking_status = 'CONFIRMED';
  booking.payment_id = payment_id;

  await booking.save();

  res.json(booking);
};