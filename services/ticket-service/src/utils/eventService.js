const axios = require('axios');

const verifyEvent = async (eventId) => {
  try {
    // This calls the Event Service API to check if the event exists
    const res = await axios.get(`${process.env.EVENT_SERVICE_URL}/${eventId}`);
    return res.data;
  } catch (error) {
    throw new Error('Event not found or service unavailable');
  }
};

module.exports = { verifyEvent };