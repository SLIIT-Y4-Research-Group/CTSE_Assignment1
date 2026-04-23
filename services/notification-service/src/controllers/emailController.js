const { sendEmail } = require("../utils/emailProvider");

async function sendEmailHandler(req, res) {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res
      .status(400)
      .json({ message: "to, subject, and text or html are required" });
  }

  try {
    const result = await sendEmail({ to, subject, text, html });
    return res.json({ status: "sent", providerResponse: result });
  } catch (err) {
    if (err.code === "SMTP_NOT_CONFIGURED") {
      return res.status(500).json({ message: "Email provider not configured" });
    }

    if (err.code === "EMAIL_INVALID") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(502).json({ message: "Email send failed", error: err.message });
  }
}

module.exports = { sendEmailHandler };
