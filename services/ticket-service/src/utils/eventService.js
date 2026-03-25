const axios = require('axios');

const verifyEvent = async (eventId) => {
  try {
    const url = `${process.env.GATEWAY_URL}/${eventId}/`;
    console.log("Calling Event via Gateway:", url);

    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    console.error("Event verification failed:", error.message);
    throw new Error('Event not found or service unavailable');
  }
};

module.exports = { verifyEvent };