const axios = require("axios");

const API_URL = "https://app.notify.lk/api/v1/send";

function formatPhoneNumber(phoneNumber) {
  const cleaned = String(phoneNumber || "").replace(/\D/g, "");

  if (cleaned.startsWith("94") && cleaned.length === 11) {
    return cleaned;
  }

  if (cleaned.startsWith("94") && cleaned.length === 12) {
    return cleaned.substring(1);
  }

  if (cleaned.length === 9 && cleaned.startsWith("7")) {
    return `94${cleaned}`;
  }

  if (cleaned.length === 10 && cleaned.startsWith("07")) {
    return `94${cleaned.substring(1)}`;
  }

  if (cleaned.length === 11) {
    return cleaned;
  }

  return cleaned;
}

async function sendSMS(phoneNumber, message) {
  const apiKey = process.env.NOTIFY_LK_API_KEY;
  const senderId = process.env.NOTIFY_LK_SENDER_ID || "NotifyDEMO";
  const userId = process.env.NOTIFY_LK_USER_ID;

  if (!apiKey || !userId) {
    const err = new Error(
      "API Key or User ID is missing. Please set NOTIFY_LK_API_KEY and NOTIFY_LK_USER_ID environment variables."
    );
    err.code = "SMS_NOT_CONFIGURED";
    throw err;
  }

  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

  try {
    const response = await axios.post(API_URL, null, {
      params: {
        user_id: userId,
        api_key: apiKey,
        sender_id: senderId,
        to: formattedPhoneNumber,
        message
      },
      timeout: 10000
    });

    if (response.data && response.data.status === "success") {
      return response.data;
    }

    const errorMessage = response.data && response.data.errors
      ? `Notify.lk API Error: ${JSON.stringify(response.data.errors)}`
      : "Failed to send SMS via Notify.lk API";

    throw new Error(errorMessage);
  } catch (error) {
    if (error.response && error.response.data) {
      const apiError = error.response.data.errors
        ? `Notify.lk API Error: ${JSON.stringify(error.response.data.errors)}`
        : `HTTP ${error.response.status}: ${error.response.statusText}`;
      throw new Error(apiError);
    }

    throw error;
  }
}

module.exports = { sendSMS, formatPhoneNumber };
