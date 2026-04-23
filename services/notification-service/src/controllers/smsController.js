const { sendSMS } = require("../utils/smsProvider");

async function sendSmsHandler(req, res) {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ message: "to and message are required" });
  }

  try {
    const result = await sendSMS(to, message);
    return res.json({ status: "sent", providerResponse: result });
  } catch (err) {
    if (err.code === "SMS_NOT_CONFIGURED") {
      return res.status(500).json({ message: "SMS provider not configured" });
    }

    return res.status(502).json({ message: "SMS send failed", error: err.message });
  }
}

module.exports = { sendSmsHandler };
