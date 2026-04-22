const axios = require("axios");

const EVENT_SERVICE_URL =
  process.env.EVENT_SERVICE_URL || "http://api-gateway:80";

const verifyEvent = async (eventId) => {
  const url = `${EVENT_SERVICE_URL}/api/events/${eventId}/validate`;

  try {
    console.log("Calling Event via Gateway:", url);

    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { exists: false };
    }

    console.error("Event verification failed:", error.message);
    throw new Error(`Event validation failed: ${error.message}`);
  }
};

module.exports = { verifyEvent };
