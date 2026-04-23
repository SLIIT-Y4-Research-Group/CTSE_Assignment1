// testCreateTicket.js
const axios = require('axios');

const createTicket = async () => {
  try {
    const res = await axios.post('http://ticket-service:3000/api/tickets', {
      event_id: 'PUT_A_VALID_EVENT_ID_HERE',
      type: 'VIP',
      price: 1000,
      quantity: 50
    });
    console.log("Ticket created:", res.data);
  } catch (err) {
    console.error("Failed:", err.response?.data || err.message);
  }
};

createTicket();