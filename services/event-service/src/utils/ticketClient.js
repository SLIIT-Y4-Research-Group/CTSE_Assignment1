const axios = require("axios");

// Ticket Service is accessed through API Gateway in this architecture.
const TICKET_SERVICE_URL =
  process.env.TICKET_SERVICE_URL || "http://api-gateway:80/api/tickets";

async function cancelEventTickets(eventId) {
  const url = `${TICKET_SERVICE_URL}/api/tickets/event/${eventId}/cancel`;

  try {
    const response = await axios.patch(url);
    return response.data;
  } catch (err) {
    throw new Error(
      `Failed to cancel tickets for event ${eventId}: ${err.message}`,
    );
  }
}

async function getEventTicketSummary(eventId) {
  const url = `${TICKET_SERVICE_URL}/api/tickets/event/${eventId}/summary`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    throw new Error(
      `Failed to fetch ticket summary for event ${eventId}: ${err.message}`,
    );
  }
}

module.exports = { cancelEventTickets, getEventTicketSummary };
