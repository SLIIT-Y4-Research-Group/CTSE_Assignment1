const axios = require("axios");

// Notification Service is routed through API Gateway in this architecture.
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3000";

async function sendEventEmailNotification({ to, subject, text, html }) {
  const url = `${NOTIFICATION_SERVICE_URL}/api/notify/email`;

  try {
    console.log(`[notificationClient] email POST ${url} -> ${to}`);
    const response = await axios.post(url, { to, subject, text, html });
    console.log(`[notificationClient] email notification sent to ${to}`);

    return response.data;
  } catch (err) {
    console.error(
      `[notificationClient] email notification failed (${url}): ${err.message}`,
    );
    throw new Error(`Failed to send email notification: ${err.message}`);
  }
}

async function sendEventSmsNotification({ to, message }) {
  const url = `${NOTIFICATION_SERVICE_URL}/api/notify/sms`;

  try {
    console.log(`[notificationClient] sms POST ${url} -> ${to}`);
    const response = await axios.post(url, { to, message });
    console.log(`[notificationClient] sms notification sent to ${to}`);

    return response.data;
  } catch (err) {
    console.error(
      `[notificationClient] sms notification failed (${url}): ${err.message}`,
    );
    throw new Error(`Failed to send SMS notification: ${err.message}`);
  }
}

module.exports = {
  sendEventEmailNotification,
  sendEventSmsNotification,
};
