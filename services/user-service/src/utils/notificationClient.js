const axios = require("axios");

function getNotificationBaseUrl() {
  return (
    process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3000"
  );
}

async function sendNewUserEmail({ to, name, email, password, roleName }) {
  const baseUrl = getNotificationBaseUrl();

  const subject = "Your Event Management System Account";
  const text =
    `Hello ${name},\n\n` +
    `An account has been created for you in the Event Management System.\n` +
    `Login email: ${email}\n` +
    `Temporary password: ${password}\n` +
    (roleName ? `Role: ${roleName}\n` : "") +
    `\nPlease log in and change your password immediately.\n` +
    `\nThanks.\n`;

  await axios.post(
    `${baseUrl}/api/notify/email`,
    { to, subject, text },
    { timeout: 10000 },
  );
}

module.exports = { sendNewUserEmail };
