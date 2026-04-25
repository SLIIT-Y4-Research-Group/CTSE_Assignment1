const axios = require("axios");

function getNotificationBaseUrl() {
  return process.env.NOTIFICATION_SERVICE_URL || "http://api-gateway/api/notifications";
}

async function sendPaymentInvoiceEmail(payment) {
  const baseUrl = getNotificationBaseUrl();

  const subject = "Payment Successful - Invoice";

  const text = `
Hello,

Your payment was successful.

Invoice Details:
Payment ID: ${payment._id}
User ID: ${payment.user_id}
Event ID: ${payment.event_id}
Ticket ID: ${payment.ticket_id}
Quantity: ${payment.quantity}
Total Amount: ${payment.currency} ${payment.total_amount}
Payment Status: ${payment.payment_status}
Paid At: ${new Date().toLocaleString()}

Thank you.
`;

  const html = `
    <h2>Payment Successful</h2>
    <p>Your payment was completed successfully.</p>

    <h3>Invoice Details</h3>
    <table border="1" cellpadding="8" cellspacing="0">
      <tr><td><b>Payment ID</b></td><td>${payment._id}</td></tr>
      <tr><td><b>User ID</b></td><td>${payment.user_id}</td></tr>
      <tr><td><b>Event ID</b></td><td>${payment.event_id}</td></tr>
      <tr><td><b>Ticket ID</b></td><td>${payment.ticket_id}</td></tr>
      <tr><td><b>Quantity</b></td><td>${payment.quantity}</td></tr>
      <tr><td><b>Total Amount</b></td><td>${payment.currency} ${payment.total_amount}</td></tr>
      <tr><td><b>Status</b></td><td>${payment.payment_status}</td></tr>
      <tr><td><b>Paid At</b></td><td>${new Date().toLocaleString()}</td></tr>
    </table>

    <p>Thank you.</p>
  `;

  return axios.post(
    `${baseUrl}/api/notify/email`,
    {
      to: payment.user_email,
      subject,
      text,
      html,
    },
    { timeout: 10000 }
  );
}

module.exports = { sendPaymentInvoiceEmail };