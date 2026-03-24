const Ticket = require("../models/Ticket");
const { verifyEvent } = require("../utils/eventService");

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
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(ticket);
};

exports.deleteTicket = async (req, res) => {
  await Ticket.findByIdAndDelete(req.params.id);
  res.json({ message: "Ticket deleted" });
};

exports.getTickets = async (req, res) => {
  const tickets = await Ticket.find();
  res.json(tickets);
};

exports.getTicketsByEvent = async (req, res) => {
  const tickets = await Ticket.find({ event_id: req.params.eventId });
  res.json(tickets);
};

exports.getEventTicketSummary = async (req, res) => {
  try {
    const { eventId } = req.params;
    const tickets = await Ticket.find({ event_id: eventId });

    const totals = tickets.reduce(
      (acc, ticket) => {
        acc.total_quantity += ticket.quantity;
        acc.total_sold += ticket.sold;
        return acc;
      },
      { total_quantity: 0, total_sold: 0 },
    );

    const total_available = totals.total_quantity - totals.total_sold;

    return res.json({
      event_id: eventId,
      ticket_type_count: tickets.length,
      total_quantity: totals.total_quantity,
      total_sold: totals.total_sold,
      total_available,
      has_tickets: tickets.length > 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.cancelTicketsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const matched = await Ticket.countDocuments({ event_id: eventId });
    if (matched === 0) {
      return res.json({
        message: "No tickets found for this event",
        event_id: eventId,
        matched: 0,
        modified: 0,
      });
    }

    const result = await Ticket.updateMany(
      { event_id: eventId },
      { $set: { status: "CANCELLED" } },
    );

    return res.json({
      message: "All tickets for event cancelled successfully",
      event_id: eventId,
      matched,
      modified: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getTicketDetails = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  res.json(ticket);
};

exports.getAvailability = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  res.json({ available: ticket.quantity - ticket.sold });
};
