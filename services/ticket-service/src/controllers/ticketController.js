const Ticket = require('../models/Ticket');
const { verifyEvent } = require('../utils/eventService');

exports.createTicket = async (req, res) => {
  try {
    const { event_id } = req.body;

    // Verify event exists in Event Service
    await verifyEvent(event_id);

    const ticket = await Ticket.create(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTicket = async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(ticket);
};

exports.deleteTicket = async (req, res) => {
  await Ticket.findByIdAndDelete(req.params.id);
  res.json({ message: 'Ticket deleted' });
};

exports.getTickets = async (req, res) => {
  const tickets = await Ticket.find();
  res.json(tickets);
};

exports.getTicketsByEvent = async (req, res) => {
  const tickets = await Ticket.find({ event_id: req.params.eventId });
  res.json(tickets);
};

exports.getTicketDetails = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  res.json(ticket);
};

exports.getAvailability = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  res.json({ available: ticket.quantity - ticket.sold });
};